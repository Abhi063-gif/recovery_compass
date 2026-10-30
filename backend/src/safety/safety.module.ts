import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { RedFlagEngine } from './red-flag.engine';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [SafetyController],
  providers: [RedFlagEngine],
  exports: [RedFlagEngine],
})
export class SafetyModule {}
