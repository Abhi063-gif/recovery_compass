import { Controller, Get, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { FollowupsService } from './followups.service';
import { UserRole } from '@prisma/client';

@ApiTags('FollowUps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: '', version: '1' })
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsService) {}

  @Get('plans/:id/follow-ups')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all follow-ups for a plan' })
  async getByPlan(@Param('id') planId: string) {
    return this.followupsService.getByPlan(planId);
  }

  @Post('follow-ups')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Add a patient-entered follow-up appointment' })
  async create(@Body() body: any) {
    return this.followupsService.create(body.planId, body);
  }

  @Get('follow-ups/:id')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get follow-up details' })
  async findOne(@Param('id') id: string) {
    return this.followupsService.getById(id);
  }

  @Get('follow-ups/:id/calendar')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Download .ics calendar file for a follow-up appointment' })
  async getCalendar(@Param('id') id: string, @Res() res: Response) {
    const icsContent = await this.followupsService.generateCalendar(id);
    res.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="followup-${id}.ics"`,
    });
    res.send(icsContent);
  }
}
