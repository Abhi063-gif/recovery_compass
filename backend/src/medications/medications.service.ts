import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MedicationValidator } from './validators/medication.validator';
import { MedicationEventStatus } from '@prisma/client';
import { LogMedicationEventDto } from './dto/log-event.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: MedicationValidator,
    private readonly auditService: AuditService,
  ) {}

  async getByPlan(planId: string) {
    return this.prisma.medication.findMany({
      where: { planId, deletedAt: null },
      include: {
        schedules: {
          orderBy: { scheduledAt: 'asc' },
          include: { events: { orderBy: { actedAt: 'desc' }, take: 1 } },
        },
      },
    });
  }

  async logEvent(scheduleId: string, dto: LogMedicationEventDto, userId: string) {
    const schedule = await this.prisma.medicationSchedule.findUnique({
      where: { id: scheduleId, deletedAt: null },
      include: { medication: true },
    });

    if (!schedule) throw new NotFoundException('Medication schedule not found');

    // Prevent duplicate events for the same schedule in the same session
    const recentEvent = await this.prisma.medicationEvent.findFirst({
      where: {
        scheduleId,
        actedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5-minute window
        status: dto.status,
      },
    });

    if (recentEvent) {
      throw new BadRequestException(
        'A duplicate medication event was detected within 5 minutes. Please refresh.',
      );
    }

    const event = await this.prisma.medicationEvent.create({
      data: {
        scheduleId,
        status: dto.status as MedicationEventStatus,
        actedAt: dto.actedAt ? new Date(dto.actedAt) : new Date(),
        actorId: userId,
        notes: dto.notes,
      },
    });

    // NOTE: We do NOT provide advice for missed doses
    // That is a clinical decision outside this system's scope.

    await this.auditService.log({
      actorId: userId,
      action: 'MEDICATION_EVENT_LOGGED',
      resourceType: 'MedicationEvent',
      resourceId: event.id,
      metadata: {
        scheduleId,
        status: dto.status,
        medicationId: schedule.medicationId,
      },
    });

    return event;
  }

  async getTodayMedications(planId: string) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    return this.prisma.medicationSchedule.findMany({
      where: {
        medication: { planId, deletedAt: null },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      include: {
        medication: true,
        events: { orderBy: { actedAt: 'desc' }, take: 1 },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getMissedMedications(planId: string) {
    const now = new Date();

    const pastSchedules = await this.prisma.medicationSchedule.findMany({
      where: {
        medication: { planId, deletedAt: null },
        scheduledAt: { lt: now },
        deletedAt: null,
      },
      include: {
        medication: true,
        events: true,
      },
    });

    return pastSchedules.filter((s) => s.events.length === 0);
  }
}
