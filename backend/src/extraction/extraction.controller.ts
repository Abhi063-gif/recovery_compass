import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { ExtractionService } from './extraction.service';
import { UserRole } from '@prisma/client';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpdateFieldDto {
  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

class MarkUnclearDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Extractions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'extractions', version: '1' })
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get extraction with all fields for verification' })
  async getExtraction(@Param('id') id: string) {
    return this.extractionService.getExtraction(id);
  }

  @Patch(':id/fields/:fieldId')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Edit an extraction field value during verification' })
  async updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFieldDto,
    @CurrentUser() user: any,
  ) {
    return this.extractionService.updateField(id, fieldId, dto.value, user.sub, dto.notes);
  }

  @Post(':id/confirm')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm extraction after patient verification' })
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.extractionService.confirmExtraction(id, user.sub);
  }

  @Post(':id/mark-unclear')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark an extraction unclear — generates a doctor question' })
  async markUnclear(
    @Param('id') id: string,
    @Body() body: { fieldId: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.extractionService.markUnclear(id, body.fieldId, user.sub, body.notes);
  }

  @Get(':id/fields/:fieldId/source')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get source reference — "Show me where this came from"' })
  async getSource(@Param('id') id: string, @Param('fieldId') fieldId: string) {
    return this.extractionService.getSourceReference(id, fieldId);
  }
}
