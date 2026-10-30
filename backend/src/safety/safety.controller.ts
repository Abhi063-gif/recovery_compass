import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RedFlagEngine } from './red-flag.engine';
import { UserRole } from '@prisma/client';
import { IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class SafetyCheckDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  symptomCodes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;

  symptomLogId?: string;
}

@ApiTags('Safety')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'plans', version: '1' })
export class SafetyController {
  constructor(private readonly redFlagEngine: RedFlagEngine) {}

  @Post(':id/safety/check')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({
    summary: 'Run deterministic red-flag check against symptom data',
    description: 'Uses ONLY clinician-reviewed deterministic rules. No AI or LLM involved.',
  })
  async check(
    @Param('id') planId: string,
    @Body() dto: SafetyCheckDto,
    @CurrentUser() user: any,
  ) {
    return this.redFlagEngine.evaluate(planId, dto.symptomLogId ?? 'manual', dto, user.sub);
  }

  @Get(':id/red-flags')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all red-flag events for a plan' })
  async getRedFlags(@Param('id') planId: string) {
    return this.redFlagEngine.getRedFlagEvents(planId);
  }
}
