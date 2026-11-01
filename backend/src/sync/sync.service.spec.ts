import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from './sync.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunityService } from '../community/community.service';

describe('SyncService - Offline ASHA Visit & Vitals Synchronization', () => {
  let service: SyncService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockCommunityService: any;

  beforeEach(() => {
    mockPrisma = {
      symptomLog: { create: vi.fn().mockResolvedValue({}) },
      medicationEvent: { create: vi.fn().mockResolvedValue({}) },
      taskEvent: { create: vi.fn().mockResolvedValue({}) },
      recoveryTask: { update: vi.fn().mockResolvedValue({}) },
      recoveryPlan: { findMany: vi.fn().mockResolvedValue([]) },
    };

    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    mockCommunityService = {
      logVisit: vi.fn().mockResolvedValue({ success: true }),
      escalate: vi.fn().mockResolvedValue({ success: true }),
    };

    service = new SyncService(
      mockPrisma as PrismaService,
      mockAudit as AuditService,
      mockCommunityService as CommunityService,
    );
  });

  it('stores visit vitals (BP, temperature, blister pack count, notes) in structured audit & community record for asha_visit mutation', async () => {
    const pushDto = {
      deviceId: 'asha-tablet-punjab-01',
      mutations: [
        {
          id: 'mut-visit-101',
          entity: 'asha_visit' as const,
          action: 'CREATE' as const,
          payload: {
            patientId: 'patient-gurpreet-01',
            visitDate: '2026-11-01T10:30:00.000Z',
            medicationVerified: true,
            blisterPillsRemaining: 14,
            notes: 'Patient feels energetic; surgical wound healing cleanly without discharge.',
            vitals: {
              bloodPressureSystolic: 124,
              bloodPressureDiastolic: 82,
              temperatureFahrenheit: 98.6,
              bloodGlucoseMgDl: 110,
              pulseBpm: 76,
            },
          },
          clientTimestamp: '2026-11-01T10:30:00.000Z',
        },
      ],
    };

    const result = await service.processPush(pushDto, 'asha-worker-harjit');

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);

    // Verify communityService.logVisit was called with structured vitals
    expect(mockCommunityService.logVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-gurpreet-01',
        medicationVerified: true,
        remainingPillCount: 14,
        notes: 'Patient feels energetic; surgical wound healing cleanly without discharge.',
        vitals: expect.objectContaining({
          bloodPressure: '124/82',
          bloodPressureSystolic: 124,
          bloodPressureDiastolic: 82,
          temperatureFahrenheit: 98.6,
          blisterPackCount: 14,
        }),
      }),
      'asha-worker-harjit',
    );

    // Verify structured audit record was created
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'asha-worker-harjit',
        action: 'ASHA_VISIT_LOGGED',
        resourceType: 'PatientVisit',
        resourceId: 'patient-gurpreet-01',
        metadata: expect.objectContaining({
          mutationId: 'mut-visit-101',
          patientId: 'patient-gurpreet-01',
          blisterPackCount: 14,
          temperature: 98.6,
          bloodPressure: '124/82',
        }),
      }),
    );
  });
});

