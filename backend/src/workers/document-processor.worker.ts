import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { OcrService } from '../ocr/ocr.service';
import { ExtractionService } from '../extraction/extraction.service';
import { StorageService } from '../storage/storage.service';
import { DocumentQualityService } from '../documents/quality/document-quality.service';
import { RagService } from '../rag/rag.service';
import { DocumentStatus, QualityStatus } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';
import { DOCUMENT_PROCESSING_QUEUE, JOBS } from './queue.constants';

/**
 * Document Processing Worker
 *
 * Full pipeline: Quality Analysis → OCR → Extraction
 *
 * Each step is idempotent and resumable.
 * Failures at any step update document status and create audit records.
 */
@Processor(DOCUMENT_PROCESSING_QUEUE)
export class DocumentProcessorWorker {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrService: OcrService,
    private readonly extractionService: ExtractionService,
    private readonly storageService: StorageService,
    private readonly qualityService: DocumentQualityService,
    private readonly ragService: RagService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DocumentProcessorWorker.name);
  }

  @Process(JOBS.PROCESS_DOCUMENT)
  async processDocument(job: Job<{ documentId: string; patientProfileId: string }>) {
    const { documentId, patientProfileId } = job.data;

    this.logger.log(`Processing document ${documentId} (attempt ${job.attemptsMade + 1})`);

    const doc = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      this.logger.error(`Document ${documentId} not found`);
      return;
    }

    try {
      // ─── Step 1: Quality Analysis ──────────────────────────────────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.QUALITY_ANALYSIS },
      });

      const fileBuffer = await this.storageService.download(doc.storagePath);
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
        await this.prisma.sourceDocument.update({
          where: { id: documentId },
          data: { status: DocumentStatus.QUALITY_FAILED },
        });
        this.logger.warn(`Document ${documentId} is UNREADABLE — aborting pipeline`);
        return;
      }

      // ─── Step 2: OCR ──────────────────────────────────────────────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.OCR_PROCESSING },
      });

      await this.ocrService.parseDocument(fileBuffer, doc.mimeType, documentId);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.OCR_DONE },
      });

      // ─── Step 3: RAG Indexing (chunk → embed → vector store) ─────────────
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.EXTRACTING }, // Reuse status for RAG indexing
      });

      try {
        await this.ragService.indexDocument(documentId);
      } catch (ragError) {
        // RAG indexing failure is logged but doesn't abort — extraction falls back to full text
        this.logger.warn(
          `RAG indexing failed for ${documentId} — extraction will use full document text: ${(ragError as Error).message}`,
        );
      }

      // ─── Step 4: Extraction ───────────────────────────────────────────────
      await this.extractionService.runExtraction(documentId, patientProfileId);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.EXTRACTION_DONE },
      });

      this.logger.log(`Document ${documentId} processing complete`);
    } catch (error) {
      this.logger.error(`Document ${documentId} processing failed`, error as Error);

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.NEEDS_REVIEW },
      });

      throw error; // Let BullMQ handle retry
    }
  }
}
