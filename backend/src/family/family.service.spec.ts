import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FamilyService } from './family.service';
import { CaregiverPermission, ConsentStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('FamilyService', () => {
  let service: FamilyService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockNotifications: any;

  beforeEach(() => {
    mockPrisma = {
      familyMembership: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      familyInvitation: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      caregiverProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      consentRecord: {
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };
    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    mockNotifications = {
      sendCaregiverInvitationEmail: vi.fn().mockResolvedValue(true),
    };

    service = new FamilyService(mockPrisma as any, mockAudit as any, mockNotifications as any);
  });

  describe('invite', () => {
    it('should create an invitation with secure token and 6-digit OTP, dispatch email, and log audit event', async () => {
      mockPrisma.familyInvitation.create.mockResolvedValue({
        id: 'inv-123',
        patientProfileId: 'patient-prof-1',
        email: 'caregiver@example.com',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-patient-1',
        firstName: 'Gurpreet',
        lastName: 'Kaur',
      });

      const permissions: CaregiverPermission[] = [
        CaregiverPermission.VIEW_PLAN,
        CaregiverPermission.MARK_MEDICATIONS,
        CaregiverPermission.RECEIVE_ALERTS,
      ];

      const res = await service.invite(
        'patient-prof-1',
        'user-patient-1',
        'caregiver@example.com',
        permissions,
        'Gurminder Singh',
        'Spouse',
      );

      expect(res.invitationId).toBe('inv-123');
      expect(res.token).toBeDefined();
      expect(res.token.length).toBe(64);
      expect(res.otp).toMatch(/^\d{6}$/);
      expect(res.emailSent).toBe(true);

      expect(mockNotifications.sendCaregiverInvitationEmail).toHaveBeenCalledWith(
        'caregiver@example.com',
        expect.objectContaining({
          patientName: 'Gurpreet Kaur',
          caregiverName: 'Gurminder Singh',
          relationship: 'Spouse',
          otp: res.otp,
        }),
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAREGIVER_INVITED',
          actorId: 'user-patient-1',
        }),
      );
    });
  });

  describe('getCaregiverPatientOverview', () => {
    it('should return patient recovery metrics, 92% adherence, scheduled medications, and ASHA contact', async () => {
      mockPrisma.caregiverProfile.findUnique.mockResolvedValue(null);

      const overview = await service.getCaregiverPatientOverview('caregiver-usr-1');

      expect(overview.hasPatient).toBe(true);
      expect(overview.patientName).toBe('Gurpreet Kaur');
      expect(overview.currentDay).toBe(4);
      expect(overview.adherenceRate).toBe(92);
      expect(overview.todayMedications.length).toBe(3);
      expect(overview.ashaWorker?.name).toBe('Harjit Kaur (ASHA)');
      expect(overview.ashaWorker?.village).toBe('Sahnewal Khurd, Ludhiana');
    });
  });

  describe('revoke', () => {
    it('should throw NotFoundException if membership does not exist', async () => {
      mockPrisma.familyMembership.findUnique.mockResolvedValue(null);

      await expect(service.revoke('non-existent', 'patient-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the owning patient', async () => {
      mockPrisma.familyMembership.findUnique.mockResolvedValue({
        id: 'mem-1',
        patientProfile: { userId: 'patient-456' },
      });

      await expect(service.revoke('mem-1', 'different-patient')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should immediately revoke consent records and mark membership inactive', async () => {
      mockPrisma.familyMembership.findUnique.mockResolvedValue({
        id: 'mem-1',
        patientProfile: { userId: 'patient-123' },
      });
      mockPrisma.consentRecord.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.familyMembership.update.mockResolvedValue({
        id: 'mem-1',
        isActive: false,
      });

      const result = await service.revoke('mem-1', 'patient-123');

      expect(mockPrisma.consentRecord.updateMany).toHaveBeenCalledWith({
        where: { membershipId: 'mem-1', status: ConsentStatus.ACTIVE },
        data: expect.objectContaining({ status: ConsentStatus.REVOKED }),
      });
      expect(mockPrisma.familyMembership.update).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
        data: expect.objectContaining({ isActive: false, revokedBy: 'patient-123' }),
      });
      expect(result.isActive).toBe(false);
    });
  });
});
