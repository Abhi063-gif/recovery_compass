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

    // Queue delivery with retry (guarded against Redis disconnection)
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    try {
      await this.queue.add(
        JOBS.DELIVER_NOTIFICATION,
        { notificationId: notification.id },
        {
          jobId: `notification:${notification.id}`,
          delay,
          attempts: 5,
          backoff: { type: 'exponential', delay: 30000 },
          removeOnComplete: 100, // Keep only recent 100 jobs to prevent memory leaks in Redis
          removeOnFail: 50,      // Keep only recent 50 failed jobs for diagnostics
        },
      );
    } catch (queueErr: any) {
      this.logger.warn(
        `Failed to enqueue medication reminder ${notification.id} to Redis: ${queueErr.message}. DB record preserved.`,
      );
    }
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

    // Safety alerts delivered immediately with fallback to direct delivery
    try {
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
    } catch (queueErr: any) {
      this.logger.warn(
        `Failed to enqueue safety alert ${notification.id} to Redis: ${queueErr.message}. Executing direct delivery.`,
      );
      await this.deliverNotification(notification.id).catch((dErr) => {
        this.logger.error(`Direct delivery also failed for ${notification.id}: ${dErr.message}`);
      });
    }
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

  /**
   * Dispatch branded caregiver invitation email with 6-digit OTP code and direct link.
   */
  async sendCaregiverInvitationEmail(
    toEmail: string,
    data: {
      patientName: string;
      caregiverName?: string;
      relationship?: string;
      token: string;
      otp: string;
      permissions: string[];
      expiryHours: number;
    },
  ): Promise<boolean> {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const acceptLink = `${appUrl}/family?token=${data.token}&otp=${data.otp}&email=${encodeURIComponent(toEmail)}`;

    const permissionLabels: Record<string, string> = {
      VIEW_PLAN: 'View 15-day recovery plan and daily clinical instructions',
      RECEIVE_ALERTS: 'Receive real-time red flag safety notifications',
      LOG_SYMPTOMS: 'Help record daily pain scores and temperatures',
      MARK_MEDICATIONS: 'Confirm scheduled medication doses on behalf of patient',
    };

    const permListHtml = (data.permissions || [])
      .map((p) => `<li style="margin-bottom: 6px;"><strong>${permissionLabels[p] || p}</strong></li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #17243A; color: #ffffff; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">RecoveryCompass Family Circle</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Punjab Rural Health & Recovery Coordination Platform</p>
        </div>

        <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">
          Hello <strong>${data.caregiverName || 'Family Member'}</strong>,
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          <strong>${data.patientName}</strong> has invited you to join their personal <strong>Family Circle</strong> on RecoveryCompass. You have been granted access to assist with their post-discharge home recovery.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Permissions Granted by Patient:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.5;">
            ${permListHtml || '<li>View daily recovery plan</li>'}
          </ul>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
          <span style="font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code (OTP)</span>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #C8103E;">${data.otp}</div>
          <span style="font-size: 11px; color: #7f1d1d; display: block; margin-top: 6px;">Valid for ${data.expiryHours} hours</span>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${acceptLink}" style="background-color: #C8103E; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: bold; border-radius: 10px; text-decoration: none; display: inline-block;">
            Accept Caregiver Invitation
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Or open <a href="${appUrl}/family" style="color: #0284c7;">${appUrl}/family</a>, click <strong>Accept Invitation</strong>, and enter Token: <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${data.token}</code> and OTP: <strong>${data.otp}</strong>.
        </p>

        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px;">
          &copy; RecoveryCompass &bull; Punjab Public Health Network &bull; Patient-Controlled Consent
        </p>
      </div>
    `;

    try {
      await this.emailProvider.send({
        to: toEmail,
        subject: `[RecoveryCompass] Caregiver Invitation from ${data.patientName}`,
        text: `You have been invited by ${data.patientName} to join their RecoveryCompass Family Circle. Verification OTP: ${data.otp}. Link: ${acceptLink}`,
        html,
      });
      this.logger.log(`Caregiver invitation email sent to ${toEmail}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Could not dispatch email to ${toEmail} via SMTP: ${err.message}. Link: ${acceptLink}`);
      return true;
    }
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
