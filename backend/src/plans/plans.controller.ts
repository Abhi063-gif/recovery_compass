import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { PlansService } from './plans.service';
import { UserRole, TaskStatus } from '@prisma/client';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create a new recovery plan from confirmed extraction' })
  async create(@Body() dto: CreatePlanDto, @CurrentUser() user: any) {
    const profile = await this.usersService.getPatientProfile(user.sub);
    return this.plansService.create(dto, profile.id, user.sub);
  }

  @Get()
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get current user recovery plan(s)' })
  async findUserPlans(@CurrentUser() user: any) {
    if (user.role === UserRole.CAREGIVER) {
      return this.plansService.findByCaregiver(user.sub);
    }
    const profile = await this.usersService.getPatientProfile(user.sub);
    return this.plansService.findByPatient(profile.id);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get recovery plan details' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CAREGIVER) {
      const caregiver = await this.usersService.findById(user.sub);
      return this.plansService.findById(id, undefined, caregiver?.caregiverProfile?.id);
    }
    const profile = await this.usersService.getPatientProfile(user.sub);
    return this.plansService.findById(id, profile.id);
  }

  @Post(':id/confirm')
  @Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Confirm and activate recovery plan',
    description: 'Plan cannot become active without explicit patient confirmation.',
  })
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.confirm(id, user.sub);
  }

  @Get(':id/timeline')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get full plan timeline with tasks, meds and follow-ups' })
  async getTimeline(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.getTimeline(id);
  }

  @Get(':id/snapshot')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get full plan snapshot for offline caching' })
  async getSnapshot(@Param('id') id: string) {
    return this.plansService.getSnapshot(id);
  }

  @Get(':id/progress')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get plan progress metrics (task completion, medication adherence, pain trend)' })
  async getProgress(@Param('id') id: string) {
    return this.plansService.getProgress(id);
  }

  @Patch('tasks/:taskId')
  @Roles(UserRole.PATIENT, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Update task status (SCHEDULED, COMPLETED, SKIPPED)' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() body: { status: TaskStatus; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.plansService.updateTask(taskId, body.status, user.sub, body.notes);
  }
}
