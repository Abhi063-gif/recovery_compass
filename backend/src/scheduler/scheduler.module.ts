import { Module } from '@nestjs/common';
import { RecoveryScheduler } from './recovery.scheduler';

@Module({
  providers: [RecoveryScheduler],
  exports: [RecoveryScheduler],
})
export class SchedulerModule {}
