import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { DocumentQualityService } from './quality/document-quality.service';
import { DocumentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { DOCUMENT_PROCESSING_QUEUE, JOBS } from '../workers/queue.constants';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auditService: AuditService,
    private readonly qualityService: DocumentQualityService,
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE) private readonly queue: Queue,
  ) {}

  async upload(
    file: Express.Multer.File,
    patientProfileId: string,
    userId: string,
    ipAddress?: string,
  ) {
    // ─── 1. Strict MIME type validation ──────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
    }

    // ─── 2. Magic byte validation (don't trust MIME header alone) ─────────────
    await this.validateFileMagicBytes(file.buffer, file.mimetype);

    // ─── 3. Generate secure storage key ──────────────────────────────────────
    const docId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const safeFilename = `${docId}${ext}`;
    const storageKey = this.storage.buildDocumentKey(patientProfileId, docId, safeFilename);

    // ─── 4. Upload to encrypted object storage ────────────────────────────────
    await this.storage.upload(storageKey, file.buffer, file.mimetype);

    // ─── 5. Create database record ────────────────────────────────────────────
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

    // ─── 6. Queue for processing ──────────────────────────────────────────────
    await this.queue.add(
      JOBS.PROCESS_DOCUMENT,
      { documentId: document.id, patientProfileId },
      {
        jobId: `doc-${document.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    // ─── 7. Audit log ─────────────────────────────────────────────────────────
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
      },
      ipAddress,
    });

    return {
      documentId: document.id,
      status: document.status,
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
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return doc;
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

    if (
      doc.status === DocumentStatus.OCR_PROCESSING ||
      doc.status === DocumentStatus.EXTRACTING
    ) {
      throw new BadRequestException('Document is already being processed');
    }

    await this.queue.add(
      JOBS.PROCESS_DOCUMENT,
      { documentId, patientProfileId },
      {
        jobId: `doc-${documentId}-retry-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    await this.auditService.log({
      actorId: userId,
      action: 'DOCUMENT_PROCESSING_TRIGGERED',
      resourceType: 'SourceDocument',
      resourceId: documentId,
      documentId,
    });

    return { message: 'Processing triggered', documentId };
  }

  async getQualityReport(documentId: string) {
    const doc = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
      select: { qualityStatus: true, qualityIssues: true, qualityReport: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async validateFileMagicBytes(
    buffer: Buffer,
    declaredMimeType: string,
  ): Promise<void> {
    // Basic magic byte checks
    const signatures: Record<string, Buffer[]> = {
      'application/pdf': [Buffer.from('%PDF', 'ascii')],
      'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
      'image/jpg': [Buffer.from([0xff, 0xd8, 0xff])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    };

    const expected = signatures[declaredMimeType];
    if (!expected) {
      throw new BadRequestException('Unsupported file type');
    }

    const isValid = expected.some((sig) =>
      buffer.subarray(0, sig.length).equals(sig),
    );

    if (!isValid) {
      throw new BadRequestException(
        'File content does not match declared type. File may be corrupted or misnamed.',
      );
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  }
}
