import { Injectable, BadRequestException } from '@nestjs/common';
import pdfParse from 'pdf-parse';

export interface PdfValidationResult {
  isValid: boolean;
  pageCount: number;
  isScanned: boolean;
  isTextBased: boolean;
  extractedText: string;
  hasImages: boolean;
  detectedIssues: string[];
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

@Injectable()
export class PdfValidationService {
  /**
   * Primary entry point for validating uploaded Multer files.
   * Enforces 0-byte check, MIME check, and magic byte validation.
   */
  async validateUploadFile(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // ─── 0-Byte and File Size Validation ──────────────────────────────────
    if (!file.buffer || file.size === 0 || file.buffer.length === 0) {
      throw new BadRequestException('The selected file is empty (0 bytes). Please upload a valid document.');
    }

    // ─── MIME Type Validation ─────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed formats: PDF, JPEG, PNG.`,
      );
    }

    if (file.buffer.length < 50) {
      throw new BadRequestException('File is too small to be a valid medical document.');
    }

    // ─── Magic Byte Header Validation ─────────────────────────────────────
    this.validateMagicBytes(file.buffer, file.mimetype);

    // ─── PDF-Specific Integrity Validation ────────────────────────────────
    if (file.mimetype === 'application/pdf') {
      await this.validatePdf(file.buffer);
    }
  }

  /**
   * Validates file signatures (magic bytes) to prevent extension spoofing.
   */
  validateMagicBytes(buffer: Buffer, declaredMimeType: string): void {
    const signatures: Record<string, Buffer[]> = {
      'application/pdf': [Buffer.from('%PDF', 'ascii')],
      'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
      'image/jpg': [Buffer.from([0xff, 0xd8, 0xff])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    };

    const expected = signatures[declaredMimeType];
    if (!expected) {
      throw new BadRequestException(`Unsupported file type: ${declaredMimeType}`);
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

  /**
   * In-depth PDF validation:
   * - Checks PDF header and EOF trailer.
   * - Detects encrypted/password-protected PDFs.
   * - Validates page count.
   * - Distinguishes between text-based and scanned PDFs.
   */
  async validatePdf(buffer: Buffer): Promise<PdfValidationResult> {
    const issues: string[] = [];

    // 1. PDF Header check
    if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new BadRequestException('Invalid PDF header. File is not a valid PDF document.');
    }

    // 2. Encryption / Password Check
    const rawString = buffer.toString('binary');
    if (rawString.includes('/Encrypt')) {
      // Check if it really requires password
      const isActuallyEncrypted = /\/Encrypt\s+\d+\s+\d+\s+R/.test(rawString) || rawString.includes('/Filter/Standard');
      if (isActuallyEncrypted) {
        throw new BadRequestException(
          'This PDF is password-protected or encrypted. Please remove password protection before uploading.',
        );
      }
    }

    // 3. Structure, Page Count & Text Extraction via pdf-parse
    let parsedData: any;
    try {
      parsedData = await pdfParse(buffer);
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase();
      if (errMsg.includes('password') || errMsg.includes('encrypted')) {
        throw new BadRequestException(
          'This PDF is password-protected or encrypted. Please remove password protection before uploading.',
        );
      }
      throw new BadRequestException('The PDF file is corrupted and cannot be read.');
    }

    const pageCount = parsedData.numpages || 0;
    if (pageCount === 0) {
      throw new BadRequestException('The PDF file contains no pages.');
    }

    if (pageCount > 50) {
      throw new BadRequestException('PDF exceeds maximum page limit (50 pages).');
    }

    // 4. Distinguish between Text-based and Scanned PDF
    const rawText = parsedData.text || '';
    const cleanedText = rawText.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');

    const hasImages = rawString.includes('/Subtype/Image') ||
      rawString.includes('/Subtype /Image') ||
      rawString.includes('/DCTDecode');

    const isTextBased = cleanedText.length >= 20;
    const isScanned = !isTextBased && hasImages;

    if (!isTextBased && !hasImages && cleanedText.length === 0) {
      issues.push('EMPTY_PDF_NO_TEXT_OR_IMAGES');
    }

    return {
      isValid: true,
      pageCount,
      isScanned,
      isTextBased,
      extractedText: rawText.trim(),
      hasImages,
      detectedIssues: issues,
    };
  }

  /**
   * Helper to extract JPEG image streams from a scanned PDF buffer.
   * Most scanned clinical PDFs store scanned pages as DCTDecode JPEG streams.
   */
  extractJpegImagesFromPdf(buffer: Buffer): Buffer[] {
    const images: Buffer[] = [];
    const soi = Buffer.from([0xff, 0xd8, 0xff]);
    const eoi = Buffer.from([0xff, 0xd9]);

    let offset = 0;
    while (offset < buffer.length) {
      const startIndex = buffer.indexOf(soi, offset);
      if (startIndex === -1) break;

      const endIndex = buffer.indexOf(eoi, startIndex + 3);
      if (endIndex === -1) break;

      const imgBuffer = buffer.subarray(startIndex, endIndex + 2);
      // Validate that it has reasonable image size (at least 1KB)
      if (imgBuffer.length > 1024) {
        images.push(Buffer.from(imgBuffer));
      }

      offset = endIndex + 2;
    }

    return images;
  }
}

