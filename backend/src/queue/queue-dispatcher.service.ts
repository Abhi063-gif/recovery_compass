import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { RedisHealthService } from './redis-health.service';
import { DocumentPipelineRunner } from './document-pipeline.runner';
import { DOCUMENT_PROCESSING_QUEUE, NOTIFICATION_QUEUE, JOBS } from '../workers/queue.constants';
import { JobStatus, DocumentStatus } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';

export interface DispatchResult {
  mode: 'redis_queue' | 'database_fallback';
  queued: boolean;
  jobId: string;
}

@Injectable()
export class QueueDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthService,
    private readonly pipelineRunner: DocumentPipelineRunner,
    private readonly logger: LoggerService,
    @Optional()
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly docQueue?: Queue,
    @Optional()
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notifQueue?: Queue,
  ) {
    this.logger.setContext(QueueDispatcherService.name);
  }

  /**
   * Safely dispatches a document processing job.
   * If Redis is healthy and available: enqueues via Bull queue.
   * If Redis is unavailable or disconnected: executes via persistent DB-backed runner.
   *
   * NEVER throws 500 or MaxRetriesPerRequestError on Redis disconnection.
   */
  async dispatchDocumentProcessing(
    documentId: string,
    patientProfileId: string,
  ): Promise<DispatchResult> {
    // 1. Record the persistent job attempt in database
    const dbJob = await this.prisma.processingJob.create({
      data: {
        documentId,
        jobType: 'DOCUMENT_PROCESSING',
        status: JobStatus.QUEUED,
        attempt: 0,
      },
    });

    const isRedisReady = await this.redisHealth.isAvailable();

    if (isRedisReady && this.docQueue) {
      try {
        const bullJob = await this.docQueue.add(
          JOBS.PROCESS_DOCUMENT,
          { documentId, patientProfileId },
          {
            jobId: `doc-${documentId}-${Date.now()}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        await this.prisma.processingJob.update({
          where: { id: dbJob.id },
          data: { queueJobId: bullJob.id.toString() },
        });

        this.logger.log(`Document ${documentId} dispatched to Redis Bull queue (Job ID: ${bullJob.id})`);
        return {
          mode: 'redis_queue',
          queued: true,
          jobId: bullJob.id.toString(),
        };
      } catch (queueErr: any) {
        this.logger.warn(
          `Failed to enqueue job to Redis for document ${documentId}: ${queueErr.message}. Falling back to database runner.`,
        );
      }
    }

    // 2. Database-backed Recovery Strategy
    this.logger.log(`Redis queue not available. Running document ${documentId} via database-backed runner.`);

    await this.prisma.sourceDocument.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PENDING },
    });

    // Execute asynchronously in background without blocking the HTTP request
    setImmediate(() => {
      this.pipelineRunner
        .execute(documentId, patientProfileId, dbJob.id)
        .catch((err) => {
          this.logger.error(`Database-backed runner failed for document ${documentId}`, err);
        });
    });

    return {
      mode: 'database_fallback',
      queued: false,
      jobId: dbJob.id,
    };
  }

  /**
   * Safely dispatches a notification reminder.
   */
  async dispatchNotification(
    notificationId: string,
    delayMs: number,
  ): Promise<boolean> {
    const isRedisReady = await this.redisHealth.isAvailable();

    if (isRedisReady && this.notifQueue) {
      try {
        await this.notifQueue.add(
          JOBS.DELIVER_NOTIFICATION,
          { notificationId },
          {
            jobId: `notification:${notificationId}`,
            delay: delayMs,
            attempts: 5,
            backoff: { type: 'exponential', delay: 30000 },
          },
        );
        return true;
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue notification ${notificationId}: ${err.message}`);
      }
    }

    return false;
  }
}

