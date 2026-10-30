import { Module, Global } from '@nestjs/common';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

@Global()
@Module({
  providers: [RagService, EmbeddingService, VectorStoreService],
  exports: [RagService, EmbeddingService, VectorStoreService],
})
export class RagModule {}
