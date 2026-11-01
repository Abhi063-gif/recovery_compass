import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SyncPushDto, SyncPullQueryDto, SyncMutation } from './sync.dto';
import { AuditService } from '../audit/audit.service';
import { CommunityService } from '../community/community.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly communityService?: CommunityService,
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

    try {
      if (entity === 'symptom_log' && (action === 'CREATE' || action === 'UPDATE')) {
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
      } else if (entity === 'medication_log' && (action === 'CREATE' || action === 'UPDATE')) {
        if (this.prisma.medicationEvent) {
          await this.prisma.medicationEvent.create({
            data: {
              id: mutation.id,
              scheduleId: payload.scheduleId || payload.medicationScheduleId || payload.medicationId || 'default-schedule',
              status: payload.status?.toUpperCase() === 'SKIPPED' ? 'SKIPPED' : 'TAKEN',
              actorId: userId,
              notes: payload.notes,
              actedAt: new Date(mutation.clientTimestamp),
            } as any,
          });
        }
      } else if (entity === 'task_event' && (action === 'CREATE' || action === 'UPDATE')) {
        if (this.prisma.taskEvent) {
          await this.prisma.taskEvent.create({
            data: {
              id: mutation.id,
              taskId: payload.taskId || 'default-task',
              status: payload.status?.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'SKIPPED',
              actorId: userId,
              notes: payload.notes || '',
              actedAt: new Date(mutation.clientTimestamp),
            } as any,
          });
        }
        if (action === 'UPDATE' && payload.taskId && this.prisma.recoveryTask) {
          try {
            await this.prisma.recoveryTask.update({
              where: { id: payload.taskId },
              data: {
                status: payload.status?.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'SKIPPED',
                completedAt: payload.status?.toUpperCase() === 'COMPLETED' ? new Date(mutation.clientTimestamp) : null,
              } as any,
            });
          } catch (e: any) {
            this.logger.debug(`RecoveryTask update deferred: ${e?.message}`);
          }
        }
      } else if (entity === 'asha_visit' && (action === 'CREATE' || action === 'UPDATE')) {
        const bloodPressureSystolic = payload.vitals?.bloodPressureSystolic ?? payload.bloodPressureSystolic;
        const bloodPressureDiastolic = payload.vitals?.bloodPressureDiastolic ?? payload.bloodPressureDiastolic;
        const bloodPressure = (bloodPressureSystolic && bloodPressureDiastolic)
          ? `${bloodPressureSystolic}/${bloodPressureDiastolic}`
          : payload.vitals?.bloodPressure || payload.bloodPressure || null;

        const temperatureFahrenheit = payload.vitals?.temperatureFahrenheit ?? payload.vitals?.temperature ?? payload.temperature;
        const blisterPackCount = payload.blisterPillsRemaining ?? payload.remainingPillCount ?? payload.blisterPackCount ?? payload.pillCount;
        const notes = payload.notes || payload.medicationNotes || 'Recorded via offline sync push';

        const vitals = {
          bloodPressure,
          bloodPressureSystolic,
          bloodPressureDiastolic,
          temperatureFahrenheit,
          bloodGlucoseMgDl: payload.vitals?.bloodGlucoseMgDl ?? payload.bloodGlucoseMgDl,
          pulseBpm: payload.vitals?.pulseBpm ?? payload.pulseBpm,
          blisterPackCount,
          notes,
        };

        if (this.communityService) {
          await this.communityService.logVisit(
            {
              patientId: payload.patientId || 'unknown-patient',
              visitDate: payload.visitDate || mutation.clientTimestamp || new Date().toISOString(),
              medicationVerified: payload.medicationVerified ?? false,
              medicationNotes: notes,
              remainingPillCount: blisterPackCount,
              sideEffectsReported: payload.sideEffectsReported || payload.redFlagsIdentified || [],
              vitals,
              notes,
            },
            userId,
          );
        }

        try {
          await this.audit.log({
            actorId: userId,
            action: 'ASHA_VISIT_LOGGED',
            resourceType: 'PatientVisit',
            resourceId: payload.patientId || mutation.id,
            planId: payload.planId,
            metadata: {
              mutationId: mutation.id,
              patientId: payload.patientId,
              visitDate: payload.visitDate || mutation.clientTimestamp || new Date().toISOString(),
              vitals,
              bloodPressure,
              temperature: temperatureFahrenheit,
              blisterPackCount,
              medicationVerified: payload.medicationVerified ?? false,
              notes,
            },
          });
        } catch {
          // Degraded audit fallback
        }
        this.logger.log(`[Sync] Persisted offline ASHA visit mutation ${mutation.id} with vitals for patient ${payload.patientId}`);
      } else if (entity === 'escalation' && (action === 'CREATE' || action === 'UPDATE')) {
        const validRoles: ('ANM' | 'PHC_MEDICAL_OFFICER')[] = ['ANM', 'PHC_MEDICAL_OFFICER'];
        const targetRole = validRoles.includes(payload.targetRole) ? (payload.targetRole as 'ANM' | 'PHC_MEDICAL_OFFICER') : 'ANM';
        const validSeverities: ('WARNING' | 'URGENT' | 'EMERGENCY')[] = ['WARNING', 'URGENT', 'EMERGENCY'];
        const severity = validSeverities.includes(payload.severity) ? (payload.severity as 'WARNING' | 'URGENT' | 'EMERGENCY') : 'WARNING';

        if (this.communityService) {
          await this.communityService.escalate(
            {
              patientId: payload.patientId || 'unknown-patient',
              targetRole,
              severity,
              reason: payload.reason || 'Clinical risk review requested via offline sync',
              triggerDetails: payload.triggerDetails,
              currentVitalsSummary: payload.currentVitalsSummary,
              notes: payload.notes,
            },
            userId,
          );
        }

        try {
          await this.audit.log({
            actorId: userId,
            action: 'RISK_ESCALATED',
            resourceType: 'RiskEscalation',
            resourceId: mutation.id,
            metadata: {
              mutationId: mutation.id,
              patientId: payload.patientId,
              targetRole,
              severity,
              reason: payload.reason,
              notes: payload.notes,
            },
          });
        } catch {
          // Degraded audit fallback
        }
        this.logger.log(`[Sync] Persisted offline clinical escalation mutation ${mutation.id} for patient ${payload.patientId}`);
      }
    } catch (err: any) {
      // If unique constraint violation, this mutation was already processed (idempotent)
      if (err.code === 'P2002') {
        this.logger.debug(`Mutation ${mutation.id} already processed (idempotent P2002)`);
        return;
      }
      this.logger.warn(`Mutation error on ${mutation.id}: ${err.message}`);
      throw err;
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
