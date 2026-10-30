import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { SymptomsService } from './symptoms.service';
import { LogSymptomDto } from './dto/log-symptom.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Symptoms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: '', version: '1' })
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post('symptoms')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Log a symptom — triggers deterministic red-flag check' })
  async log(@Body() dto: LogSymptomDto, @CurrentUser() user: any) {
    return this.symptomsService.log(dto, user.sub);
  }

  @Get('plans/:id/symptoms')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get symptom history for a plan' })
  async getByPlan(@Param('id') planId: string) {
    return this.symptomsService.getByPlan(planId);
  }

  @Get('symptoms/definitions')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all system-defined symptom definitions' })
  async getDefinitions() {
    return this.symptomsService.getSymptomDefinitions();
  }
}
