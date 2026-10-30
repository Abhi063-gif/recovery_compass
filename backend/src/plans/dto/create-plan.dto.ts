import { IsString, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PathwayIdentifier } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ enum: PathwayIdentifier, default: 'POST_SURGERY' })
  @IsEnum(PathwayIdentifier)
  pathwayIdentifier: PathwayIdentifier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  extractionId?: string;

  @ApiPropertyOptional({ example: '2025-03-15' })
  @IsOptional()
  @IsDateString()
  surgeryDate?: string;

  @ApiPropertyOptional({ example: '2025-03-17' })
  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeryType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalName?: string;
}
