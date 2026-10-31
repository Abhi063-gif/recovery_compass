import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DocumentQualityService } from '../documents/quality/document-quality.service';
import { OcrService } from '../ocr/ocr.service';
import { RagService } from '../rag/rag.service';
import { ExtractionService } from '../extraction/extraction.service';
import { DocumentStatus, QualityStatus, JobStatus } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';

export interface PipelineExecutionResult {
  success: boolean;
  documentId: string;
  status: DocumentStatus;
  extractionId?: string;
  error?: string;
}

@Injectable()
export class DocumentPipelineRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly qualityService: DocumentQualityService,
    private readonly ocrService: OcrService,
    private readonly ragService: RagService,
    private readonly extractionService: ExtractionService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DocumentPipelineRunner.name);
  }

  /**
   * Idempotent, resumable document processing execution.
   * Can be invoked either by BullMQ worker OR by the database fallback runner.
   */
  async execute(
    documentId: string,
    patientProfileId: string,
    dbJobId?: string,
  ): Promise<PipelineExecutionResult> {
    this.logger.log(`Starting document processing pipeline for document: ${documentId}`);

    const doc = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      this.logger.error(`Document ${documentId} not found in database`);
      return { success: false, documentId, status: DocumentStatus.PENDING, error: 'Document not found' };
    }

    // Idempotency: If already confirmed or archived, do not re-process
    if (doc.status === DocumentStatus.CONFIRMED || doc.status === DocumentStatus.ARCHIVED) {
      this.logger.log(`Document ${documentId} is already in state ${doc.status} — skipping pipeline`);
      return { success: true, documentId, status: doc.status };
    }

    // Ensure database ProcessingJob record exists and is marked RUNNING
    let processingJob = dbJobId
      ? await this.prisma.processingJob.findUnique({ where: { id: dbJobId } })
      : await this.prisma.processingJob.findFirst({
          where: { documentId, jobType: 'DOCUMENT_PROCESSING' },
          orderBy: { createdAt: 'desc' },
        });

    if (!processingJob) {
      processingJob = await this.prisma.processingJob.create({
        data: {
          documentId,
          jobType: 'DOCUMENT_PROCESSING',
          status: JobStatus.PROCESSING,
          attempt: 1,
          startedAt: new Date(),
        },
      });
    } else {
      await this.prisma.processingJob.update({
        where: { id: processingJob.id },
        data: {
          status: JobStatus.PROCESSING,
          attempt: (processingJob.attempt || 0) + 1,
          startedAt: new Date(),
          lastError: null,
        },
      });
    }

    try {
      // ─── Step 1: Quality Analysis ──────────────────────────────────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.QUALITY_ANALYSIS },
      });

      const fileBuffer = await this.storage.download(doc.storagePath);
      const qualityReport = await this.qualityService.analyzeImage(fileBuffer, doc.mimeType);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: {
          qualityStatus: qualityReport.status as QualityStatus,
          qualityIssues: qualityReport.issues,
          qualityReport: qualityReport as any,
        },
      });

      if (qualityReport.status === 'UNREADABLE') {
        const errorMsg = 'Document quality check failed: Image/PDF is unreadable or corrupted.';
        await this.prisma.sourceDocument.update({
          where: { id: documentId },
          data: { status: DocumentStatus.QUALITY_FAILED },
        });

        await this.prisma.processingJob.update({
          where: { id: processingJob.id },
          data: { status: JobStatus.FAILED, lastError: errorMsg, completedAt: new Date() },
        });

        this.logger.warn(`Document ${documentId} is UNREADABLE — aborting pipeline`);
        return { success: false, documentId, status: DocumentStatus.QUALITY_FAILED, error: errorMsg };
      }

      // ─── Step 2: OCR ──────────────────────────────────────────────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.OCR_PROCESSING },
      });

      const ocrResult = await this.ocrService.parseDocument(fileBuffer, doc.mimeType, documentId);
      const extractedText = await this.ocrService.getDocumentText(documentId);
      const cleanedText = extractedText.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');

      if (cleanedText.length < 10) {
        const errorMsg = 'No readable clinical text or prescriptions could be extracted from this document.';
        await this.prisma.sourceDocument.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.NEEDS_REVIEW,
            qualityStatus: QualityStatus.UNREADABLE,
            qualityIssues: ['NO_READABLE_TEXT_EXTRACTED'],
          },
        });

        await this.prisma.processingJob.update({
          where: { id: processingJob.id },
          data: { status: JobStatus.FAILED, lastError: errorMsg, completedAt: new Date() },
        });

        this.logger.warn(`Document ${documentId} extracted 0 readable text characters`);
        return { success: false, documentId, status: DocumentStatus.NEEDS_REVIEW, error: errorMsg };
      }

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.OCR_DONE,
          pageCount: ocrResult.pages?.length || 1,
        },
      });

      // ─── Step 3: RAG Indexing ─────────────────────────────────────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.EXTRACTING },
      });

      try {
        await this.ragService.indexDocument(documentId);
      } catch (ragError: any) {
        this.logger.warn(
          `RAG indexing failed for ${documentId} — extraction will fall back to full document text: ${ragError.message}`,
        );
      }

      // ─── Step 4: AI Extraction & Zod Schema Validation ────────────────────
      const extractionId = await this.extractionService.runExtraction(documentId, patientProfileId);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.NEEDS_REVIEW },
      });

      await this.prisma.processingJob.update({
        where: { id: processingJob.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          result: { extractionId },
        },
      });

      this.logger.log(`Document ${documentId} processing pipeline successfully completed`);
      return { success: true, documentId, status: DocumentStatus.NEEDS_REVIEW, extractionId };
    } catch (error: any) {
      this.logger.error(`Document ${documentId} processing pipeline failed`, error);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.NEEDS_REVIEW },
      });

      await this.prisma.processingJob.update({
        where: { id: processingJob.id },
        data: {
          status: JobStatus.FAILED,
          lastError: error.message || 'Pipeline execution failed',
          completedAt: new Date(),
        },
      });

      return {
        success: false,
        documentId,
        status: DocumentStatus.NEEDS_REVIEW,
        error: error.message || 'Pipeline execution failed',
      };
    }
  }
}

