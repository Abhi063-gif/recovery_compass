import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  RedFlagSeverity,
  RedFlagAction,
} from '@prisma/client';
import { NOTIFICATION_QUEUE, JOBS } from '../workers/queue.constants';
import { createHash } from 'crypto';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  /**
   * Schedule a medication reminder via the queue.
   * Uses idempotency key to prevent duplicate reminders.
   *
   * Target: >=99% delivery in defined test environment.
   */
  async scheduleMedicationReminder(
    userId: string,
    scheduleId: string,
    scheduledAt: Date,
    medicationName: string,
  ): Promise<void> {
    const idempotencyKey = createHash('sha256')
      .update(`med-reminder:${scheduleId}:${scheduledAt.toISOString()}`)
      .digest('hex');

    // Check for existing notification
    const existing = await this.prisma.notification.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      this.logger.debug(`Reminder already exists for schedule ${scheduleId} — skipping`);
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.MEDICATION_REMINDER,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
        subject: `Medication Reminder: ${medicationName}`,
        body: `It's time to take your medication: ${medicationName}`,
        scheduledFor: scheduledAt,
        medicationScheduleId: scheduleId,
        idempotencyKey,
      },
    });

    // Queue delivery with retry
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await this.queue.add(
      JOBS.DELIVER_NOTIFICATION,
      { notificationId: notification.id },
      {
        jobId: `notification:${notification.id}`,
        delay,
        attempts: 5,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  }

  /**
   * Send safety alert immediately (high priority — not delayed).
   * Safety alerts use direct delivery, not delayed queue.
   */
  async sendSafetyAlert(
    user: any,
    message: string,
    severity: RedFlagSeverity,
    action: RedFlagAction,
    eventId: string,
  ): Promise<void> {
    const idempotencyKey = createHash('sha256')
      .update(`safety-alert:${user.id}:${eventId}`)
      .digest('hex');

    const existing = await this.prisma.notification.findUnique({ where: { idempotencyKey } });
    if (existing) return;

    const notification = await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SAFETY_ALERT,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
        subject: `[${severity}] Safety Alert`,
        body: message,
        metadata: { severity, action, eventId } as any,
        idempotencyKey,
      },
    });

    // Safety alerts delivered immediately, not queued with delay
    await this.queue.add(
      JOBS.DELIVER_NOTIFICATION,
      { notificationId: notification.id },
      {
        jobId: `safety:${notification.id}`,
        priority: 1, // Highest priority
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async deliverNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: { include: { notificationPrefs: true } } },
    });

    if (!notification || notification.status === NotificationStatus.READ) return;

    const prefs = notification.user.notificationPrefs;

    try {
      if (prefs?.emailEnabled && notification.user.email) {
        await this.emailProvider.send({
          to: notification.user.email,
          subject: notification.subject ?? 'Recovery Compass Notification',
          text: notification.body,
        });
      }

      if (prefs?.smsEnabled && notification.user.phone) {
        await this.smsProvider.send({
          to: notification.user.phone,
          message: notification.body,
        });
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });

      this.logger.log(`Notification ${notificationId} delivered`);
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          retryCount: { increment: 1 },
          lastError: (error as Error).message,
        },
      });
      throw error; // Let BullMQ handle retry with backoff
    }
  }
}
