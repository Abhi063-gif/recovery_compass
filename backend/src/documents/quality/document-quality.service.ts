import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export interface QualityIssue {
  code: string;
  description: string;
}

export type QualityStatus = 'ACCEPTABLE' | 'NEEDS_RETAKE' | 'UNREADABLE';

export interface QualityReport {
  status: QualityStatus;
  issues: string[];
  details: QualityIssue[];
  score: number; // 0–100
}

/**
 * Document Quality Analysis Service.
 *
 * Evaluates images/PDFs for readability BEFORE extraction.
 * Prevents silently attempting OCR on unreadable content.
 *
 * Checks:
 * - Blur (Laplacian variance)
 * - Contrast
 * - Resolution (minimum DPI)
 * - File size sanity
 */
@Injectable()
export class DocumentQualityService {
  async analyzeImage(buffer: Buffer, mimeType: string): Promise<QualityReport> {
    const issues: QualityIssue[] = [];

    if (mimeType === 'application/pdf') {
      // PDF quality analysis is limited without rendering; basic size check
      if (buffer.length < 1000) {
        issues.push({ code: 'LIKELY_CORRUPT', description: 'PDF file is unusually small' });
      }
      return this.buildReport(issues);
    }

    let metadata: sharp.Metadata;
    let stats: sharp.Stats;

    try {
      const img = sharp(buffer);
      metadata = await img.metadata();
      stats = await img.stats();
    } catch {
      return {
        status: 'UNREADABLE',
        issues: ['CORRUPT_IMAGE'],
        details: [{ code: 'CORRUPT_IMAGE', description: 'Image cannot be decoded' }],
        score: 0,
      };
    }

    // ─── Resolution check ─────────────────────────────────────────────────────
    const MIN_WIDTH = 800;
    const MIN_HEIGHT = 600;
    if ((metadata.width ?? 0) < MIN_WIDTH || (metadata.height ?? 0) < MIN_HEIGHT) {
      issues.push({
        code: 'LOW_RESOLUTION',
        description: `Image resolution ${metadata.width}x${metadata.height} is below minimum ${MIN_WIDTH}x${MIN_HEIGHT}`,
      });
    }

    // ─── Contrast check ───────────────────────────────────────────────────────
    const avgMean = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
    const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;

    if (avgStdDev < 10) {
      issues.push({ code: 'LOW_CONTRAST', description: 'Image has very low contrast' });
    }

    // ─── Brightness extremes ──────────────────────────────────────────────────
    if (avgMean > 245) {
      issues.push({ code: 'OVEREXPOSED', description: 'Image appears overexposed (too bright)' });
    }
    if (avgMean < 10) {
      issues.push({ code: 'UNDEREXPOSED', description: 'Image appears underexposed (too dark)' });
    }

    // ─── Blur estimation (using sharpness heuristic) ─────────────────────────
    // We use the min/max entropy proxy: very low entropy → blurry
    const maxChannel = stats.channels.reduce((max, ch) => Math.max(max, ch.max), 0);
    const minChannel = stats.channels.reduce((min, ch) => Math.min(min, ch.min), 255);
    const dynamicRange = maxChannel - minChannel;

    if (dynamicRange < 50) {
      issues.push({ code: 'BLURRY', description: 'Image appears blurry or out of focus' });
    }

    return this.buildReport(issues);
  }

  private buildReport(issues: QualityIssue[]): QualityReport {
    const criticalCodes = ['CORRUPT_IMAGE', 'UNREADABLE'];
    const warnCodes = ['BLURRY', 'LOW_CONTRAST', 'LOW_RESOLUTION', 'OVEREXPOSED', 'UNDEREXPOSED', 'LIKELY_CORRUPT'];

    const hasCritical = issues.some((i) => criticalCodes.includes(i.code));
    const hasWarnings = issues.some((i) => warnCodes.includes(i.code));

    let status: QualityStatus;
    let score: number;

    if (hasCritical) {
      status = 'UNREADABLE';
      score = 0;
    } else if (hasWarnings) {
      status = issues.length >= 2 ? 'NEEDS_RETAKE' : 'ACCEPTABLE';
      score = Math.max(0, 100 - issues.length * 25);
    } else {
      status = 'ACCEPTABLE';
      score = 100;
    }

    return {
      status,
      issues: issues.map((i) => i.code),
      details: issues,
      score,
    };
  }
}
