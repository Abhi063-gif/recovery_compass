import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CaregiverPermission,
  InvitationStatus,
  ConsentStatus,
} from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import dayjs from 'dayjs';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Invite a caregiver to access a patient's plan.
   *
   * Generates a secure token + OTP.
   * Every permission grant creates a ConsentRecord.
   * Revocation takes effect immediately.
   */
  async invite(
    patientProfileId: string,
    userId: string,
    email: string,
    permissions: CaregiverPermission[],
  ) {
    const tokenRaw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(tokenRaw).digest('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryHours = parseInt(process.env.INVITATION_EXPIRY_HOURS ?? '48');

    const invitation = await this.prisma.familyInvitation.create({
      data: {
        patientProfileId,
        invitedByUserId: userId,
        email,
        tokenHash,
        otpCode: otp,
        permissions,
        expiresAt: dayjs().add(expiryHours, 'hour').toDate(),
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'CAREGIVER_INVITED',
      resourceType: 'FamilyInvitation',
      resourceId: invitation.id,
      metadata: { email, permissions },
    });

    // Return token for sending via email — OTP is separate channel
    return {
      invitationId: invitation.id,
      token: tokenRaw,
      otpForTesting: process.env.NODE_ENV === 'test' ? otp : undefined,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string, otp: string, caregiverId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invitation = await this.prisma.familyInvitation.findUnique({
      where: { tokenHash },
      include: { patientProfile: true },
    });

    if (!invitation) throw new NotFoundException('Invalid or expired invitation');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation has already been used or expired');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.familyInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }
    if (invitation.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Get or create caregiver profile
    const caregiverProfile = await this.prisma.caregiverProfile.findUnique({
      where: { userId: caregiverId },
    });
    if (!caregiverProfile) throw new NotFoundException('Caregiver profile not found');

    // Create membership
    const membership = await this.prisma.familyMembership.upsert({
      where: {
        patientProfileId_caregiverProfileId: {
          patientProfileId: invitation.patientProfileId,
          caregiverProfileId: caregiverProfile.id,
        },
      },
      create: {
        patientProfileId: invitation.patientProfileId,
        caregiverProfileId: caregiverProfile.id,
        permissions: invitation.permissions,
        isActive: true,
      },
      update: {
        permissions: invitation.permissions,
        isActive: true,
        revokedAt: null,
        revokedBy: null,
      },
    });

    // Create consent records for each permission
    for (const permission of invitation.permissions) {
      await this.prisma.consentRecord.create({
        data: {
          patientProfileId: invitation.patientProfileId,
          membershipId: membership.id,
          permission,
          status: ConsentStatus.ACTIVE,
          actorId: invitation.patientProfileId,
        },
      });
    }

    // Mark invitation as accepted
    await this.prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
    });

    await this.auditService.log({
      actorId: caregiverId,
      action: 'CAREGIVER_INVITATION_ACCEPTED',
      resourceType: 'FamilyMembership',
      resourceId: membership.id,
      metadata: { permissions: invitation.permissions },
    });

    return membership;
  }

  async updatePermissions(
    membershipId: string,
    patientUserId: string,
    permissions: CaregiverPermission[],
  ) {
    const membership = await this.prisma.familyMembership.findUnique({
      where: { id: membershipId },
      include: { patientProfile: true },
    });

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.patientProfile.userId !== patientUserId) {
      throw new ForbiddenException('Only the patient can modify caregiver permissions');
    }

    // Revoke old consent records
    await this.prisma.consentRecord.updateMany({
      where: { membershipId, status: ConsentStatus.ACTIVE },
      data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
    });

    // Create new consent records
    for (const permission of permissions) {
      await this.prisma.consentRecord.create({
        data: {
          patientProfileId: membership.patientProfileId,
          membershipId,
          permission,
          status: ConsentStatus.ACTIVE,
          actorId: patientUserId,
        },
      });
    }

    const updated = await this.prisma.familyMembership.update({
      where: { id: membershipId },
      data: { permissions, updatedAt: new Date() },
    });

    await this.auditService.log({
      actorId: patientUserId,
      action: 'CAREGIVER_PERMISSIONS_UPDATED',
      resourceType: 'FamilyMembership',
      resourceId: membershipId,
      metadata: { permissions },
    });

    return updated;
  }

  /**
   * Revoke caregiver access — IMMEDIATE effect.
   * All active sessions for that caregiver lose plan access.
   */
  async revoke(membershipId: string, patientUserId: string) {
    const membership = await this.prisma.familyMembership.findUnique({
      where: { id: membershipId },
      include: { patientProfile: true },
    });

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.patientProfile.userId !== patientUserId) {
      throw new ForbiddenException('Only the patient can revoke caregiver access');
    }

    // Revoke all consent records immediately
    await this.prisma.consentRecord.updateMany({
      where: { membershipId, status: ConsentStatus.ACTIVE },
      data: { status: ConsentStatus.REVOKED, revokedAt: new Date(), actorId: patientUserId },
    });

    const revoked = await this.prisma.familyMembership.update({
      where: { id: membershipId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: patientUserId,
      },
    });

    await this.auditService.log({
      actorId: patientUserId,
      action: 'CAREGIVER_ACCESS_REVOKED',
      resourceType: 'FamilyMembership',
      resourceId: membershipId,
    });

    return revoked;
  }

  async getFamilyMembers(patientProfileId: string) {
    return this.prisma.familyMembership.findMany({
      where: { patientProfileId, isActive: true },
      include: {
        caregiverProfile: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }
}
