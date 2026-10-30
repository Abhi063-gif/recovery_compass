import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { AdminService } from './admin.service';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pathways')
  @ApiOperation({ summary: 'Get all pathway templates' })
  async getPathways() {
    return this.adminService.getPathways();
  }

  @Post('pathways')
  @ApiOperation({ summary: 'Create a new pathway template' })
  async createPathway(@Body() body: any, @CurrentUser() user: any) {
    return this.adminService.createPathway(body, user.sub);
  }

  @Get('red-flags')
  @ApiOperation({ summary: 'Get all red-flag rules' })
  async getRedFlagRules() {
    return this.adminService.getRedFlagRules();
  }

  @Post('red-flags')
  @ApiOperation({ summary: 'Create a new red-flag rule (starts as DRAFT)' })
  async createRedFlagRule(@Body() body: any, @CurrentUser() user: any) {
    return this.adminService.createRedFlagRule(body, user.sub);
  }

  @Patch('red-flags/:id')
  @ApiOperation({ summary: 'Update red-flag rule status/config (DRAFT→REVIEW→ACTIVE→RETIRED)' })
  async updateRedFlagRule(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateRedFlagRule(id, body, user.sub);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get system configuration' })
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Set system configuration value' })
  async setConfig(@Body() body: { key: string; value: any }, @CurrentUser() user: any) {
    return this.adminService.setConfig(body.key, body.value, user.sub);
  }
}
