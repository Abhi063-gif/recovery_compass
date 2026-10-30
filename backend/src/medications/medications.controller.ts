import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { MedicationsService } from './medications.service';
import { LogMedicationEventDto } from './dto/log-event.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Medications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: '', version: '1' })
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get('plans/:id/medications')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all medications for a plan with schedule and events' })
  async getByPlan(@Param('id') planId: string) {
    return this.medicationsService.getByPlan(planId);
  }

  @Get('plans/:id/medications/today')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: "Get today's medication schedule" })
  async getToday(@Param('id') planId: string) {
    return this.medicationsService.getTodayMedications(planId);
  }

  @Get('plans/:id/medications/missed')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get past medication schedules with no event recorded' })
  async getMissed(@Param('id') planId: string) {
    return this.medicationsService.getMissedMedications(planId);
  }

  @Post('medications/:scheduleId/events')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Log a medication event (taken, skipped, missed)' })
  async logEvent(
    @Param('scheduleId') scheduleId: string,
    @Body() dto: LogMedicationEventDto,
    @CurrentUser() user: any,
  ) {
    return this.medicationsService.logEvent(scheduleId, dto, user.sub);
  }
}
