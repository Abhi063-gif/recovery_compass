import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { DocumentQualityService } from './quality/document-quality.service';
import { PdfValidationService } from './pdf/pdf-validation.service';
import { QueueDispatcherService } from '../queue/queue-dispatcher.service';
import { DocumentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auditService: AuditService,
    private readonly qualityService: DocumentQualityService,
    private readonly pdfValidation: PdfValidationService,
    private readonly queueDispatcher: QueueDispatcherService,
  ) {}

  async upload(
    file: Express.Multer.File,
    patientProfileId: string,
    userId: string,
    ipAddress?: string,
  ) {
    // ─── 1. Deep Validation (0-byte, MIME, magic bytes, PDF integrity & encryption)
    await this.pdfValidation.validateUploadFile(file);

    // ─── 2. Generate secure storage key ──────────────────────────────────────
    const docId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const safeFilename = `${docId}${ext}`;
    const storageKey = this.storage.buildDocumentKey(patientProfileId, docId, safeFilename);

    // ─── 3. Upload to encrypted object storage ────────────────────────────────
    await this.storage.upload(storageKey, file.buffer, file.mimetype);

    // ─── 4. Create database record ────────────────────────────────────────────
    const document = await this.prisma.sourceDocument.create({
      data: {
        id: docId,
        patientProfileId,
        originalFileName: this.sanitizeFilename(file.originalname),
        storagePath: storageKey,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        status: DocumentStatus.PENDING,
      },
    });

    // ─── 5. Safe Queue Dispatch (Redis when available, DB-backed fallback if down)
    const dispatchRes = await this.queueDispatcher.dispatchDocumentProcessing(
      document.id,
      patientProfileId,
    );

    // ─── 6. Audit log ─────────────────────────────────────────────────────────
    await this.auditService.log({
      actorId: userId,
      action: 'DOCUMENT_UPLOADED',
      resourceType: 'SourceDocument',
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        filename: document.originalFileName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        dispatchMode: dispatchRes.mode,
      },
      ipAddress,
    });

    return {
      documentId: document.id,
      status: document.status,
      processingMode: dispatchRes.mode,
      message: 'Document uploaded successfully. Processing started.',
    };
  }

  async findById(documentId: string, patientProfileId?: string) {
    const doc = await this.prisma.sourceDocument.findFirst({
      where: {
        id: documentId,
        ...(patientProfileId ? { patientProfileId } : {}),
        deletedAt: null,
      },
      include: {
        pages: {
          select: { id: true, pageNumber: true, rawText: true, width: true, height: true },
        },
        extractions: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        processingJobs: {
          select: { id: true, status: true, attempt: true, lastError: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return {
      ...doc,
      extractionId: doc.extractions?.[0]?.id || null,
      latestJob: doc.processingJobs?.[0] || null,
    };
  }

  async getStatus(documentId: string, patientProfileId?: string) {
    const doc = await this.findById(documentId, patientProfileId);

    return {
      id: doc.id,
      documentId: doc.id,
      patientProfileId: doc.patientProfileId,
      originalFileName: doc.originalFileName,
      status: doc.status,
      qualityStatus: doc.qualityStatus,
      qualityIssues: doc.qualityIssues,
      pageCount: doc.pageCount,
      extractionId: doc.extractionId,
      processingJob: doc.latestJob,
      uploadedAt: doc.uploadedAt,
    };
  }

  async getPages(documentId: string, patientProfileId?: string) {
    await this.findById(documentId, patientProfileId); // ownership check

    return this.prisma.documentPage.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
      include: { regions: true },
    });
  }

  async triggerProcessing(documentId: string, patientProfileId: string, userId: string) {
    const doc = await this.findById(documentId, patientProfileId);

    if (doc.status === DocumentStatus.CONFIRMED || doc.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Document has already been verified and locked.');
    }

    const dispatchRes = await this.queueDispatcher.dispatchDocumentProcessing(
      documentId,
      patientProfileId,
    );

    await this.auditService.log({
      actorId: userId,
      action: 'DOCUMENT_PROCESSING_TRIGGERED',
      resourceType: 'SourceDocument',
      resourceId: documentId,
      documentId,
      metadata: { mode: dispatchRes.mode },
    });

    return {
      message: 'Processing triggered',
      documentId,
      mode: dispatchRes.mode,
    };
  }

  async getQualityReport(documentId: string) {
    const doc = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
      select: { qualityStatus: true, qualityIssues: true, qualityReport: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  }
}
