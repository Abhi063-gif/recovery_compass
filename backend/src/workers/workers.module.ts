import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DocumentProcessorWorker } from './document-processor.worker';
import { NotificationDeliveryWorker } from './notification-delivery.worker';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
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
    forwardRef(() => QueueModule),
    StorageModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [DocumentProcessorWorker, NotificationDeliveryWorker],
  exports: [DocumentProcessorWorker, NotificationDeliveryWorker],
})
export class WorkersModule {}
