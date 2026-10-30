import { Module } from '@nestjs/common';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { MedicationValidator } from './validators/medication.validator';

@Module({
  controllers: [MedicationsController],
  providers: [MedicationsService, MedicationValidator],
  exports: [MedicationsService],
})
export class MedicationsModule {}
