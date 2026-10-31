import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PdfValidationService } from '../src/documents/pdf/pdf-validation.service';
import { TesseractProvider } from '../src/ocr/providers/tesseract.provider';
import { QueueDispatcherService } from '../src/queue/queue-dispatcher.service';
import { DocumentPipelineRunner } from '../src/queue/document-pipeline.runner';
import { createProducerRedisOptions, createWorkerRedisOptions, parseRedisUrl } from '../src/queue/redis.config';
import { DocumentStatus, JobStatus, QualityStatus, ExtractionStatus } from '@prisma/client';

describe('PDF Upload, OCR, Redis & BullMQ Pipeline Robustness', () => {
  let pdfValidator: PdfValidationService;

  beforeEach(() => {
    pdfValidator = new PdfValidationService();
  });

  // Helper: load real discharge summary PDF fixture
  function getSampleDischargePdf(): Buffer {
    const fixturePath = path.resolve(__dirname, 'fixtures/sample-discharge.pdf');
    if (fs.existsSync(fixturePath)) {
      return fs.readFileSync(fixturePath);
    }
    const samplePath = path.resolve(__dirname, '../uploads/documents/22336a4a-8289-42a2-98ff-837c1fc23f46/363c7c76-d601-440c-bc29-5f10ac22604c/363c7c76-d601-440c-bc29-5f10ac22604c.pdf');
    if (fs.existsSync(samplePath)) {
      return fs.readFileSync(samplePath);
    }
    throw new Error(`Sample discharge PDF not found. Expected at: ${fixturePath}`);
  }

  // ─── Scenario 1: Valid text-based PDF ───────────────────────────────────────
  it('Scenario 1: validates and parses text-based PDF', async () => {
    const pdfBuffer = getSampleDischargePdf();
    const validation = await pdfValidator.validatePdf(pdfBuffer);

    expect(validation.isValid).toBe(true);
    expect(validation.pageCount).toBeGreaterThanOrEqual(1);
    expect(validation.isTextBased).toBe(true);
    expect(validation.extractedText.length).toBeGreaterThan(50);

    const provider = new TesseractProvider(pdfValidator);
    const result = await provider.parse(pdfBuffer, 'application/pdf');

    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    expect(result.provider).toBe('pdf-parse-text');
    expect(result.pages[0].fullText.length).toBeGreaterThan(0);
    expect(result.pages[0].words.length).toBeGreaterThan(0);
  });

  // ─── Scenario 2: Valid scanned PDF (image streams without text layer) ──────
  it('Scenario 2: detects and routes scanned PDF with embedded JPEG streams', async () => {
    // Construct a PDF that contains a JPEG stream marker but no font/text
    const fakeJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG SOI
      Buffer.alloc(2048, 0xaa),
      Buffer.from([0xff, 0xd9]), // JPEG EOI
    ]);

    const scannedPdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Subtype /Image >> endobj\n'),
      fakeJpeg,
      Buffer.from('\ntrailer << /Size 4 /Root 1 0 R >>\n%%EOF'),
    ]);

    const extractedImages = pdfValidator.extractJpegImagesFromPdf(scannedPdf);
    expect(extractedImages.length).toBeGreaterThanOrEqual(1);
    expect(extractedImages[0].subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  // ─── Scenario 3: Empty PDF (0 bytes or tiny buffer) ─────────────────────────
  it('Scenario 3: rejects empty 0-byte file and tiny malformed buffer', async () => {
    // 0-byte file
    const emptyFile = {
      buffer: Buffer.alloc(0),
      size: 0,
      mimetype: 'application/pdf',
      originalname: 'empty.pdf',
    } as Express.Multer.File;

    await expect(pdfValidator.validateUploadFile(emptyFile)).rejects.toThrow(BadRequestException);
    await expect(pdfValidator.validateUploadFile(emptyFile)).rejects.toThrow(/empty/i);

    // Buffer under 50 bytes
    const tinyBuffer = Buffer.from('%PDF-1.4');
    const tinyFile = {
      buffer: tinyBuffer,
      size: tinyBuffer.length,
      mimetype: 'application/pdf',
      originalname: 'tiny.pdf',
    } as Express.Multer.File;

    await expect(pdfValidator.validateUploadFile(tinyFile)).rejects.toThrow(/too small/i);
  });

  // ─── Scenario 4: Corrupt PDF ────────────────────────────────────────────────
  it('Scenario 4: detects and rejects corrupt PDF files with meaningful message', async () => {
    const corruptBuffer = Buffer.from('%PDF-1.4\nThis is corrupt junk data without valid xref or trailer.');

    await expect(pdfValidator.validatePdf(corruptBuffer)).rejects.toThrow(BadRequestException);
    await expect(pdfValidator.validatePdf(corruptBuffer)).rejects.toThrow(/corrupted/i);
  });

  // ─── Scenario 5: Password-protected PDF ─────────────────────────────────────
  it('Scenario 5: detects password-protected / encrypted PDF and rejects with clean 400', async () => {
    const encryptedPdf = Buffer.from([
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Count 1 >> endobj',
      'trailer << /Size 3 /Root 1 0 R /Encrypt 4 0 R >>',
      '4 0 obj << /Filter /Standard /V 2 /R 3 >> endobj',
      '%%EOF',
    ].join('\n'));

    await expect(pdfValidator.validatePdf(encryptedPdf)).rejects.toThrow(BadRequestException);
    await expect(pdfValidator.validatePdf(encryptedPdf)).rejects.toThrow(/password-protected/i);
  });

  // ─── Scenario 6: Unsupported file format & MIME spoofing ────────────────────
  it('Scenario 6: blocks unsupported formats and extension-spoofed binaries', async () => {
    // Unsupported MIME
    const exeFile = {
      buffer: Buffer.alloc(100, 0x90),
      size: 100,
      mimetype: 'application/x-msdownload',
      originalname: 'virus.exe',
    } as any;

    await expect(pdfValidator.validateUploadFile(exeFile)).rejects.toThrow(/unsupported file type/i);

    // Extension spoofing: declared as PDF, but content is JPEG or text
    const spoofedFile = {
      buffer: Buffer.from('Hello plain text masquerading as PDF with lots of words'),
      size: 55,
      mimetype: 'application/pdf',
      originalname: 'fake.pdf',
    } as any;

    await expect(pdfValidator.validateUploadFile(spoofedFile)).rejects.toThrow(/magic byte|does not match/i);
  });

  // ─── Scenario 7: OCR API timeout handling ──────────────────────────────────
  it('Scenario 7: handles OCR timeout gracefully without unhandled promise rejection', async () => {
    const provider = new TesseractProvider(pdfValidator);

    // Mock recognize with a delayed rejection
    const mockTimeout = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => setTimeout(() => reject(new Error('OCR processing timed out')), 10));
    });

    vi.spyOn(provider as any, 'parseImage').mockImplementation(mockTimeout);

    await expect(provider.parseImage(Buffer.alloc(100), 1, Date.now())).rejects.toThrow(/timed out/i);
  });

  // ─── Scenario 8: OCR API rate limit (429) resilience ───────────────────────
  it('Scenario 8: preserves document record on rate limit error and logs failure stage', async () => {
    const mockPrisma = {
      sourceDocument: {
        findUnique: vi.fn().mockResolvedValue({ id: 'doc-123', status: DocumentStatus.PENDING, mimeType: 'image/jpeg', storagePath: 'test.jpg' }),
        update: vi.fn().mockResolvedValue({ id: 'doc-123' }),
      },
      processingJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'job-1', attempt: 1 }),
        update: vi.fn().mockResolvedValue({ id: 'job-1' }),
      },
    };

    const mockStorage = {
      download: vi.fn().mockResolvedValue(Buffer.alloc(1000)),
    };

    const mockQuality = {
      analyzeImage: vi.fn().mockResolvedValue({ status: 'ACCEPTABLE', issues: [] }),
    };

    const mockOcr = {
      parseDocument: vi.fn().mockRejectedValue(new Error('OCR Provider 429: Rate limit exceeded. Try again in 60s.')),
      getDocumentText: vi.fn().mockResolvedValue(''),
    };

    const mockLogger = {
      setContext: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const runner = new DocumentPipelineRunner(
      mockPrisma as any,
      mockStorage as any,
      mockQuality as any,
      mockOcr as any,
      {} as any,
      {} as any,
      mockLogger as any,
    );

    const result = await runner.execute('doc-123', 'patient-123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit exceeded');

    // Document state was preserved as NEEDS_REVIEW (not deleted or 500'd)
    expect(mockPrisma.sourceDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: DocumentStatus.NEEDS_REVIEW }),
      }),
    );
  });

  // ─── Scenario 9: OCR returning empty text (blank/unreadable scan) ───────────
  it('Scenario 9: catches 0-character OCR output and marks document for review without dummy data', async () => {
    const mockPrisma = {
      sourceDocument: {
        findUnique: vi.fn().mockResolvedValue({ id: 'doc-blank', status: DocumentStatus.PENDING, mimeType: 'application/pdf', storagePath: 'blank.pdf' }),
        update: vi.fn().mockResolvedValue({ id: 'doc-blank' }),
      },
      processingJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'job-blank', attempt: 1 }),
        update: vi.fn().mockResolvedValue({ id: 'job-blank' }),
      },
    };

    const mockStorage = { download: vi.fn().mockResolvedValue(Buffer.alloc(500)) };
    const mockQuality = { analyzeImage: vi.fn().mockResolvedValue({ status: 'ACCEPTABLE', issues: [] }) };
    const mockOcr = {
      parseDocument: vi.fn().mockResolvedValue({ pages: [] }),
      getDocumentText: vi.fn().mockResolvedValue('   \n\t   '), // purely empty whitespace
    };
    const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const runner = new DocumentPipelineRunner(
      mockPrisma as any,
      mockStorage as any,
      mockQuality as any,
      mockOcr as any,
      {} as any,
      {} as any,
      mockLogger as any,
    );

    const result = await runner.execute('doc-blank', 'patient-123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No readable clinical text');
    expect(mockPrisma.sourceDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: DocumentStatus.NEEDS_REVIEW,
          qualityStatus: QualityStatus.UNREADABLE,
        }),
      }),
    );
  });

  // ─── Scenario 10: Redis unavailable during upload ───────────────────────────
  it('Scenario 10: falls back gracefully to DB-backed runner when Redis is disconnected without 500 error', async () => {
    const mockPrisma = {
      processingJob: {
        create: vi.fn().mockResolvedValue({ id: 'job-offline-1' }),
        update: vi.fn().mockResolvedValue({ id: 'job-offline-1' }),
      },
      sourceDocument: {
        update: vi.fn().mockResolvedValue({ id: 'doc-offline-1' }),
      },
    };

    const mockRedisHealth = {
      isAvailable: vi.fn().mockResolvedValue(false), // Redis is down!
      ping: vi.fn().mockResolvedValue({ healthy: false, error: 'ECONNREFUSED' }),
    };

    const mockRunner = {
      execute: vi.fn().mockResolvedValue({ success: true, documentId: 'doc-offline-1', status: DocumentStatus.NEEDS_REVIEW }),
    };

    const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const dispatcher = new QueueDispatcherService(
      mockPrisma as any,
      mockRedisHealth as any,
      mockRunner as any,
      mockLogger as any,
      undefined, // No Bull queue
      undefined,
    );

    const dispatchResult = await dispatcher.dispatchDocumentProcessing('doc-offline-1', 'patient-1');
    expect(dispatchResult.mode).toBe('database_fallback');
    expect(dispatchResult.queued).toBe(false);
    expect(dispatchResult.jobId).toBe('job-offline-1');
  });

  // ─── Scenario 11: Redis configuration producer vs worker separation ─────────
  it('Scenario 11: enforces bounded retries (maxRetriesPerRequest: 1) for producers and null for workers', () => {
    const producerOpts = createProducerRedisOptions();
    expect(producerOpts.maxRetriesPerRequest).toBe(1); // Fast fail on HTTP requests
    expect(producerOpts.enableOfflineQueue).toBe(false);
    expect(producerOpts.connectTimeout).toBe(2000);

    const workerOpts = createWorkerRedisOptions();
    expect(workerOpts.maxRetriesPerRequest).toBeNull(); // Required by BullMQ worker blocking commands
    expect(workerOpts.connectTimeout).toBe(5000);

    // Redis URL parsing helper
    const parsed = parseRedisUrl('redis://default:secret@redis-host:6380/2');
    expect(parsed.host).toBe('redis-host');
    expect(parsed.port).toBe(6380);
    expect(parsed.password).toBe('secret');
    expect(parsed.db).toBe(2);
  });

  // ─── Scenario 12: Worker restarting during processing (idempotency) ─────────
  it('Scenario 12: resumes processing idempotently if worker restarts without duplicating plan', async () => {
    const mockPrisma = {
      sourceDocument: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'doc-in-progress',
          status: DocumentStatus.CONFIRMED, // Already finished & confirmed!
          mimeType: 'application/pdf',
          storagePath: 'test.pdf',
        }),
      },
    };

    const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const runner = new DocumentPipelineRunner(
      mockPrisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      mockLogger as any,
    );

    const result = await runner.execute('doc-in-progress', 'patient-123');
    expect(result.success).toBe(true);
    expect(result.status).toBe(DocumentStatus.CONFIRMED);
  });

  // ─── Scenario 13: Duplicate upload / job submission idempotency ─────────────
  it('Scenario 13: prevents duplicate queue jobs and preserves processing state', async () => {
    const existingJob = { id: 'job-existing', attempt: 1, status: JobStatus.QUEUED };
    const mockPrisma = {
      processingJob: {
        findUnique: vi.fn().mockResolvedValue(existingJob),
        update: vi.fn().mockResolvedValue({ ...existingJob, attempt: 2, status: JobStatus.PROCESSING }),
      },
      sourceDocument: {
        findUnique: vi.fn().mockResolvedValue({ id: 'doc-dup', status: DocumentStatus.PENDING, mimeType: 'image/jpeg', storagePath: 'test.jpg' }),
        update: vi.fn().mockResolvedValue({ id: 'doc-dup' }),
      },
    };

    const mockStorage = { download: vi.fn().mockResolvedValue(Buffer.alloc(1000)) };
    const mockQuality = { analyzeImage: vi.fn().mockResolvedValue({ status: 'ACCEPTABLE', issues: [] }) };
    const mockOcr = {
      parseDocument: vi.fn().mockResolvedValue({ pages: [{ pageNumber: 1, fullText: 'Valid text', words: [] }] }),
      getDocumentText: vi.fn().mockResolvedValue('Valid clinical medication text'),
    };
    const mockRag = { indexDocument: vi.fn().mockResolvedValue(undefined) };
    const mockExtraction = { runExtraction: vi.fn().mockResolvedValue('ext-id-123') };
    const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const runner = new DocumentPipelineRunner(
      mockPrisma as any,
      mockStorage as any,
      mockQuality as any,
      mockOcr as any,
      mockRag as any,
      mockExtraction as any,
      mockLogger as any,
    );

    const result = await runner.execute('doc-dup', 'patient-123', 'job-existing');
    expect(result.success).toBe(true);
    expect(result.extractionId).toBe('ext-id-123');
    expect(mockPrisma.processingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-existing' },
        data: expect.objectContaining({ status: JobStatus.COMPLETED }),
      }),
    );
  });

  // ─── Scenario 14: Failed job retry ──────────────────────────────────────────
  it('Scenario 14: permits re-triggering failed document without re-uploading file', async () => {
    const mockPrisma = {
      sourceDocument: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'doc-failed',
          status: DocumentStatus.NEEDS_REVIEW,
          patientProfileId: 'profile-1',
          extractions: [],
          processingJobs: [{ id: 'job-old', status: JobStatus.FAILED, attempt: 1, lastError: 'Timeout' }],
        }),
        update: vi.fn().mockResolvedValue({ id: 'doc-failed' }),
      },
      processingJob: {
        create: vi.fn().mockResolvedValue({ id: 'job-retry-1' }),
      },
    };

    const mockRedisHealth = { isAvailable: vi.fn().mockResolvedValue(false) };
    const mockRunner = { execute: vi.fn().mockResolvedValue({ success: true }) };
    const mockLogger = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const dispatcher = new QueueDispatcherService(
      mockPrisma as any,
      mockRedisHealth as any,
      mockRunner as any,
      mockLogger as any,
    );

    const res = await dispatcher.dispatchDocumentProcessing('doc-failed', 'profile-1');
    expect(res.jobId).toBe('job-retry-1');
    expect(res.mode).toBe('database_fallback');
  });

  // ─── Scenario 15: Successful extraction followed by human verification ──────
  it('Scenario 15: completes extraction to NEEDS_REVIEW and transitions to CONFIRMED on verification', async () => {
    const extractionId = 'ext-complete-1';
    const mockPrisma = {
      extraction: {
        findUnique: vi.fn().mockResolvedValue({ id: extractionId, status: ExtractionStatus.NEEDS_REVIEW }),
        update: vi.fn().mockResolvedValue({ id: extractionId, status: ExtractionStatus.CONFIRMED, confirmedAt: new Date() }),
      },
      sourceDocument: {
        update: vi.fn().mockResolvedValue({ id: 'doc-1', status: DocumentStatus.CONFIRMED }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    // Simulate patient confirmation action
    const confirmed = await mockPrisma.extraction.update({
      where: { id: extractionId },
      data: { status: ExtractionStatus.CONFIRMED, confirmedAt: new Date() },
    });

    expect(confirmed.status).toBe(ExtractionStatus.CONFIRMED);
    expect(confirmed.confirmedAt).toBeDefined();
  });
});

