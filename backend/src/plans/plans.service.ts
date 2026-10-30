import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RecoveryScheduler } from '../scheduler/recovery.scheduler';
import { PlanStatus, TaskStatus } from '@prisma/client';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly scheduler: RecoveryScheduler,
  ) {}

  async create(dto: CreatePlanDto, patientProfileId: string, userId: string) {
    // Verify extraction is confirmed before generating plan
    if (dto.extractionId) {
      const extraction = await this.prisma.extraction.findUnique({
        where: { id: dto.extractionId },
      });
      if (!extraction) throw new NotFoundException('Extraction not found');
      if (extraction.status !== 'CONFIRMED') {
        throw new BadRequestException(
          'Extraction must be confirmed by patient before generating a recovery plan.',
        );
      }
    }

    const template = await this.prisma.pathwayTemplate.findFirst({
      where: { identifier: dto.pathwayIdentifier, isActive: true },
    });
    if (!template) throw new NotFoundException('Pathway template not found');

    const plan = await this.prisma.recoveryPlan.create({
      data: {
        patientProfileId,
        extractionId: dto.extractionId,
        pathwayTemplateId: template.id,
        status: PlanStatus.DRAFT,
        surgeryDate: dto.surgeryDate ? new Date(dto.surgeryDate) : undefined,
        dischargeDate: dto.dischargeDate ? new Date(dto.dischargeDate) : undefined,
        surgeryType: dto.surgeryType,
        clinicianName: dto.clinicianName,
        hospitalName: dto.hospitalName,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'PLAN_CREATED',
      resourceType: 'RecoveryPlan',
      resourceId: plan.id,
      planId: plan.id,
    });

    return plan;
  }

  async findByPatient(patientProfileId: string) {
    return this.prisma.recoveryPlan.findMany({
      where: { patientProfileId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        tasks: { where: { deletedAt: null }, orderBy: { dayOffset: 'asc' } },
        medications: { where: { deletedAt: null } },
        followUps: { where: { deletedAt: null } },
      },
    });
  }

  async findByCaregiver(userId: string) {
    const caregiverProfile = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
      include: {
        familyMemberships: {
          where: { isActive: true, permissions: { has: 'VIEW_PLAN' } },
          include: {
            patientProfile: {
              include: {
                recoveryPlans: {
                  where: { deletedAt: null },
                  orderBy: { createdAt: 'desc' },
                  include: {
                    template: true,
                    tasks: { where: { deletedAt: null }, orderBy: { dayOffset: 'asc' } },
                    medications: { where: { deletedAt: null } },
                    followUps: { where: { deletedAt: null } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!caregiverProfile) return [];
    return caregiverProfile.familyMemberships.flatMap((m) => m.patientProfile.recoveryPlans);
  }

  async findById(planId: string, patientProfileId?: string, caregiverProfileId?: string) {
    const plan = await this.prisma.recoveryPlan.findFirst({
      where: {
        id: planId,
        deletedAt: null,
        ...(patientProfileId ? { patientProfileId } : {}),
      },
      include: {
        template: true,
        tasks: { where: { deletedAt: null }, orderBy: { dayOffset: 'asc' } },
        medications: { where: { deletedAt: null } },
        followUps: { where: { deletedAt: null } },
      },
    });

    if (!plan) throw new NotFoundException('Recovery plan not found');

    // If caregiver access, verify membership
    if (caregiverProfileId && !patientProfileId) {
      await this.verifyCaregiversAccess(plan.patientProfileId, caregiverProfileId, 'VIEW_PLAN');
    }

    return plan;
  }

  async confirm(planId: string, userId: string) {
    const plan = await this.prisma.recoveryPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.status === PlanStatus.ACTIVE) {
      throw new BadRequestException('Plan is already active');
    }

    // Generate tasks and medication schedules via deterministic scheduler
    await this.scheduler.generateSchedule(planId);

    const confirmed = await this.prisma.recoveryPlan.update({
      where: { id: planId },
      data: {
        status: PlanStatus.ACTIVE,
        confirmedAt: new Date(),
        confirmedBy: userId,
        planVersion: { increment: 1 },
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'PLAN_CONFIRMED',
      resourceType: 'RecoveryPlan',
      resourceId: planId,
      planId,
    });

    return confirmed;
  }

  async getTimeline(planId: string) {
    const plan = await this.prisma.recoveryPlan.findUnique({
      where: { id: planId },
      include: {
        tasks: {
          where: { deletedAt: null },
          orderBy: { dayOffset: 'asc' },
        },
        medications: {
          where: { deletedAt: null },
          include: {
            schedules: {
              orderBy: { scheduledAt: 'asc' },
              include: { events: { orderBy: { actedAt: 'desc' }, take: 1 } },
            },
          },
        },
        followUps: {
          where: { deletedAt: null },
          orderBy: { scheduledDate: 'asc' },
        },
        symptomLogs: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getSnapshot(planId: string) {
    return this.getTimeline(planId);
  }

  async getProgress(planId: string) {
    const [tasks, medEvents, followUps, symptomLogs] = await Promise.all([
      this.prisma.recoveryTask.findMany({ where: { planId, deletedAt: null } }),
      this.prisma.medicationEvent.findMany({
        where: { schedule: { medication: { planId } } },
      }),
      this.prisma.followUp.findMany({ where: { planId, deletedAt: null } }),
      this.prisma.symptomLog.findMany({ where: { planId }, orderBy: { recordedAt: 'asc' } }),
    ]);

    const taskCompletion =
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === 'COMPLETED').length / tasks.length) * 100)
        : 0;

    const medAdherence =
      medEvents.length > 0
        ? Math.round(
            (medEvents.filter((e) => e.status === 'TAKEN').length / medEvents.length) * 100,
          )
        : 0;

    const followUpCompletion =
      followUps.length > 0
        ? Math.round(
            (followUps.filter((f) => f.isConfirmed).length / followUps.length) * 100,
          )
        : 0;

    const painTrend = symptomLogs
      .filter((l) => l.painScore !== null)
      .slice(-7)
      .map((l) => ({ date: l.recordedAt, score: l.painScore }));

    return {
      taskCompletion,
      medAdherence,
      followUpCompletion,
      painTrend,
      // NOTE: No "medical recovery percentage" — only behavioral metrics
    };
  }

  async updateTask(taskId: string, status: TaskStatus, userId: string, notes?: string) {
    const task = await this.prisma.recoveryTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const updated = await this.prisma.recoveryTask.update({
      where: { id: taskId },
      data: { status },
    });

    await this.prisma.taskEvent.create({
      data: {
        taskId,
        status,
        actorId: userId,
        notes,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'TASK_STATUS_UPDATED',
      resourceType: 'RecoveryTask',
      resourceId: taskId,
      planId: task.planId,
      metadata: { previousStatus: task.status, newStatus: status },
    });

    return updated;
  }

  private async verifyCaregiversAccess(
    patientProfileId: string,
    caregiverProfileId: string,
    permission: string,
  ): Promise<void> {
    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        patientProfileId,
        caregiverProfileId,
        isActive: true,
        permissions: { has: permission as any },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this recovery plan');
    }
  }
}
