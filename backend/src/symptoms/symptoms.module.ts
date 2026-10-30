import { Module } from '@nestjs/common';
import { SymptomsController } from './symptoms.controller';
import { SymptomsService } from './symptoms.service';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [SafetyModule],
  controllers: [SymptomsController],
  providers: [SymptomsService],
  exports: [SymptomsService],
})
export class SymptomsModule {}
