import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { DocumentsService } from './documents.service';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a discharge document (PDF or image)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        patientProfileId: {
          type: 'string',
          description: 'Patient Profile ID (for ASHA/Admin assisted uploads)',
        },
      },
    },
  })
  @ApiQuery({
    name: 'patientProfileId',
    required: false,
    description: 'Patient Profile ID (for ASHA/Admin assisted uploads)',
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Body('patientProfileId') bodyPatientProfileId?: string,
    @Query('patientProfileId') queryPatientProfileId?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    let patientProfileId: string;

    const providedProfileId =
      bodyPatientProfileId ||
      queryPatientProfileId ||
      req.body?.patientProfileId ||
      (req.query?.patientProfileId as string);

    if (user.role === UserRole.ASHA || user.role === UserRole.ADMIN) {
      if (providedProfileId) {
        patientProfileId = providedProfileId;
      } else {
        try {
          const patientProfile = await this.usersService.getPatientProfile(user.sub);
          patientProfileId = patientProfile.id;
        } catch {
          throw new BadRequestException('patientProfileId is required for assisted upload');
        }
      }
    } else {
      const patientProfile = await this.usersService.getPatientProfile(user.sub);
      patientProfileId = patientProfile.id;
    }

    return this.documentsService.upload(file, patientProfileId, user.sub, req.ip);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get document metadata and status' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CAREGIVER) {
      return this.documentsService.findById(id);
    }
    const patientProfile = await this.usersService.getPatientProfile(user.sub);
    return this.documentsService.findById(id, patientProfile.id);
  }

  @Post(':id/process')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Trigger or re-trigger document processing' })
  async process(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    let patientProfileId: string;
    if (user.role === UserRole.ASHA || user.role === UserRole.ADMIN) {
      const doc = await this.documentsService.findById(id);
      patientProfileId = doc.patientProfileId;
    } else {
      const patientProfile = await this.usersService.getPatientProfile(user.sub);
      patientProfileId = patientProfile.id;
    }
    return this.documentsService.triggerProcessing(id, patientProfileId, user.sub);
  }

  @Get(':id/pages')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all pages and regions for a document' })
  async getPages(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CAREGIVER) {
      return this.documentsService.getPages(id);
    }
    const patientProfile = await this.usersService.getPatientProfile(user.sub);
    return this.documentsService.getPages(id, patientProfile.id);
  }

  @Get(':id/quality')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get document quality analysis report' })
  async getQuality(@Param('id') id: string) {
    return this.documentsService.getQualityReport(id);
  }
}
