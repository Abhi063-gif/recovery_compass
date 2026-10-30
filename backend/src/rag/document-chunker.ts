/**
 * Document Chunker
 *
 * Splits document text into overlapping chunks for RAG retrieval.
 *
 * Chunk strategy:
 * - Paragraph-aware: splits on double newlines first
 * - Falls back to sentence splitting
 * - Maintains page metadata
 * - Overlapping windows preserve context across chunk boundaries
 *
 * Source coordinates (page, section) are preserved on every chunk
 * so that extracted fields can cite their exact document origin.
 */
export interface RawPage {
  pageNumber: number;
  rawText: string;
  width?: number;
  height?: number;
}

export interface DocumentChunk {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  section?: string;
  startChar: number;
  endChar: number;
  metadata: {
    documentId: string;
    pageNumber: number;
    chunkIndex: number;
    section?: string;
  };
}

const DEFAULT_CHUNK_SIZE = 500; // characters (≈125 tokens at 4 chars/token)
const DEFAULT_CHUNK_OVERLAP = 100; // characters

export class DocumentChunker {
  constructor(
    private readonly chunkSize: number = DEFAULT_CHUNK_SIZE,
    private readonly chunkOverlap: number = DEFAULT_CHUNK_OVERLAP,
  ) {}

  /**
   * Chunk a document into overlapping segments.
   * Preserves page number and position metadata.
   */
  chunkDocument(documentId: string, pages: RawPage[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      const pageChunks = this.chunkPage(
        documentId,
        page.pageNumber,
        page.rawText,
        globalChunkIndex,
      );
      chunks.push(...pageChunks);
      globalChunkIndex += pageChunks.length;
    }

    return chunks;
  }

  private chunkPage(
    documentId: string,
    pageNumber: number,
    text: string,
    startIndex: number,
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = this.splitIntoParagraphs(text);

    let buffer = '';
    let bufferStart = 0;
    let absolutePos = 0;
    let chunkIndex = startIndex;

    for (const paragraph of paragraphs) {
      const paragraphText = paragraph.trim();
      if (!paragraphText) {
        absolutePos += paragraph.length + 2; // +2 for \n\n
        continue;
      }

      if (buffer.length + paragraphText.length > this.chunkSize && buffer.length > 0) {
        // Flush current buffer as a chunk
        chunks.push(
          this.makeChunk(documentId, pageNumber, buffer.trim(), chunkIndex, bufferStart, absolutePos),
        );
        chunkIndex++;

        // Start new buffer with overlap
        const overlap = buffer.slice(-this.chunkOverlap);
        bufferStart = absolutePos - overlap.length;
        buffer = overlap + '\n' + paragraphText;
      } else {
        buffer = buffer ? buffer + '\n\n' + paragraphText : paragraphText;
      }

      absolutePos += paragraphText.length + 2;
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      chunks.push(
        this.makeChunk(documentId, pageNumber, buffer.trim(), chunkIndex, bufferStart, absolutePos),
      );
    }

    return chunks;
  }

  private makeChunk(
    documentId: string,
    pageNumber: number,
    content: string,
    chunkIndex: number,
    startChar: number,
    endChar: number,
  ): DocumentChunk {
    return {
      chunkIndex,
      pageNumber,
      content,
      tokenCount: Math.ceil(content.length / 4), // Rough token estimate
      startChar,
      endChar,
      metadata: {
        documentId,
        pageNumber,
        chunkIndex,
      },
    };
  }

  private splitIntoParagraphs(text: string): string[] {
    // Split on double newlines (paragraph boundaries)
    const paragraphs = text.split(/\n\n+/);

    // For very long single paragraphs, split into sentences
    return paragraphs.flatMap((p) => {
      if (p.length <= this.chunkSize) return [p];
      return this.splitIntoSentences(p);
    });
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitter — split on '. ', '! ', '? '
    const sentences = text.split(/(?<=[.!?])\s+/);
    const result: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (current.length + sentence.length > this.chunkSize && current.length > 0) {
        result.push(current.trim());
        current = sentence;
      } else {
        current = current ? current + ' ' + sentence : sentence;
      }
    }

    if (current.trim()) result.push(current.trim());
    return result;
  }
}
