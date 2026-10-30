import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { NOTIFICATION_QUEUE } from '../workers/queue.constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailProvider, SmsProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
