import { Injectable } from '@nestjs/common';
import { DocumentParserProvider, OcrResult, OcrPage, OcrWord } from '../ocr.interface';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import * as zlib from 'zlib';
import sharp from 'sharp';
import { PdfValidationService } from '../../documents/pdf/pdf-validation.service';

/**
 * Tesseract.js OCR provider with Scanned-PDF Support & Bounded Timeouts.
 *
 * For images: runs Tesseract OCR, preserving word bounding boxes and confidence.
 * For text-based PDFs: extracts text layer, preserving page separation.
 * For scanned PDFs: extracts embedded page images and executes OCR on each scanned page.
 */
@Injectable()
export class TesseractProvider implements DocumentParserProvider {
  private readonly defaultTimeoutMs = 45000;

  constructor(private readonly pdfValidator?: PdfValidationService) {}

  async parse(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    const start = Date.now();

    if (mimeType === 'application/pdf') {
      return this.parsePdf(buffer, start);
    }

    return this.parseImage(buffer, 1, start);
  }

  async parseImage(
    buffer: Buffer,
    pageNumber: number,
    start: number,
  ): Promise<OcrResult> {
    const ocrPromise = Tesseract.recognize(buffer, 'eng');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR processing timed out')), this.defaultTimeoutMs),
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);

    const words: OcrWord[] = (result.data.words || []).map((w) => ({
      text: w.text,
      confidence: Math.max(0, Math.min(1, (w.confidence ?? 0) / 100)), // Normalize to 0–1
      bbox: {
        x: w.bbox.x0,
        y: w.bbox.y0,
        width: w.bbox.x1 - w.bbox.x0,
        height: w.bbox.y1 - w.bbox.y0,
      },
    }));

    const lines = result.data.lines || [];
    const page: OcrPage = {
      pageNumber,
      fullText: result.data.text || '',
      words,
      width: lines[0]?.bbox?.x1 ?? 800,
      height: lines[lines.length - 1]?.bbox?.y1 ?? 1100,
    };

