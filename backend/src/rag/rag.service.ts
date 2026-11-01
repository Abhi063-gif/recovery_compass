import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { VectorStoreService, StoredChunk } from './vector-store.service';
import { EmbeddingService } from './embedding.service';
import { DocumentChunker, RawPage } from './document-chunker';
import { LoggerService } from '../common/logger/logger.service';

/**
 * RAG retrieval queries per extraction category.
 *
 * These are the semantic queries used to find relevant document
 * chunks for each type of clinical information.
 *
 * Hybrid retrieval: semantic similarity + keyword matching.
 */
const RETRIEVAL_QUERIES: Record<string, string[]> = {
  medications: [
    'medications dose frequency duration timing',
    'take medicine tablet capsule mg ml daily twice',
    'prescription drug pharmacy paracetamol ibuprofen antibiotic',
  ],
  followUps: [
    'follow-up appointment review doctor date',
    'clinic visit review after weeks days',
    'return schedule appointment surgeon',
  ],
  tests: [
    'blood test investigation lab urine culture',
    'X-ray scan ultrasound MRI CBC results',
  ],
  restrictions: [
    'activity restriction no lifting avoid exercise',
    'driving restriction work return limited movement',
    'do not wound site protect dressing',
  ],
  diet: [
    'diet food eat meal breakfast lunch dinner',
    'soft diet liquid clear fluids nutritional',
    'avoid food restrictions dietary',
  ],
  hydration: [
    'fluids water drink hydration ml litre',
    'IV fluids oral rehydration drink adequate',
  ],
  redFlags: [
    'warning signs emergency seek medical attention contact doctor',
    'fever temperature infection wound redness swelling discharge',
    'chest pain breathless difficulty breathing call 999 ER',
    'worsening severe pain urgent immediate',
  ],
  tasks: [
    'wound care dressing change daily routine',
    'activity exercise walk physiotherapy breathing',
    'post-operative instructions recovery steps',
  ],
};

/**
 * RAG Pipeline Service
 *
 * Orchestrates the full Retrieval-Augmented Generation pipeline:
 *
 * 1. Chunk document pages
 * 2. Generate embeddings for each chunk
 * 3. Store in vector database
 * 4. For extraction: retrieve relevant chunks per category
 * 5. Return grounded context for LLM extraction
 *
 * All retrieval is scoped to documentId and patientId.
 * Cross-patient retrieval is IMPOSSIBLE by design.
 */
