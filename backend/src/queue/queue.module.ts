import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RedisHealthService } from './redis-health.service';
import { DocumentPipelineRunner } from './document-pipeline.runner';
import { QueueDispatcherService } from './queue-dispatcher.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { OcrModule } from '../ocr/ocr.module';
import { RagModule } from '../rag/rag.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { CommonModule } from '../common/common.module';
import { DocumentQualityService } from '../documents/quality/document-quality.service';
import { DOCUMENT_PROCESSING_QUEUE, NOTIFICATION_QUEUE } from '../workers/queue.constants';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    StorageModule,
    OcrModule,
    RagModule,
    forwardRef(() => ExtractionModule),
    CommonModule,
    BullModule.registerQueue(
      { name: DOCUMENT_PROCESSING_QUEUE },
      { name: NOTIFICATION_QUEUE },
    ),
  ],
  providers: [
    RedisHealthService,
    DocumentQualityService,
    DocumentPipelineRunner,
    QueueDispatcherService,
  ],
  exports: [
    RedisHealthService,
    DocumentQualityService,
    DocumentPipelineRunner,
    QueueDispatcherService,
  ],
})
export class QueueModule {}

