import {
  Controller, Post, Patch, Delete, Get, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { FamilyService } from './family.service';
import { UserRole, CaregiverPermission } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

class InviteDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiProperty({ enum: CaregiverPermission, isArray: true })
  @IsArray()
  @IsEnum(CaregiverPermission, { each: true })
  permissions: CaregiverPermission[];
}

class AcceptDto {
  @ApiProperty()
  @IsString()
  otp: string;
}

class UpdatePermissionsDto {
  @ApiProperty({ enum: CaregiverPermission, isArray: true })
  @IsArray()
  @IsEnum(CaregiverPermission, { each: true })
  permissions: CaregiverPermission[];
}

@ApiTags('Family')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: '', version: '1' })
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly usersService: UsersService,
  ) {}

  @Post('plans/:planId/family/invite')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Invite a caregiver with specific permissions' })
  async invite(
    @Param('planId') planId: string,
    @Body() dto: InviteDto,
    @CurrentUser() user: any,
  ) {
    const profile = await this.usersService.getPatientProfile(user.sub);
    return this.familyService.invite(profile.id, user.sub, dto.email, dto.permissions, dto.name, dto.relationship);
  }

  @Post('family/invitations/:token/accept')
  @Roles(UserRole.CAREGIVER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Accept a family invitation using token + OTP' })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptDto,
    @CurrentUser() user: any,
  ) {
    return this.familyService.acceptInvitation(token, dto.otp, user.sub);
  }

  @Patch('family/members/:id')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update caregiver permissions' })
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() user: any,
  ) {
    return this.familyService.updatePermissions(id, user.sub, dto.permissions);
  }

  @Delete('family/members/:id')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Revoke caregiver access — effective immediately' })
  async revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familyService.revoke(id, user.sub);
  }

  @Get('family/members')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get all active family members' })
  async getMembers(@CurrentUser() user: any) {
    const profile = await this.usersService.getPatientProfile(user.sub);
    return this.familyService.getFamilyMembers(profile.id);
  }

  @Get('family/patient-overview')
  @Roles(UserRole.CAREGIVER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get active patient recovery overview for caregiver oversight' })
  async getPatientOverview(@CurrentUser() user: any) {
    return this.familyService.getCaregiverPatientOverview(user.sub);
  }
}
