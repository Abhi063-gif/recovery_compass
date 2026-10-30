import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { DoctorQuestionsService } from './doctor-questions.service';
import { UserRole } from '@prisma/client';

@ApiTags('DoctorQuestions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: '', version: '1' })
export class DoctorQuestionsController {
  constructor(private readonly service: DoctorQuestionsService) {}

  @Get('plans/:id/doctor-questions')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all unresolved clinician questions for a plan' })
  async getForPlan(@Param('id') planId: string) {
    return this.service.getForPlan(planId);
  }

  @Post('plans/:id/doctor-questions/generate')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Re-generate doctor questions from current extraction state' })
  async generate(@Param('id') planId: string) {
    await this.service.generateForPlan(planId);
    return { message: 'Questions generated' };
  }

  @Post('doctor-questions/:id/resolve')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Mark a question as resolved' })
  async resolve(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.service.resolve(id, body.note);
  }
}
