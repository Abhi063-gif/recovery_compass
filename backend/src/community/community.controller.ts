import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { LogAshaVisitDto, EscalateRiskDto, ResolveEscalationDto } from './community.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Community')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'community', version: '1' })
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('caseload')
  @Roles(UserRole.ASHA, UserRole.ANM, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get assigned recovery caseload for ASHA/ANM with optional block/village filtering' })
  async getCaseload(
    @Req() req: any,
    @Query('block') block?: string,
    @Query('village') village?: string,
  ) {
    const ashaId = req.user?.id || req.user?.sub || 'asha-demo-worker-01';
    return this.communityService.getCaseload(ashaId, { block, village });
  }

  @Post('visits')
  @Roles(UserRole.ASHA, UserRole.ANM, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log an in-person blister/vital check ASHA home visit' })
  async logVisit(@Body() dto: LogAshaVisitDto, @Req() req: any) {
    const ashaId = req.user?.id || req.user?.sub || 'asha-demo-worker-01';
    return this.communityService.logVisit(dto, ashaId);
  }

  @Post('escalate')
  @Roles(UserRole.ASHA, UserRole.ANM, UserRole.ADMIN)
  @ApiOperation({ summary: 'Escalate a patient red flag or non-adherence to ANM/MO' })
  async escalateRisk(@Body() dto: EscalateRiskDto, @Req() req: any) {
    const actorId = req.user?.id || req.user?.sub || 'asha-demo-worker-01';
    return this.communityService.escalate(dto, actorId);
  }

  @Get('escalations')
  @Roles(UserRole.ASHA, UserRole.ANM, UserRole.ADMIN)
  @ApiOperation({ summary: 'List active clinical escalations' })
  async getEscalations(@Query('role') role?: string) {
    return this.communityService.getEscalations(role);
  }

  @Put('escalations/:id/resolve')
  @Roles(UserRole.ANM, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve an escalation with clinical notes (ANM/MO only)' })
  async resolveEscalation(
    @Param('id') id: string,
    @Body() dto: ResolveEscalationDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || req.user?.sub || 'anm-supervisor-01';
    return this.communityService.resolveEscalation(id, dto, actorId);
  }
}
