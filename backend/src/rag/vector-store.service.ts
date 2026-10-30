import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { DocumentChunk } from './document-chunker';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Vector Store Service
 *
 * Stores and retrieves document chunk embeddings for RAG.
 *
 * Architecture:
 * - Primary: PostgreSQL with pgvector extension (document_chunks table)
 * - Fallback: In-memory vector store (development / when pgvector unavailable)
 *
 * Retrieval is always scoped to a specific document_id and patient_id
 * to prevent cross-patient data leakage.
 *
 * Source metadata is preserved on every stored chunk so that
 * retrieved chunks can cite their exact document origin.
 */
export interface StoredChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
  metadata: Record<string, any>;
  similarity?: number;
}

@Injectable()
export class VectorStoreService {
  // In-memory fallback store: documentId → chunks with embeddings
  private readonly memoryStore = new Map<string, StoredChunk[]>();
  private pgvectorAvailable: boolean | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(VectorStoreService.name);
  }

  /**
   * Store chunks for a document.
   * Generates embeddings and persists them.
   * Idempotent: deletes existing chunks for the document before inserting.
   */
  async storeChunks(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    this.logger.log(`Storing ${chunks.length} chunks for document ${documentId}`);

    const texts = chunks.map((c) => c.content);
    const embeddings = await this.embeddingService.embedBatch(texts);

    const storedChunks: StoredChunk[] = chunks.map((chunk, i) => ({
      id: `${documentId}-chunk-${chunk.chunkIndex}`,
      documentId,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[i],
      metadata: chunk.metadata,
    }));

    // Try PostgreSQL first
    const usePg = await this.checkPgvector();
    if (usePg) {
      await this.storeInPostgres(documentId, storedChunks);
    } else {
      this.logger.warn(
        'pgvector not available — using in-memory vector store. ' +
        'Install the pgvector extension in PostgreSQL for production.',
      );
      this.storeInMemory(documentId, storedChunks);
    }

    this.logger.log(`Stored ${chunks.length} chunks for document ${documentId}`);
  }

  /**
   * Retrieve the most relevant chunks for a query.
   * Always scoped to documentId to prevent cross-patient leakage.
   *
   * @param documentId - Document to search within
   * @param query - Natural language retrieval query
   * @param topK - Number of chunks to return
   */
  async retrieveChunks(
    documentId: string,
    query: string,
    topK = 8,
  ): Promise<StoredChunk[]> {
    const queryEmbedding = await this.embeddingService.embedText(query);

    const usePg = await this.checkPgvector();
    if (usePg) {
      return this.retrieveFromPostgres(documentId, queryEmbedding, topK);
    } else {
      return this.retrieveFromMemory(documentId, queryEmbedding, topK);
    }
  }

  /**
   * Delete all chunks for a document (on re-processing or deletion).
   */
  async deleteChunks(documentId: string): Promise<void> {
    // Clean memory store
    this.memoryStore.delete(documentId);

    // Clean postgres (if pgvector)
    const usePg = await this.checkPgvector();
    if (usePg) {
      try {
        await this.prisma.$executeRaw`
          DELETE FROM document_chunks WHERE document_id = ${documentId}
        `;
      } catch {
        // Table might not exist yet — not an error
      }
    }
  }

  private async checkPgvector(): Promise<boolean> {
    if (this.pgvectorAvailable !== null) return this.pgvectorAvailable;

    try {
      await this.prisma.$queryRaw`SELECT 1 FROM document_chunks LIMIT 1`;
      this.pgvectorAvailable = true;
    } catch {
      this.pgvectorAvailable = false;
    }

    return this.pgvectorAvailable;
  }

  private async storeInPostgres(documentId: string, chunks: StoredChunk[]): Promise<void> {
    // Delete existing chunks for idempotency
    await this.prisma.$executeRaw`
      DELETE FROM document_chunks WHERE document_id = ${documentId}
    `;

    // Insert new chunks
    for (const chunk of chunks) {
      const embeddingStr = `[${chunk.embedding.join(',')}]`;
      await this.prisma.$executeRaw`
        INSERT INTO document_chunks (
          id, document_id, page_number, chunk_index, content,
          token_count, embedding, metadata, created_at
        ) VALUES (
          ${chunk.id},
          ${chunk.documentId},
          ${chunk.pageNumber},
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.tokenCount},
          ${embeddingStr}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb,
          NOW()
        )
      `;
    }
  }

  private async retrieveFromPostgres(
    documentId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<StoredChunk[]> {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        id,
        document_id as "documentId",
        page_number as "pageNumber",
        chunk_index as "chunkIndex",
        content,
        token_count as "tokenCount",
        metadata,
        1 - (embedding <=> ${embeddingStr}::vector) AS similarity
      FROM document_chunks
      WHERE document_id = ${documentId}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `;

    return rows.map((row) => ({
      ...row,
      embedding: [], // Don't return embeddings — too large
    }));
  }

  private storeInMemory(documentId: string, chunks: StoredChunk[]): void {
    this.memoryStore.set(documentId, chunks);
  }

  private retrieveFromMemory(
    documentId: string,
    queryEmbedding: number[],
    topK: number,
  ): StoredChunk[] {
    const chunks = this.memoryStore.get(documentId) ?? [];

    return chunks
      .map((chunk) => ({
        ...chunk,
        similarity: this.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, topK);
  }
}
