import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Embedding Provider
 *
 * Generates vector embeddings for document chunks and retrieval queries.
 * Uses Google Gemini text-embedding-004 by default.
 *
 * Abstraction allows swapping embedding providers without changing
 * the RAG pipeline logic.
 *
 * NEVER calls embedding APIs from the browser.
 * NEVER exposes the API key.
 */
@Injectable()
export class EmbeddingService {
  private readonly genai: GoogleGenerativeAI;
  private readonly modelName: string;
  private readonly dimensions: number;
  private readonly provider: string;

  constructor(
    private readonly cfg: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(EmbeddingService.name);

    this.provider = cfg.get<string>('EMBEDDING_PROVIDER', 'gemini').toLowerCase();
    this.modelName = cfg.get<string>('EMBEDDING_MODEL', 'text-embedding-004');
    this.dimensions = cfg.get<number>('EMBEDDING_DIMENSIONS', 768);

    const apiKey = cfg.get<string>('GEMINI_API_KEY', '');
    this.genai = new GoogleGenerativeAI(apiKey);

    if (!apiKey || apiKey === 'your-gemini-api-key') {
      this.logger.warn('GEMINI_API_KEY not configured — embeddings will fail.');
    }
  }

  /**
   * Embed a single text string.
   * Returns a float array (vector).
   */
  async embedText(text: string): Promise<number[]> {
    if (this.provider === 'gemini') {
      return this.embedWithGemini(text);
    }
    throw new Error(`Unknown EMBEDDING_PROVIDER: "${this.provider}". Valid: gemini`);
  }

  /**
   * Embed multiple texts in batch.
   * Rate-limited to avoid API throttling.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = 5; // Gemini embedding API rate limit

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddings = await Promise.all(batch.map((t) => this.embedText(t)));
      results.push(...embeddings);

      // Small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return results;
  }

  private async embedWithGemini(text: string): Promise<number[]> {
    const apiKey = this.cfg.get<string>('GEMINI_API_KEY', '');
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      return this.generateFallbackEmbedding(text);
    }

    try {
      const model = this.genai.getGenerativeModel({ model: this.modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.warn(`[RAG] Gemini embedding failed: ${(error as Error).message}. Using deterministic vector fallback.`);
      return this.generateFallbackEmbedding(text);
    }
  }

  private generateFallbackEmbedding(text: string): number[] {
    const vec = new Array(this.dimensions).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    if (!words.length) return vec;
    for (const w of words) {
      let hash = 0;
      for (let i = 0; i < w.length; i++) {
        hash = (hash << 5) - hash + w.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % this.dimensions;
      vec[idx] += 1;
    }
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  /**
   * Calculate cosine similarity between two vectors.
   * Used for in-memory similarity search.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}
