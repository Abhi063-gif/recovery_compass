import { Module } from '@nestjs/common';
import { DoctorQuestionsController } from './doctor-questions.controller';
import { DoctorQuestionsService } from './doctor-questions.service';

@Module({
  controllers: [DoctorQuestionsController],
  providers: [DoctorQuestionsService],
  exports: [DoctorQuestionsService],
})
export class DoctorQuestionsModule {}
