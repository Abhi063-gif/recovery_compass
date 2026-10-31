import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullQueryDto } from './sync.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Sync')
@Controller({ path: 'sync', version: '1' })
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() dto: SyncPushDto, @Req() req: any) {
    let userId = req.user?.id;
    if (!userId && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          userId = decoded.sub || decoded.id || decoded.userId;
        }
      } catch {
        // ignore parse error if malformed
      }
    }
    userId = userId || 'anonymous-offline-client';
    return this.syncService.processPush(dto, userId);
  }

  @Get('pull')
  async pull(@Query() query: SyncPullQueryDto, @Req() req: any) {
    let userId = req.user?.id;
    if (!userId && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          userId = decoded.sub || decoded.id || decoded.userId;
        }
      } catch {
        // ignore
      }
    }
    userId = userId || 'anonymous-offline-client';
    return this.syncService.processPull(query, userId);
  }
}
