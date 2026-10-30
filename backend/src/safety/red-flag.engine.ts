import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  RedFlagSeverity,
  RedFlagAction,
  RedFlagRuleStatus,
  NotificationType,
  NotificationChannel,
} from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';

export interface SymptomInput {
  painScore?: number;
  temperature?: number; // Celsius
  symptomCodes?: string[];
  customSymptom?: string;
  notes?: string;
}

export interface RedFlagMatch {
  ruleId: string;
  ruleCode: string;
  severity: RedFlagSeverity;
  action: RedFlagAction;
  message: string;
  emergencyMessage?: string;
}

export interface SafetyCheckResult {
  hasRedFlags: boolean;
  matches: RedFlagMatch[];
  checkedAt: string;
}

/**
 * DETERMINISTIC RED-FLAG ENGINE
 *
 * CRITICAL SAFETY CONTRACT:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. This engine is PURELY DETERMINISTIC — no LLM, no AI, no inference
 * 2. Rules come from the database (configured by admins, clinician-reviewed)
 * 3. Thresholds are configured from the approved rule set — NOT hardcoded
 * 4. The engine NEVER provides treatment advice
 * 5. Possible actions: MONITOR, CONTACT_CLINICIAN, SEEK_EMERGENCY_HELP
 * 6. Target: 100% recall on clinician-labelled test set
 * 7. Every rule is versioned and auditable
 *
 * Pipeline:
 *   Symptom log → Load active rules → Evaluate triggers → Create RedFlagEvent → Notify
 *
 * The engine does NOT use LLM to decide emergency status.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class RedFlagEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(RedFlagEngine.name);
  }

  /**
   * Evaluate a symptom log against all active rules for the plan's pathway.
   * Creates RedFlagEvents for any matches and triggers notifications.
   */
  async evaluate(
    planId: string,
    symptomLogId: string,
    input: SymptomInput,
    userId: string,
  ): Promise<SafetyCheckResult> {
    const plan = await this.prisma.recoveryPlan.findUnique({
      where: { id: planId },
      include: {
        template: { include: { redFlagRules: { where: { status: RedFlagRuleStatus.ACTIVE, deletedAt: null } } } },
        patientProfile: { include: { user: { include: { notificationPrefs: true } } } },
      },
    });

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const rules = plan.template.redFlagRules;
    const matches: RedFlagMatch[] = [];

    for (const rule of rules) {
      const triggered = this.evaluateRule(rule, input);

      if (triggered) {
        this.logger.warn(
          `RED FLAG TRIGGERED — rule: ${rule.ruleCode}, severity: ${rule.severity}, plan: ${planId}`,
        );

        // Create RedFlagEvent
        const event = await this.prisma.redFlagEvent.create({
          data: {
            planId,
            ruleId: rule.id,
            matchedData: {
              symptomLogId,
              input,
              ruleCode: rule.ruleCode,
              ruleVersion: rule.version,
            } as any,
            severity: rule.severity,
            action: rule.action,
          },
        });

        matches.push({
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          severity: rule.severity,
          action: rule.action,
          message: rule.messageTemplate,
          emergencyMessage: rule.emergencyMessage ?? undefined,
        });

        // ─── Notify patient ──────────────────────────────────────────────────
        await this.notificationsService.sendSafetyAlert(
          plan.patientProfile.user,
          rule.messageTemplate,
          rule.severity,
          rule.action,
          event.id,
        );

        // ─── Notify caregivers with RECEIVE_ALERTS permission ────────────────
        const caregivers = await this.prisma.familyMembership.findMany({
          where: {
            patientProfileId: plan.patientProfileId,
            isActive: true,
            permissions: { has: 'RECEIVE_ALERTS' },
          },
          include: { caregiverProfile: { include: { user: true } } },
        });

        for (const membership of caregivers) {
          await this.notificationsService.sendSafetyAlert(
            membership.caregiverProfile.user,
            `PATIENT ALERT: ${rule.messageTemplate}`,
            rule.severity,
            rule.action,
            event.id,
          );
        }

        // Audit
        await this.auditService.log({
          actorId: userId,
          action: 'RED_FLAG_TRIGGERED',
          resourceType: 'RedFlagEvent',
          resourceId: event.id,
          planId,
          metadata: {
            ruleCode: rule.ruleCode,
            severity: rule.severity,
            action: rule.action,
          },
        });
      }
    }

    return {
      hasRedFlags: matches.length > 0,
      matches,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluate a single rule against symptom input.
   *
   * PURELY DETERMINISTIC — no external calls.
   * Rule trigger config defines: field, operator, threshold.
   */
  evaluateRule(
    rule: { triggerType: string; triggerConfig: any },
    input: SymptomInput,
  ): boolean {
    const config = rule.triggerConfig as {
      field: string;
      operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains';
      value: number | string;
    };

    if (!config || !config.field || !config.operator) {
      this.logger.warn(`Invalid rule config for ${rule.triggerType}`);
      return false;
    }

    const fieldValue = this.getFieldValue(input, config.field);

    if (fieldValue === null || fieldValue === undefined) {
      return false; // Cannot evaluate if value not provided
    }

    switch (config.operator) {
      case 'gt':
        return Number(fieldValue) > Number(config.value);
      case 'gte':
        return Number(fieldValue) >= Number(config.value);
      case 'lt':
        return Number(fieldValue) < Number(config.value);
      case 'lte':
        return Number(fieldValue) <= Number(config.value);
      case 'eq':
        return fieldValue === config.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(config.value).toLowerCase());
      default:
        return false;
    }
  }

  private getFieldValue(input: SymptomInput, field: string): unknown {
    switch (field) {
      case 'painScore':
        return input.painScore;
      case 'temperature':
        return input.temperature;
      case 'symptomCodes':
        return input.symptomCodes;
      case 'notes':
        return input.notes;
      default:
        return undefined;
    }
  }

  async getRedFlagEvents(planId: string) {
    return this.prisma.redFlagEvent.findMany({
      where: { planId },
      include: { rule: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
