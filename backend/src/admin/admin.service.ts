import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedFlagRuleStatus } from '@prisma/client';

/**
 * Admin Service
 *
 * Manages system configuration, pathway templates, and red-flag rules.
 *
 * SAFETY: Red-flag rule updates require:
 * - Authenticated admin
 * - Validation
 * - Versioning
 * - Audit event
 *
 * Rule lifecycle: DRAFT → REVIEW → ACTIVE → RETIRED
 * New rules are created as DRAFT with prototype notice.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Pathway Templates ──────────────────────────────────────────────────────

  async getPathways() {
    return this.prisma.pathwayTemplate.findMany({ where: { isActive: true } });
  }

  async createPathway(data: any, adminId: string) {
    const pathway = await this.prisma.pathwayTemplate.create({
      data: {
        identifier: data.identifier,
        name: data.name,
        description: data.description,
        version: data.version ?? 1,
        isActive: data.isActive ?? true,
        supportedCategories: data.supportedCategories ?? [],
        schedulingRules: data.schedulingRules ?? {},
        metadata: data.metadata,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'ADMIN_PATHWAY_CREATED',
      resourceType: 'PathwayTemplate',
      resourceId: pathway.id,
    });

    return pathway;
  }

  // ─── Red-Flag Rules ─────────────────────────────────────────────────────────

  async getRedFlagRules(status?: RedFlagRuleStatus) {
    return this.prisma.redFlagRule.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRedFlagRule(data: any, adminId: string) {
    // Validate trigger config
    if (!data.triggerConfig?.field || !data.triggerConfig?.operator) {
      throw new BadRequestException('Invalid trigger config: field and operator are required');
    }

    const rule = await this.prisma.redFlagRule.create({
      data: {
        pathwayTemplateId: data.pathwayTemplateId,
        ruleCode: data.ruleCode,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        severity: data.severity,
        action: data.action,
        messageTemplate: data.messageTemplate,
        emergencyMessage: data.emergencyMessage,
        status: RedFlagRuleStatus.DRAFT, // Always starts as DRAFT
        reviewNote: 'Prototype — clinician review pending',
        sourceReference: data.sourceReference,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'ADMIN_RED_FLAG_RULE_CREATED',
      resourceType: 'RedFlagRule',
      resourceId: rule.id,
    });

    return rule;
  }

  async updateRedFlagRule(ruleId: string, data: any, adminId: string) {
    const rule = await this.prisma.redFlagRule.findUnique({
      where: { id: ruleId, deletedAt: null },
    });

    if (!rule) throw new NotFoundException('Red-flag rule not found');

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['REVIEW', 'RETIRED'],
      REVIEW: ['ACTIVE', 'DRAFT', 'RETIRED'],
      ACTIVE: ['RETIRED'],
      RETIRED: [],
    };

    if (data.status && !validTransitions[rule.status].includes(data.status)) {
      throw new BadRequestException(
        `Cannot transition rule from ${rule.status} to ${data.status}`,
      );
    }

    // Bump version on status change
    const updated = await this.prisma.redFlagRule.update({
      where: { id: ruleId },
      data: {
        ...data,
        version: data.status !== rule.status ? rule.version + 1 : rule.version,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'ADMIN_RED_FLAG_RULE_UPDATED',
      resourceType: 'RedFlagRule',
      resourceId: ruleId,
      metadata: {
        previousStatus: rule.status,
        newStatus: data.status,
        version: updated.version,
      },
    });

    return updated;
  }

  // ─── System Configuration ───────────────────────────────────────────────────

  async getConfig() {
    return this.prisma.adminConfiguration.findMany();
  }

  async setConfig(key: string, value: any, adminId: string) {
    const config = await this.prisma.adminConfiguration.upsert({
      where: { key },
      create: { key, value, updatedBy: adminId },
      update: { value, updatedBy: adminId },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'ADMIN_CONFIG_UPDATED',
      resourceType: 'AdminConfiguration',
      resourceId: config.id,
      metadata: { key },
    });

    return config;
  }
}
