import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FamilyService } from './family.service';
import { CaregiverPermission, ConsentStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('FamilyService', () => {
  let service: FamilyService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      familyMembership: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      consentRecord: {
        updateMany: vi.fn(),
      },
    };
    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    service = new FamilyService(mockPrisma as any, mockAudit as any);
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
