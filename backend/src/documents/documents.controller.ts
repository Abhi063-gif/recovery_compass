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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  @Roles(UserRole.PATIENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a discharge document (PDF or image)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const patientProfile = await this.usersService.getPatientProfile(user.sub);

    return this.documentsService.upload(file, patientProfile.id, user.sub, req.ip);
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
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Trigger or re-trigger document processing' })
  async process(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const patientProfile = await this.usersService.getPatientProfile(user.sub);
    return this.documentsService.triggerProcessing(id, patientProfile.id, user.sub);
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
