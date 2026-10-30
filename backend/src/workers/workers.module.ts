import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DocumentProcessorWorker } from './document-processor.worker';
import { NotificationDeliveryWorker } from './notification-delivery.worker';
import { DocumentsModule } from '../documents/documents.module';
import { OcrModule } from '../ocr/ocr.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import {
  DOCUMENT_PROCESSING_QUEUE,
  NOTIFICATION_QUEUE,
} from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: DOCUMENT_PROCESSING_QUEUE },
      { name: NOTIFICATION_QUEUE },
    ),
    DocumentsModule,
    OcrModule,
    ExtractionModule,
    NotificationsModule,
    StorageModule,
  ],
  providers: [DocumentProcessorWorker, NotificationDeliveryWorker],
})
export class WorkersModule {}
