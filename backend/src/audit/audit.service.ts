import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

export interface AuditLogParams {
  actorId?: string;
  actorRole?: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  planId?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Audit logging service.
 *
 * SECURITY CONTRACT:
 * - Never log full medical document content
 * - Never log passwords, tokens, or secrets
 * - Always log authentication events
 * - Always log resource mutations
 * - Audit records are never hard-deleted (legally required retention)
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      // Strip any accidentally included sensitive fields from metadata
      const safeMetadata = this.sanitizeMetadata(params.metadata);

      await this.prisma.auditEvent.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          planId: params.planId,
          documentId: params.documentId,
          metadata: safeMetadata as any,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent?.substring(0, 500),
          requestId: params.requestId,
        },
      });
    } catch (error) {
      // Audit failure must not crash the main request
      // But it must be logged for investigation
      console.error('[AuditService] Failed to write audit event', {
        action: params.action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getAuditTrail(
    resourceType: string,
    resourceId: string,
    options?: { limit?: number; offset?: number },
  ) {
    return this.prisma.auditEvent.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async getPlanAuditTrail(planId: string) {
    return this.prisma.auditEvent.findMany({
      where: { planId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private sanitizeMetadata(
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const BLOCKED_KEYS = ['password', 'passwordHash', 'token', 'secret', 'otp', 'pin', 'key'];
    const safe: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(metadata)) {
      if (!BLOCKED_KEYS.some((blocked) => k.toLowerCase().includes(blocked))) {
        safe[k] = v;
      }
    }

    return safe;
  }
}
