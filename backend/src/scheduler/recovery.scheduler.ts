import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ExtractionCategory, TaskStatus, ConditionalStatus } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

/**
 * DETERMINISTIC RECOVERY SCHEDULER
 *
 * CRITICAL SAFETY CONTRACT:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. This scheduler only ORGANIZES confirmed extraction data into a calendar
 * 2. It NEVER creates new medical instructions
 * 3. Every task/schedule entry is traceable to an extraction field
 * 4. Conditional instructions remain conditional — never auto-scheduled
 * 5. Idempotent: re-running produces the same schedules (no duplicates)
 *
 * Example (ALLOWED):
 *   Source: "Take X 500mg twice daily for 5 days"
 *   Output: Day 1–5: X 500mg at morning and evening slots
 *
 * Example (FORBIDDEN):
 *   Creating "Take with food" unless present in source
 *   Inferring "rest for 2 days" from general surgical knowledge
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class RecoveryScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(RecoveryScheduler.name);
  }

  async generateSchedule(planId: string): Promise<void> {
    const plan = await this.prisma.recoveryPlan.findUnique({
      where: { id: planId },
      include: {
        extraction: {
          include: {
            fields: { where: { deletedAt: null, validationStatus: 'CONFIRMED' } },
          },
        },
        medications: { where: { deletedAt: null } },
        template: true,
      },
    });

    if (!plan) throw new Error(`Plan ${planId} not found`);

    const referenceDate = plan.dischargeDate ?? plan.surgeryDate ?? new Date();

    this.logger.log(`Generating schedule for plan ${planId}, reference date: ${referenceDate}`);

    // ─── Generate task schedules ───────────────────────────────────────────
    await this.generateTaskSchedules(plan, referenceDate);

    // ─── Generate medication schedules ─────────────────────────────────────
    await this.generateMedicationSchedules(plan, referenceDate);

    this.logger.log(`Schedule generation complete for plan ${planId}`);
  }

  private async generateTaskSchedules(plan: any, referenceDate: Date): Promise<void> {
    const taskFields = plan.extraction?.fields.filter(
      (f: any) => f.category === ExtractionCategory.TASKS && f.value,
    ) ?? [];

    for (const field of taskFields) {
      // Parse day offset from extraction field
      const dayOffset = this.parseDayOffset(field.value, field.fieldKey);
      const scheduledDate = dayjs(referenceDate).add(dayOffset, 'day').toDate();

      // Check if task already exists (idempotency)
      const existing = await this.prisma.recoveryTask.findFirst({
        where: {
          planId: plan.id,
          extractionFieldId: field.id,
        },
      });

      if (existing) {
        this.logger.debug(`Task for field ${field.id} already exists — skipping`);
        continue;
      }

      // ─── CONDITIONAL instructions stay conditional ─────────────────────
      const isConditional = field.category === ExtractionCategory.CONDITIONAL_INSTRUCTIONS;

      await this.prisma.recoveryTask.create({
        data: {
          planId: plan.id,
          title: field.value!,
          description: field.sourceText ?? undefined,
          dayOffset,
          scheduledDate,
          status: TaskStatus.SCHEDULED,
          isConditional,
          conditionalStatus: isConditional ? ConditionalStatus.PENDING : undefined,
          sourceDocumentId: plan.extraction?.documentId,
          sourcePage: field.page ?? undefined,
          sourceBoundingBox: field.boundingBox ?? undefined,
          sourceText: field.sourceText ?? undefined,
          extractionFieldId: field.id,
        },
      });
    }
  }

  private async generateMedicationSchedules(plan: any, referenceDate: Date): Promise<void> {
    const medications = plan.medications ?? [];

    for (const med of medications) {
      if (!med.startDate && !med.durationDays) {
        this.logger.debug(`Med ${med.id} has no start or duration — skipping schedule`);
        continue;
      }

      const startDate = med.startDate ?? referenceDate;
      const durationDays = med.durationDays ?? 1;
      const timesPerDay = this.parseFrequency(med.frequencyCode ?? med.frequency);

      if (timesPerDay === 0) {
        this.logger.debug(`Med ${med.id} has as-needed/unresolved frequency`);
        continue;
      }

      const timeSlots = this.getTimeSlots(timesPerDay);

      for (let day = 0; day < durationDays; day++) {
        const date = dayjs(startDate).add(day, 'day');

        for (const slot of timeSlots) {
          const scheduledAt = date.hour(slot.hour).minute(slot.minute).second(0).toDate();

          // ─── Idempotency key prevents duplicate schedules ──────────────
          const idempotencyKey = createHash('sha256')
            .update(`${med.id}:${scheduledAt.toISOString()}`)
            .digest('hex');

          const existing = await this.prisma.medicationSchedule.findUnique({
            where: { idempotencyKey },
          });

          if (existing) continue; // Already scheduled

          await this.prisma.medicationSchedule.create({
            data: {
              medicationId: med.id,
              scheduledAt,
              timeLabel: slot.label,
              idempotencyKey,
            },
          });
        }
      }
    }
  }

  /**
   * Parse frequency code into daily dose count.
   * Only handles explicitly supported abbreviations.
   * Returns 0 for unsupported/as-needed.
   */
  parseFrequency(frequency: string | null): number {
    if (!frequency) return 0;
    const f = frequency.trim().toUpperCase();

    const map: Record<string, number> = {
      'OD': 1,    'ONCE DAILY': 1,
      'BD': 2,    'TWICE DAILY': 2,  'BID': 2,   'BDS': 2,
      'TDS': 3,   'TID': 3,          'THREE TIMES DAILY': 3,
      'QID': 4,   'FOUR TIMES DAILY': 4, 'QDS': 4,
      'HS': 1,    'BEDTIME': 1,
    };

    return map[f] ?? 0;
  }

  private getTimeSlots(
    timesPerDay: number,
  ): Array<{ hour: number; minute: number; label: string }> {
    const slotMaps: Record<number, Array<{ hour: number; minute: number; label: string }>> = {
      1: [{ hour: 8, minute: 0, label: 'morning' }],
      2: [
        { hour: 8, minute: 0, label: 'morning' },
        { hour: 20, minute: 0, label: 'evening' },
      ],
      3: [
        { hour: 7, minute: 0, label: 'morning' },
        { hour: 13, minute: 0, label: 'afternoon' },
        { hour: 19, minute: 0, label: 'evening' },
      ],
      4: [
        { hour: 7, minute: 0, label: 'morning' },
        { hour: 11, minute: 0, label: 'midmorning' },
        { hour: 15, minute: 0, label: 'afternoon' },
        { hour: 19, minute: 0, label: 'evening' },
      ],
    };

    return slotMaps[timesPerDay] ?? [{ hour: 8, minute: 0, label: 'morning' }];
  }

  private parseDayOffset(value: string, key: string): number {
    // Extract day number from task description
    // e.g. "Day 3" → 3, "Week 1" → 7
    const dayMatch = value.match(/day\s*(\d+)/i);
    if (dayMatch) return parseInt(dayMatch[1]) - 1;

    const weekMatch = value.match(/week\s*(\d+)/i);
    if (weekMatch) return (parseInt(weekMatch[1]) - 1) * 7;

    return 0; // Default to day 0 (discharge day)
  }
}
