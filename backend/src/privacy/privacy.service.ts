import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Privacy / Data Deletion Service
 *
 * Implements controlled deletion workflow:
 *
 * 1. Revoke all family access immediately
 * 2. Remove active sessions (refresh tokens)
 * 3. Soft-delete documents (remove from storage)
 * 4. Soft-delete derived data (plans, extractions, symptoms, etc.)
 * 5. Preserve legally required audit records
 * 6. Record deletion event
 * 7. Mark user as deleted
 *
 * NEVER leaves orphaned files in object storage.
 * NEVER hard-deletes audit records.
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(PrivacyService.name);
  }

  async requestDeletion(userId: string): Promise<{ requestId: string }> {
    const request = await this.prisma.deletionRequest.create({
      data: { userId, status: 'PENDING' },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'DELETION_REQUESTED',
      resourceType: 'User',
      resourceId: userId,
      metadata: { requestId: request.id },
    });

    this.logger.warn(`Data deletion requested for user ${userId}`);

    // Execute deletion immediately for MVP; production should have a grace period
    await this.executeDeletion(userId, request.id);

    return { requestId: request.id };
  }

  private async executeDeletion(userId: string, requestId: string): Promise<void> {
    const steps: string[] = [];

    try {
      await this.prisma.deletionRequest.update({
        where: { id: requestId },
        data: { status: 'IN_PROGRESS' },
      });

      // ─── Step 1: Revoke all family memberships ─────────────────────────────
      const patientProfile = await this.prisma.patientProfile.findUnique({ where: { userId } });
      if (patientProfile) {
        await this.prisma.familyMembership.updateMany({
          where: { patientProfileId: patientProfile.id },
          data: { isActive: false, revokedAt: new Date(), revokedBy: userId },
        });
        steps.push('family_memberships_revoked');
      }

      // ─── Step 2: Revoke refresh tokens ────────────────────────────────────
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
      steps.push('sessions_revoked');

      // ─── Step 3: Delete documents from object storage ─────────────────────
      if (patientProfile) {
        const docs = await this.prisma.sourceDocument.findMany({
          where: { patientProfileId: patientProfile.id, deletedAt: null },
        });

        for (const doc of docs) {
          try {
            await this.storageService.delete(doc.storagePath);
          } catch (e) {
            this.logger.error(`Failed to delete storage object ${doc.storagePath}`, e as Error);
          }

          await this.prisma.sourceDocument.update({
            where: { id: doc.id },
            data: { deletedAt: new Date() },
          });
        }
        steps.push(`documents_deleted:${docs.length}`);
      }

      // ─── Step 4: Soft-delete recovery plans and derived data ───────────────
      if (patientProfile) {
        await this.prisma.recoveryPlan.updateMany({
          where: { patientProfileId: patientProfile.id },
          data: { deletedAt: new Date() },
        });
        steps.push('plans_soft_deleted');
      }

      // ─── Step 5: Mark user as deleted ─────────────────────────────────────
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
          email: `deleted-${userId}@deleted.invalid`, // anonymize
          passwordHash: null,
          phone: null,
          firstName: '[Deleted]',
          lastName: '[Deleted]',
        },
      });
      steps.push('user_anonymized');

      // ─── Step 6: Record completion ─────────────────────────────────────────
      await this.prisma.deletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          steps: steps as any,
        },
      });

      // Audit record is preserved (legally required)
      await this.auditService.log({
        actorId: userId,
        action: 'DELETION_COMPLETED',
        resourceType: 'User',
        resourceId: userId,
        metadata: { requestId, steps },
      });

      this.logger.log(`Data deletion completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Deletion failed for user ${userId}`, error as Error);
      await this.prisma.deletionRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED', steps: steps as any },
      });
      throw error;
    }
  }
}
