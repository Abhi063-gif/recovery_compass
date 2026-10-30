import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { LogAshaVisitDto, EscalateRiskDto, ResolveEscalationDto } from './community.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('caseload')
  async getCaseload(@Req() req: any) {
    const ashaId = req.user?.id || 'asha-demo-worker-01';
    return this.communityService.getCaseload(ashaId);
  }

  @Post('visits')
  async logVisit(@Body() dto: LogAshaVisitDto, @Req() req: any) {
    const ashaId = req.user?.id || 'asha-demo-worker-01';
    return this.communityService.logVisit(dto, ashaId);
  }

  @Post('escalate')
  async escalateRisk(@Body() dto: EscalateRiskDto, @Req() req: any) {
    const actorId = req.user?.id || 'asha-demo-worker-01';
    return this.communityService.escalate(dto, actorId);
  }

  @Get('escalations')
  async getEscalations(@Query('role') role?: string) {
    return this.communityService.getEscalations(role);
  }

  @Put('escalations/:id/resolve')
  async resolveEscalation(
    @Param('id') id: string,
    @Body() dto: ResolveEscalationDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.id || 'anm-supervisor-01';
    return this.communityService.resolveEscalation(id, dto, actorId);
  }
}
