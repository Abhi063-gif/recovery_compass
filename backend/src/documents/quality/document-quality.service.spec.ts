import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentQualityService } from './document-quality.service';

describe('DocumentQualityService', () => {
  let service: DocumentQualityService;

  beforeEach(() => {
    service = new DocumentQualityService();
  });

  describe('analyzeImage & buildReport', () => {
    it('should mark corrupt image buffer as UNREADABLE', async () => {
      const corruptBuffer = Buffer.from('not an image data at all');
      const report = await service.analyzeImage(corruptBuffer, 'image/jpeg');

      expect(report.status).toBe('UNREADABLE');
      expect(report.score).toBe(0);
      expect(report.issues).toContain('CORRUPT_IMAGE');
    });

    it('should flag unusually small PDF files as LIKELY_CORRUPT', async () => {
      const tinyPdfBuffer = Buffer.from('%PDF-1.4 tiny');
      const report = await service.analyzeImage(tinyPdfBuffer, 'application/pdf');

      expect(report.issues).toContain('LIKELY_CORRUPT');
    });

    it('should build report with ACCEPTABLE status when no issues exist', () => {
      const buildReport = (service as any).buildReport.bind(service);
      const report = buildReport([]);

      expect(report.status).toBe('ACCEPTABLE');
      expect(report.score).toBe(100);
      expect(report.issues).toHaveLength(0);
    });

    it('should flag NEEDS_RETAKE when multiple warnings occur', () => {
      const buildReport = (service as any).buildReport.bind(service);
      const report = buildReport([
        { code: 'BLURRY', description: 'Blurry text' },
        { code: 'LOW_CONTRAST', description: 'Low contrast' },
      ]);

      expect(report.status).toBe('NEEDS_RETAKE');
      expect(report.score).toBe(50);
    });
  });
});