    return {
      pages: [page],
      processingTimeMs: Date.now() - start,
      provider: 'tesseract',
    };
  }

  private async parsePdf(buffer: Buffer, start: number): Promise<OcrResult> {
    let pdfData: any = null;
    let parseError: Error | null = null;
    try {
      pdfData = await pdfParse(buffer);
    } catch (err: any) {
      parseError = err;
    }

    const rawText = (pdfData?.text || '').trim();
    const cleanedText = rawText.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');

    // ─── 1. Text-Based PDF Path ──────────────────────────────────────────────
    if (cleanedText.length >= 20) {
      const pageTexts = pdfData.text.split(/\f/); // form-feed character separates pages
      const pages: OcrPage[] = [];

      for (let i = 0; i < pageTexts.length; i++) {
        const text = pageTexts[i].trim();
        if (text.length === 0 && pageTexts.length > 1) continue;

        pages.push({
          pageNumber: i + 1,
          fullText: text,
          words: this.extractWordsFromText(text),
          width: 595, // standard A4 in points
          height: 842,
        });
      }

      return {
        pages: pages.length > 0 ? pages : [
          { pageNumber: 1, fullText: rawText, words: this.extractWordsFromText(rawText), width: 595, height: 842 },
        ],
        processingTimeMs: Date.now() - start,
        provider: 'pdf-parse-text',
      };
    }

    // ─── 2. Scanned PDF Path (No embedded text) ──────────────────────────────
    // Attempt extracting embedded scanned images
    const validator = this.pdfValidator || new PdfValidationService();
    let images = validator.extractJpegImagesFromPdf(buffer);

    // Fallback: If extractJpegImagesFromPdf() returns 0 images on a scanned PDF,
    // execute fallback buffer handling to render page raster images.
    if (images.length === 0) {
      images = await this.extractFallbackRasterImages(buffer);
    }

    if (images.length > 0) {
      const pages: OcrPage[] = [];

      for (let i = 0; i < images.length; i++) {
        const imgBuffer = images[i];
        try {
          const imgResult = await this.parseImage(imgBuffer, i + 1, start);
          if (imgResult.pages && imgResult.pages[0]) {
            pages.push(imgResult.pages[0]);
          }
        } catch (imgOcrErr) {
          // If a page image OCR fails, note empty page and continue
          pages.push({
            pageNumber: i + 1,
            fullText: '',
            words: [],
            width: 595,
            height: 842,
          });
        }
      }

      const totalText = pages.map((p) => p.fullText).join(' ').trim();
      return {
        pages,
        processingTimeMs: Date.now() - start,
        provider: totalText.length > 0 ? 'tesseract-scanned-pdf' : 'tesseract-scanned-empty',
      };
    }

    // If pdfParse failed and no images could be recovered from streams, raise the parse failure
    if (parseError && !rawText) {
      throw new Error(`PDF parsing failed: ${parseError.message || 'Corrupted or unreadable PDF'}`);
    }

    // ─── 3. Empty PDF or Scanned PDF with No Extractable Streams ──────────────
    return {
      pages: [
        {
          pageNumber: 1,
          fullText: '',
          words: [],
          width: 595,
          height: 842,
        },
      ],
      processingTimeMs: Date.now() - start,
      provider: 'pdf-empty',
    };
  }

  /**
   * For text-layer PDFs, create pseudo-words from text.
   * Bounding boxes are approximate (no positional data from raw text extraction).
   */
  private extractWordsFromText(text: string): OcrWord[] {
    return text
      .split(/\s+/)
      .filter((w) => w.trim().length > 0)
      .map((word, i) => ({
        text: word,
        confidence: 1.0, // Text-layer extraction is high confidence
        bbox: { x: 0, y: i * 20, width: word.length * 7, height: 18 },
      }));
  }

  /**
   * Fallback buffer handling to render page raster images from scanned PDFs
   * when standard JPEG markers (DCTDecode) are not found (e.g. FlateDecode, PNG, TIFF, or raw raster streams).
   */
  private async extractFallbackRasterImages(buffer: Buffer): Promise<Buffer[]> {
    const images: Buffer[] = [];

    try {
      // 1. Check for embedded PNG image streams
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const pngIend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
      let offset = 0;
      while (offset < buffer.length) {
        const startIdx = buffer.indexOf(pngMagic, offset);
        if (startIdx === -1) break;
        const endIdx = buffer.indexOf(pngIend, startIdx + pngMagic.length);
        if (endIdx === -1) break;
        const pngBuf = buffer.subarray(startIdx, endIdx + pngIend.length);
        if (pngBuf.length > 512) {
          try {
            const converted = await sharp(pngBuf).jpeg().toBuffer();
            images.push(converted);
          } catch {
            images.push(Buffer.from(pngBuf));
          }
        }
        offset = endIdx + pngIend.length;
      }

      if (images.length > 0) {
        return images;
      }

      // 2. Check for PDF XObject image streams (/Subtype /Image) with FlateDecode or raw raster
      const rawString = buffer.toString('binary');
      const imageObjectRegex = /<<[^>]*?\/(?:Subtype\s*\/Image|Subtype\/Image)[^>]*?>>\s*stream[\r\n]+/gi;
      let match: RegExpExecArray | null;

      while ((match = imageObjectRegex.exec(rawString)) !== null) {
        const dictHeader = match[0];
        const streamStart = match.index + dictHeader.length;
        const streamEnd = rawString.indexOf('endstream', streamStart);
        if (streamEnd === -1) continue;

        const rawStream = buffer.subarray(streamStart, streamEnd);
        if (rawStream.length < 50) continue;

        // Extract width & height from dictHeader
        const widthMatch = dictHeader.match(/\/Width\s+(\d+)/i);
        const heightMatch = dictHeader.match(/\/Height\s+(\d+)/i);
        const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
        const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;

        // Try decompressing with zlib
        let decompressed: Buffer;
        try {
          decompressed = zlib.inflateSync(rawStream);
        } catch {
          try {
            decompressed = zlib.unzipSync(rawStream);
          } catch {
            decompressed = rawStream;
          }
        }

        // Try sharp conversion
        try {
          const converted = await sharp(decompressed).jpeg().toBuffer();
          images.push(converted);
          continue;
        } catch {
          if (width > 0 && height > 0) {
            const pixelCount = width * height;
            let channels: 1 | 3 | 4 = 1;
            if (decompressed.length >= pixelCount * 4) {
              channels = 4;
            } else if (decompressed.length >= pixelCount * 3) {
              channels = 3;
            } else if (decompressed.length >= pixelCount) {
              channels = 1;
            }

            try {
              const rawRendered = await sharp(decompressed.subarray(0, pixelCount * channels), {
                raw: { width, height, channels },
              })
                .jpeg()
                .toBuffer();
              images.push(rawRendered);
              continue;
            } catch {
              // Ignore failed raw stream conversion
            }
          }
        }
      }
    } catch {
      // Catch any unexpected stream extraction errors to prevent pipeline abort
    }

    return images;
  }
}
