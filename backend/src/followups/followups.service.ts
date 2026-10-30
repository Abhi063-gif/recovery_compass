import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import ical, { ICalCalendarMethod } from 'ical-generator';

@Injectable()
export class FollowupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByPlan(planId: string) {
    return this.prisma.followUp.findMany({
      where: { planId, deletedAt: null },
      include: { pendingTests: true },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async create(planId: string, data: any) {
    return this.prisma.followUp.create({
      data: {
        planId,
        appointmentType: data.appointmentType,
        clinicianName: data.clinicianName,
        purpose: data.purpose,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        relativeDuration: data.relativeDuration,
        originalInstruction: data.originalInstruction,
        sourceText: data.sourceText,
        notes: data.notes,
      },
    });
  }

  async getById(id: string) {
    const fu = await this.prisma.followUp.findUnique({
      where: { id, deletedAt: null },
      include: { pendingTests: true },
    });
    if (!fu) throw new NotFoundException('Follow-up not found');
    return fu;
  }

  /**
   * Generate ICS calendar event for a follow-up appointment.
   * Standard .ics format compatible with Google Calendar, Outlook, Apple Calendar.
   */
  async generateCalendar(id: string): Promise<string> {
    const fu = await this.getById(id);

    if (!fu.scheduledDate) {
      throw new NotFoundException('Follow-up has no scheduled date');
    }

    const date = fu.scheduledDate;
    const calendar = ical({ name: 'Recovery Compass', method: ICalCalendarMethod.REQUEST });
    calendar.createEvent({
      start: date,
      end: new Date(date.getTime() + 60 * 60 * 1000),
      summary: fu.appointmentType,
      description: fu.purpose ?? 'Recovery Compass Follow-up',
      organizer: fu.clinicianName ? { name: fu.clinicianName } : undefined,
    });

    return calendar.toString();
  }
}
