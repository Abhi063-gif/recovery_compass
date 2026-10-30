import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OcrService } from '../ocr/ocr.service';
import { LlmExtractionService } from './llm/llm-extraction.service';
import { ExtractionSchemaValidator } from './validators/extraction-schema.validator';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { RagService } from '../rag/rag.service';
import { ExtractionStatus, ExtractionCategory, ConfidenceLevel, ValidationStatus } from '@prisma/client';
import { RootExtraction } from './schemas/extraction.schema';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExtractionService {
  private readonly highThreshold: number;
  private readonly mediumThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrService: OcrService,
    private readonly llmService: LlmExtractionService,
    private readonly validator: ExtractionSchemaValidator,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly ragService: RagService,
    private readonly logger: LoggerService,
    private readonly cfg: ConfigService,
  ) {
    this.logger.setContext(ExtractionService.name);
    this.highThreshold = cfg.get<number>('CONFIDENCE_HIGH_THRESHOLD', 0.85);
    this.mediumThreshold = cfg.get<number>('CONFIDENCE_MEDIUM_THRESHOLD', 0.60);
  }

  /**
   * Run the full extraction pipeline for a document.
   *
   * Pipeline:
   * 1. Load document from storage
   * 2. Run OCR (already done in previous step — use stored text)
   * 3. Send to LLM with safety prompt
   * 4. Validate LLM output against Zod schema (REJECT if invalid)
   * 5. Persist as ExtractionField records (status: PENDING VERIFICATION)
   * 6. Return for human verification — NEVER auto-activate
   */
  async runExtraction(documentId: string, patientProfileId: string): Promise<string> {
    // ─── Create extraction record ──────────────────────────────────────────────
    const extraction = await this.prisma.extraction.create({
      data: {
        documentId,
        status: ExtractionStatus.IN_PROGRESS,
        llmModel: this.cfg.get<string>('GEMINI_MODEL', this.cfg.get<string>('OPENAI_MODEL', 'gemini-1.5-pro')),
        schemaVersion: '1.0',
      },
    });

    try {
      // ─── Step 1: RAG Indexing (chunk → embed → store vectors) ─────────────────
      this.logger.log(`[Extraction] Running RAG indexing for document ${documentId}`);
      await this.ragService.indexDocument(documentId);

      // ─── Step 2: RAG Retrieval (retrieve grounded context per category) ───────
      this.logger.log(`[Extraction] Retrieving grounded context for document ${documentId}`);
      const groundedContext = await this.ragService.retrieveExtractionContext(documentId);

      if (!groundedContext.trim()) {
        // Fallback: use full document text if RAG returns nothing
        this.logger.warn(`[Extraction] RAG returned empty context for ${documentId} — falling back to full text`);
      }

      // Use RAG-grounded context; fall back to full text if RAG is unavailable
      const extractionContext = groundedContext.trim() ||
        await this.ragService.getFullDocumentText(documentId);

      if (!extractionContext.trim()) {
        throw new Error('No text content found in document');
      }

      // ─── Step 3: LLM extraction with RAG-grounded context ─────────────────────
      // The LLM receives ONLY retrieved document context — not general medical knowledge
      const rawExtraction = await this.llmService.extract(extractionContext, documentId);

      // ─── Store raw LLM output for audit (never shown to users as-is) ───────
      await this.prisma.extraction.update({
        where: { id: extraction.id },
        data: {
          rawLlmOutput: JSON.stringify(rawExtraction), // audit only
          status: ExtractionStatus.IN_PROGRESS,
        },
      });

      // ─── Persist extraction fields ─────────────────────────────────────────
      await this.persistExtractionFields(extraction.id, rawExtraction);

      // ─── Update status to NEEDS_REVIEW (never auto-confirmed) ─────────────
      await this.prisma.extraction.update({
        where: { id: extraction.id },
        data: { status: ExtractionStatus.NEEDS_REVIEW },
      });

      this.logger.log(`Extraction ${extraction.id} complete — awaiting human verification`);

      return extraction.id;
    } catch (error) {
      await this.prisma.extraction.update({
        where: { id: extraction.id },
        data: { status: ExtractionStatus.FAILED },
      });
      this.logger.error(`Extraction failed for document ${documentId}`, error as Error);
      throw error;
    }
  }

  async getExtraction(extractionId: string) {
    const extraction = await this.prisma.extraction.findUnique({
      where: { id: extractionId },
      include: {
        fields: {
          where: { deletedAt: null },
          orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
        },
        document: {
          select: { id: true, originalFileName: true, status: true, patientProfileId: true },
        },
      },
    });

    if (!extraction) throw new NotFoundException('Extraction not found');

    return extraction;
  }

  async updateField(
    extractionId: string,
    fieldId: string,
    value: string,
    userId: string,
    notes?: string,
  ) {
    const field = await this.prisma.extractionField.findFirst({
      where: { id: fieldId, extractionId, deletedAt: null },
    });

    if (!field) throw new NotFoundException('Extraction field not found');

    const updated = await this.prisma.extractionField.update({
      where: { id: fieldId },
      data: {
        editedValue: value,
        editedAt: new Date(),
        editedBy: userId,
        notes,
        validationStatus: ValidationStatus.NEEDS_REVIEW,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'EXTRACTION_FIELD_EDITED',
      resourceType: 'ExtractionField',
      resourceId: fieldId,
      metadata: {
        extractionId,
        fieldKey: field.fieldKey,
        category: field.category,
        previousValue: field.value,
        newValue: value,
      },
    });

    return updated;
  }

  async markUnclear(extractionId: string, fieldId: string, userId: string, notes?: string) {
    const field = await this.prisma.extractionField.findFirst({
      where: { id: fieldId, extractionId },
    });
    if (!field) throw new NotFoundException('Field not found');

    return this.prisma.extractionField.update({
      where: { id: fieldId },
      data: { isUnclear: true, notes, validationStatus: ValidationStatus.UNCLEAR },
    });
  }

  async confirmExtraction(extractionId: string, userId: string) {
    const extraction = await this.prisma.extraction.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) throw new NotFoundException('Extraction not found');

    if (extraction.status === ExtractionStatus.CONFIRMED) {
      throw new BadRequestException('Extraction is already confirmed');
    }

    // Confirm all non-unclear fields
    await this.prisma.extractionField.updateMany({
      where: {
        extractionId,
        isUnclear: false,
        deletedAt: null,
      },
      data: {
        validationStatus: ValidationStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
    });

    const confirmed = await this.prisma.extraction.update({
      where: { id: extractionId },
      data: {
        status: ExtractionStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'EXTRACTION_CONFIRMED',
      resourceType: 'Extraction',
      resourceId: extractionId,
    });

    return confirmed;
  }

  async getSourceReference(extractionId: string, fieldId: string) {
    const field = await this.prisma.extractionField.findFirst({
      where: { id: fieldId, extractionId },
      include: {
        sourceRegion: {
          include: { page: { select: { pageNumber: true, documentId: true } } },
        },
      },
    });

    if (!field) throw new NotFoundException('Field not found');

    return {
      fieldKey: field.fieldKey,
      category: field.category,
      sourceText: field.sourceText,
      page: field.page,
      boundingBox: field.boundingBox,
      sourceRegion: field.sourceRegion,
    };
  }

  private async persistExtractionFields(
    extractionId: string,
    data: RootExtraction,
  ): Promise<void> {
    const fields: Array<{
      extractionId: string;
      category: ExtractionCategory;
      fieldKey: string;
      value: string | null;
      rawValue: string | null;
      sourceText: string | null;
      page: number | null;
      boundingBox: any;
      confidence: number;
      confidenceLevel: ConfidenceLevel;
      validationStatus: ValidationStatus;
      isUnclear: boolean;
    }> = [];

    const buildField = (
      category: ExtractionCategory,
      key: string,
      f: any,
    ) => {
      if (!f) return;
      const confidence = f.confidence ?? 0;
      const level = this.getConfidenceLevel(confidence);
      fields.push({
        extractionId,
        category,
        fieldKey: key,
        value: f.value ?? null,
        rawValue: f.value ?? null,
        sourceText: f.sourceText ?? null,
        page: f.page ?? null,
        boundingBox: f.boundingBox ?? null,
        confidence,
        confidenceLevel: level,
        validationStatus:
          f.isUncertain
            ? ValidationStatus.UNCLEAR
            : level === ConfidenceLevel.LOW
            ? ValidationStatus.NEEDS_REVIEW
            : ValidationStatus.NEEDS_REVIEW,
        isUnclear: f.isUncertain ?? false,
      });
    };

    // Surgery/discharge metadata
    buildField(ExtractionCategory.TASKS, 'surgeryDate', data.surgeryDate);
    buildField(ExtractionCategory.TASKS, 'dischargeDate', data.dischargeDate);
    buildField(ExtractionCategory.TASKS, 'clinicianName', data.clinicianName);
    buildField(ExtractionCategory.TASKS, 'hospitalName', data.hospitalName);

    // Medicines
    data.medicines.forEach((med, i) => {
      const prefix = `medicine[${i}]`;
      buildField(ExtractionCategory.MEDICINES, `${prefix}.name`, med.name);
      buildField(ExtractionCategory.MEDICINES, `${prefix}.dose`, med.dose);
      buildField(ExtractionCategory.MEDICINES, `${prefix}.doseUnit`, med.doseUnit);
      buildField(ExtractionCategory.MEDICINES, `${prefix}.frequency`, med.frequency);
      if (med.timing) buildField(ExtractionCategory.MEDICINES, `${prefix}.timing`, med.timing);
      if (med.duration) buildField(ExtractionCategory.MEDICINES, `${prefix}.duration`, med.duration);
      if (med.instructions) buildField(ExtractionCategory.MEDICINES, `${prefix}.instructions`, med.instructions);
    });

    // Follow-ups
    data.followUps.forEach((fu, i) => {
      const prefix = `followUp[${i}]`;
      buildField(ExtractionCategory.FOLLOW_UPS, `${prefix}.type`, fu.type);
      buildField(ExtractionCategory.FOLLOW_UPS, `${prefix}.date`, fu.date);
      if (fu.clinician) buildField(ExtractionCategory.FOLLOW_UPS, `${prefix}.clinician`, fu.clinician);
      if (fu.purpose) buildField(ExtractionCategory.FOLLOW_UPS, `${prefix}.purpose`, fu.purpose);
    });

    // Tests
    data.tests.forEach((test, i) => {
      buildField(ExtractionCategory.TESTS, `test[${i}].name`, test.name);
      if (test.timing) buildField(ExtractionCategory.TESTS, `test[${i}].timing`, test.timing);
    });

    // Restrictions
    data.restrictions.forEach((r, i) => {
      buildField(ExtractionCategory.RESTRICTIONS, `restriction[${i}]`, r.restriction);
    });

    // Diet
    data.diet.forEach((d, i) => {
      buildField(ExtractionCategory.DIET, `diet[${i}]`, d.instruction);
    });

    // Hydration
    data.hydration.forEach((h, i) => {
      buildField(ExtractionCategory.HYDRATION, `hydration[${i}]`, h.instruction);
    });

    // Tasks
    data.tasks.forEach((t, i) => {
      buildField(ExtractionCategory.TASKS, `task[${i}]`, t.task);
    });

    // Symptoms
    data.symptoms.forEach((s, i) => {
      buildField(ExtractionCategory.SYMPTOMS, `symptom[${i}]`, s.symptom);
      if (s.threshold) buildField(ExtractionCategory.SYMPTOMS, `symptom[${i}].threshold`, s.threshold);
    });

    // Red flags
    data.redFlags.forEach((rf, i) => {
      buildField(ExtractionCategory.RED_FLAGS, `redFlag[${i}].sign`, rf.sign);
      buildField(ExtractionCategory.RED_FLAGS, `redFlag[${i}].action`, rf.action);
    });

    // Conditional instructions
    data.conditionalInstructions.forEach((ci, i) => {
      buildField(ExtractionCategory.CONDITIONAL_INSTRUCTIONS, `conditional[${i}]`, ci.instruction);
    });

    // Batch insert
    if (fields.length > 0) {
      await this.prisma.extractionField.createMany({ data: fields });
    }
  }

  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= this.highThreshold) return ConfidenceLevel.HIGH;
    if (confidence >= this.mediumThreshold) return ConfidenceLevel.MEDIUM;
    if (confidence > 0) return ConfidenceLevel.LOW;
    return ConfidenceLevel.UNCERTAIN;
  }
}
