export interface OcrWord {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OcrPage {
  pageNumber: number;
  fullText: string;
  words: OcrWord[];
  width: number;
  height: number;
}

export interface OcrResult {
  pages: OcrPage[];
  processingTimeMs: number;
  provider: string;
}

/**
 * DocumentParserProvider interface.
 *
 * All OCR providers MUST preserve:
 * - Page numbers
 * - Bounding boxes (x, y, width, height)
 * - Per-word confidence scores
 * - Full page text
 *
 * This is required for "Show me where this came from" source linking.
 */
export interface DocumentParserProvider {
  parse(buffer: Buffer, mimeType: string): Promise<OcrResult>;
}
