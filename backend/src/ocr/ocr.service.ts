import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DocumentParserProvider, OcrResult } from './ocr.interface';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class OcrService {
  constructor(
    @Inject('OCR_PROVIDER') private readonly provider: DocumentParserProvider,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(OcrService.name);
  }

  async parseDocument(
    buffer: Buffer,
    mimeType: string,
    documentId: string,
  ): Promise<OcrResult> {
    const start = Date.now();
    this.logger.log(`Starting OCR for document ${documentId}`);

    let result: OcrResult;
    try {
      result = await this.provider.parse(buffer, mimeType);
    } catch (error) {
      this.logger.error(`OCR failed for document ${documentId}`, error as Error);
      throw error;
    }

    this.logger.log(
      `OCR complete for document ${documentId}: ${result.pages.length} pages in ${Date.now() - start}ms`,
    );

    // ─── Persist pages and regions ───────────────────────────────────────────
    for (const page of result.pages) {
      const dbPage = await this.prisma.documentPage.create({
        data: {
          documentId,
          pageNumber: page.pageNumber,
          rawText: page.fullText,
          width: page.width,
          height: page.height,
        },
      });

      // Batch insert regions in a single database round-trip
      const regionData = page.words
        .filter((word) => word.text && word.text.trim().length > 0)
        .map((word) => ({
          pageId: dbPage.id,
          x: word.bbox.x,
          y: word.bbox.y,
          width: word.bbox.width,
          height: word.bbox.height,
          text: word.text,
          confidence: word.confidence,
        }));

      if (regionData.length > 0) {
        await this.prisma.documentRegion.createMany({
          data: regionData,
        });
      }
    }

    return result;
  }

  /**
   * Returns the full text of a document from its persisted pages.
   * Used by the extraction service.
   */
  async getDocumentText(documentId: string): Promise<string> {
    const pages = await this.prisma.documentPage.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
    });

    return pages.map((p) => `=== Page ${p.pageNumber} ===\n${p.rawText}`).join('\n\n');
  }
}
