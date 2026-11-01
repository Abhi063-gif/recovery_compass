import { IsString, IsOptional, IsNumber, Min, Max, IsUUID, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogSymptomDto {
  @ApiProperty()
  @IsUUID()
  planId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  symptomDefinitionId?: string;

  @ApiPropertyOptional({ description: 'Custom symptom description when no definition matches' })
  @IsOptional()
  @IsString()
  customSymptom?: string;

  @ApiPropertyOptional({ description: 'Specific structured symptom codes for deterministic red-flag checking' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptomCodes?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 10, description: 'Pain score 0 (none) to 10 (worst)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painScore?: number;

  @ApiPropertyOptional({ description: 'Body temperature in Celsius' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'When the symptom occurred (defaults to now)' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
