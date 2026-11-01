import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { AuditModule } from '../audit/audit.module';
import { DoctorQuestionsModule } from '../doctor-questions/doctor-questions.module';

@Module({
  imports: [SchedulerModule, AuditModule, DoctorQuestionsModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
