import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicationEventStatus } from '@prisma/client';

export class LogMedicationEventDto {
  @ApiProperty({ enum: MedicationEventStatus })
  @IsEnum(MedicationEventStatus)
  status: MedicationEventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