@Injectable()
export class RagService {
  private readonly chunker: DocumentChunker;
  private readonly topK: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
    private readonly embeddingService: EmbeddingService,
    private readonly cfg: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(RagService.name);
    this.chunker = new DocumentChunker();
    this.topK = cfg.get<number>('RAG_TOP_K', 8);
  }

  /**
   * Index a document for RAG.
   * Called after OCR completes — before extraction begins.
   *
   * Step 1: Chunk pages
   * Step 2: Generate embeddings
   * Step 3: Store in vector store (scoped to documentId)
   */
  async indexDocument(documentId: string): Promise<void> {
    this.logger.log(`[RAG] Indexing document ${documentId}`);

    // Load OCR'd pages from database
    const pages = await this.prisma.documentPage.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
      select: { pageNumber: true, rawText: true, width: true, height: true },
    });

    if (!pages.length) {
      throw new Error(
        `No OCR pages found for document ${documentId}. ` +
        'Ensure OCR has completed before indexing.',
      );
    }

    const rawPages: RawPage[] = pages.map((p) => ({
      pageNumber: p.pageNumber,
      rawText: p.rawText ?? '',
      width: p.width ?? undefined,
      height: p.height ?? undefined,
    }));

    // Chunk the document
    const chunks = this.chunker.chunkDocument(documentId, rawPages);
    this.logger.log(`[RAG] Created ${chunks.length} chunks for document ${documentId}`);

    if (chunks.length === 0) {
      throw new Error(`No chunks generated for document ${documentId}. Document may be empty.`);
    }

    // Generate embeddings and store
    await this.vectorStore.storeChunks(documentId, chunks);

    this.logger.log(`[RAG] Indexing complete for document ${documentId}: ${chunks.length} chunks indexed`);
  }

  /**
   * Retrieve grounded context for extraction.
   *
   * For each extraction category, runs a semantic query to find
   * the most relevant chunks from the document.
   *
   * Returns a structured context object that the extraction LLM uses.
   * The LLM must ONLY extract from this provided context.
   */
  async retrieveExtractionContext(documentId: string): Promise<string> {
    this.logger.log(`[RAG] Retrieving extraction context for document ${documentId}`);

    const categoryContexts: string[] = [];

    for (const [category, queries] of Object.entries(RETRIEVAL_QUERIES)) {
      const categoryChunks = new Map<string, StoredChunk>();

      // Retrieve for each query in the category
      for (const query of queries) {
        const chunks = await this.vectorStore.retrieveChunks(documentId, query, this.topK);
        for (const chunk of chunks) {
          // Deduplicate by chunk ID
          if (!categoryChunks.has(chunk.id)) {
            categoryChunks.set(chunk.id, chunk);
          }
        }
      }

      // Also do keyword-based retrieval for medical abbreviations
      const keywordChunks = await this.keywordSearch(documentId, category);
      for (const chunk of keywordChunks) {
        if (!categoryChunks.has(chunk.id)) {
          categoryChunks.set(chunk.id, chunk);
        }
      }

      if (categoryChunks.size > 0) {
        const sortedChunks = Array.from(categoryChunks.values())
          .sort((a, b) => (a.pageNumber - b.pageNumber) || (a.chunkIndex - b.chunkIndex));

        const contextBlock = sortedChunks
          .map((c) => `[Page ${c.pageNumber}] ${c.content}`)
          .join('\n\n');

        categoryContexts.push(`## ${category.toUpperCase()} CONTEXT:\n${contextBlock}`);
      }
    }

    const fullContext = categoryContexts.join('\n\n---\n\n');

    this.logger.log(
      `[RAG] Retrieved context for ${documentId}: ${categoryContexts.length} categories, ` +
      `${fullContext.length} chars`,
    );

    return fullContext;
  }

  /**
   * Keyword-based search for medical abbreviations and specific terms.
   * Supplements semantic search for domain-specific terminology.
   */
  private async keywordSearch(documentId: string, category: string): Promise<StoredChunk[]> {
    const keywords: Record<string, string[]> = {
      medications: ['BD', 'TDS', 'QDS', 'PRN', 'SOS', 'mg', 'ml', 'mcg', 'tab', 'cap'],
      followUps: ['follow up', 'F/U', 'review', 'clinic', 'appointment', 'OPD'],
      redFlags: ['call 911', 'call 999', 'emergency', '38°C', '38.5°C', 'fever', 'urgent'],
    };

    const categoryKeywords = keywords[category] ?? [];
    if (!categoryKeywords.length) return [];

    // Retrieve all chunks for this document and filter by keywords
    const allChunks = await this.vectorStore.retrieveChunks(
      documentId,
      categoryKeywords.join(' '),
      20,
    );

    return allChunks.filter((chunk) =>
      categoryKeywords.some((kw) =>
        chunk.content.toLowerCase().includes(kw.toLowerCase()),
      ),
    );
  }

  /**
   * Get the full document text (all chunks concatenated).
   * Used as a fallback when RAG context is insufficient.
   */
  async getFullDocumentText(documentId: string): Promise<string> {
    const pages = await this.prisma.documentPage.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
      select: { pageNumber: true, rawText: true },
    });

    return pages.map((p) => `[Page ${p.pageNumber}]\n${p.rawText ?? ''}`).join('\n\n');
  }
}
