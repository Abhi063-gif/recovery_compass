import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'sharda.patil@rural.recoverycompass.org' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'SecurePass123!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiProperty({ example: 'Sharda' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Patil' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.PATIENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;
}
