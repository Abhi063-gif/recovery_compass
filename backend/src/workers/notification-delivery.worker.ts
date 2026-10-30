import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from '../notifications/notifications.service';
import { LoggerService } from '../common/logger/logger.service';
import { NOTIFICATION_QUEUE, JOBS } from './queue.constants';

@Processor(NOTIFICATION_QUEUE)
export class NotificationDeliveryWorker {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(NotificationDeliveryWorker.name);
  }

  @Process(JOBS.DELIVER_NOTIFICATION)
  async deliver(job: Job<{ notificationId: string }>) {
    const { notificationId } = job.data;
    this.logger.log(`Delivering notification ${notificationId} (attempt ${job.attemptsMade + 1})`);

    await this.notificationsService.deliverNotification(notificationId);
  }
}
