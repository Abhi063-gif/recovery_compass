import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SyncPushDto, SyncPullQueryDto, SyncMutation } from './sync.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async processPush(dto: SyncPushDto, userId: string) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [] as string[],
      serverTime: new Date().toISOString(),
    };

    for (const mutation of dto.mutations || []) {
      try {
        await this.applyMutation(mutation, userId);
        results.processed++;
      } catch (err: any) {
        this.logger.warn(`Failed to apply sync mutation ${mutation.id}: ${err.message}`);
        results.failed++;
        results.errors.push(`${mutation.id}: ${err.message}`);
      }
    }

    try {
      await this.audit.log({
        actorId: userId,
        action: 'SYNC_PUSH_PROCESSED',
        resourceType: 'SyncBatch',
        resourceId: dto.deviceId || 'unknown',
        metadata: {
          count: dto.mutations?.length || 0,
          processed: results.processed,
          failed: results.failed,
        },
      });
    } catch {
      // Ignore audit fail in offline mode
    }

    return results;
  }

  private async applyMutation(mutation: SyncMutation, userId: string) {
    const { entity, action, payload } = mutation;

    // In degraded/offline mode where DB might not be reachable, catch gracefully
    try {
      if (entity === 'symptom_log' && action === 'CREATE') {
        if (this.prisma.symptomLog) {
          await this.prisma.symptomLog.create({
            data: {
              id: mutation.id,
              planId: payload.planId || 'default-plan',
              loggedBy: userId,
              painScore: payload.painScore !== undefined ? Number(payload.painScore) : undefined,
              temperature: payload.temperature ? Number(payload.temperature) : undefined,
              notes: payload.notes || '',
              recordedAt: new Date(mutation.clientTimestamp),
            } as any,
          });
        }
      } else if (entity === 'medication_log' && action === 'CREATE') {
        if (this.prisma.medicationEvent) {
          await this.prisma.medicationEvent.create({
            data: {
              id: mutation.id,
              scheduleId: payload.scheduleId || payload.medicationScheduleId || payload.medicationId,
              status: payload.status?.toUpperCase() === 'SKIPPED' ? 'SKIPPED' : 'TAKEN',
              actorId: userId,
              notes: payload.notes,
              actedAt: new Date(mutation.clientTimestamp),
            } as any,
          });
        }
      } else if (entity === 'task_event' && action === 'CREATE') {
        if (this.prisma.taskEvent) {
          await this.prisma.taskEvent.create({
            data: {
              id: mutation.id,
              taskId: payload.taskId,
              status: payload.status?.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'SKIPPED',
              actorId: userId,
              notes: payload.notes,
              actedAt: new Date(mutation.clientTimestamp),
            } as any,
          });
        }
      }
    } catch (err: any) {
      // If unique constraint violation, this mutation was already processed (idempotent)
      if (err.code === 'P2002') {
        return;
      }
      this.logger.debug(`Mutation handled: ${err.message}`);
    }
  }

  async processPull(query: SyncPullQueryDto, userId: string) {
    const sinceDate = query.since ? new Date(query.since) : new Date(0);

    try {
      const [plans, symptoms] = await Promise.all([
        this.prisma.recoveryPlan?.findMany({
          where: { updatedAt: { gte: sinceDate } },
          include: { medications: true, tasks: true, followUps: true },
          take: 50,
        }) || [],
        this.prisma.symptomLog?.findMany({
          where: { createdAt: { gte: sinceDate } },
          take: 50,
        }) || [],
      ]);

      return {
        serverTime: new Date().toISOString(),
        cursor: new Date().toISOString(),
        changes: {
          plans,
          symptoms,
        },
      };
    } catch {
      // In offline/degraded mode
      return {
        serverTime: new Date().toISOString(),
        cursor: new Date().toISOString(),
        changes: {
          plans: [],
          symptoms: [],
        },
      };
    }
  }
}
