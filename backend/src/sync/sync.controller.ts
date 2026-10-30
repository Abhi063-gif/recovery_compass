import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullQueryDto } from './sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() dto: SyncPushDto, @Req() req: any) {
    const userId = req.user?.id || 'anonymous-offline-client';
    return this.syncService.processPush(dto, userId);
  }

  @Get('pull')
  async pull(@Query() query: SyncPullQueryDto, @Req() req: any) {
    const userId = req.user?.id || 'anonymous-offline-client';
    return this.syncService.processPull(query, userId);
  }
}
