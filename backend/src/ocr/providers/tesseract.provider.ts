import { Injectable } from '@nestjs/common';
import { DocumentParserProvider, OcrResult, OcrPage, OcrWord } from '../ocr.interface';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
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
    let pdfData: any;
    try {
      pdfData = await pdfParse(buffer);
    } catch (err: any) {
      throw new Error(`PDF parsing failed: ${err.message || 'Corrupted or unreadable PDF'}`);
    }

    const rawText = (pdfData.text || '').trim();
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
    const images = validator.extractJpegImagesFromPdf(buffer);

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
}
