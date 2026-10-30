import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { PrivacyService } from './privacy.service';

@ApiTags('Privacy')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'privacy', version: '1' })
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('delete-request')
  @ApiOperation({
    summary: 'Request complete account and data deletion',
    description: 'Revokes family access, removes documents, anonymizes account. Audit records preserved.',
  })
  async requestDeletion(@CurrentUser() user: any) {
    return this.privacyService.requestDeletion(user.sub);
  }
}
