import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityService, CaseloadItem } from './community.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CommunityService - Frontline Health Worker Caseload', () => {
  let service: CommunityService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      patientProfile: {
        findMany: vi.fn(),
      },
    };

    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    service = new CommunityService(
      mockPrisma as PrismaService,
      mockAudit as AuditService,
    );
  });

  function validateCaseloadItemShape(item: CaseloadItem) {
    expect(item).toBeDefined();
    expect(typeof item.patientId).toBe('string');
    expect(typeof item.name).toBe('string');
    expect(typeof item.village).toBe('string');
    expect(typeof item.pathway).toBe('string');
    expect(typeof item.dischargeDate).toBe('string');
    expect(typeof item.currentDay).toBe('number');
    expect(['GREEN', 'AMBER', 'RED']).toContain(item.riskTier);
    expect(typeof item.riskScore).toBe('number');
    expect(Array.isArray(item.riskFactors)).toBe(true);
    expect(typeof item.nextScheduledVisit).toBe('string');
    expect(typeof item.medicationAdherenceRate).toBe('number');
    expect(typeof item.missedDosesCount).toBe('number');
    expect(typeof item.recentRedFlagsCount).toBe('number');
  }

  it('Scenario 1: falls back to demo personas if database has zero registered patients', async () => {
    mockPrisma.patientProfile.findMany.mockResolvedValue([]);

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload).toBeDefined();
    expect(caseload.length).toBe(4);
    expect(caseload.some((p) => p.name === 'Gurpreet Kaur')).toBe(true);
    expect(caseload.some((p) => p.name === 'Balwinder Singh')).toBe(true);
    expect(caseload.some((p) => p.name === 'Simranjit Kaur')).toBe(true);
    expect(caseload.some((p) => p.name === 'Kulwant Singh')).toBe(true);

    caseload.forEach(validateCaseloadItemShape);
  });

  it('Scenario 2: falls back to demo personas if database throws an unexpected error', async () => {
    mockPrisma.patientProfile.findMany.mockRejectedValue(new Error('Connection lost to DB'));

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload.length).toBe(4);
    caseload.forEach(validateCaseloadItemShape);
  });

  it('Scenario 3: dynamically computes RED risk tier when adherence < 70%', async () => {
    const mockPatient = {
      id: 'patient-low-adherence',
      userId: 'user-001',
      dateOfBirth: new Date(Date.now() - 365.25 * 24 * 3600 * 1000 * 50), // 50 years old
      gender: 'Female',
      emergencyContact: 'Village Sanghol',
      createdAt: new Date(Date.now() - 86400000 * 5),
      user: {
        firstName: 'Jaswinder',
        lastName: 'Kaur',
      },
      recoveryPlans: [
        {
          id: 'plan-001',
          dischargeDate: new Date(Date.now() - 86400000 * 4),
          status: 'ACTIVE',
          template: { name: 'Gallbladder Surgery' },
          medications: [
            {
              id: 'med-1',
              name: 'Amoxicillin',
              schedules: [
                { id: 's1', events: [{ status: 'TAKEN' }] },
                { id: 's2', events: [{ status: 'TAKEN' }] },
                { id: 's3', events: [{ status: 'TAKEN' }] },
                { id: 's4', events: [{ status: 'MISSED' }] },
                { id: 's5', events: [{ status: 'MISSED' }] },
              ],
            },
            {
              id: 'med-2',
              name: 'Paracetamol',
              schedules: [
                { id: 's6', events: [{ status: 'TAKEN' }] },
                { id: 's7', events: [{ status: 'MISSED' }] },
                { id: 's8', events: [{ status: 'MISSED' }] },
                { id: 's9', events: [{ status: 'MISSED' }] },
                { id: 's10', events: [{ status: 'MISSED' }] },
              ],
            },
          ],
          redFlagEvents: [],
        },
      ],
    };

    mockPrisma.patientProfile.findMany.mockResolvedValue([mockPatient]);

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload.length).toBe(1);
    const item = caseload[0];
    validateCaseloadItemShape(item);

    expect(item.patientId).toBe('patient-low-adherence');
    expect(item.name).toBe('Jaswinder Kaur');
    expect(item.age).toBe(50);
    expect(item.gender).toBe('Female');
    expect(item.village).toBe('Village Sanghol');
    expect(item.pathway).toBe('Gallbladder Surgery');
    // 4 taken out of 10 scheduled doses = 40%
    expect(item.medicationAdherenceRate).toBe(40);
    expect(item.missedDosesCount).toBe(6);
    expect(item.riskTier).toBe('RED');
    expect(item.riskScore).toBeGreaterThanOrEqual(75);
    expect(item.riskFactors).toContain('Adherence Below 70% (40%)');
  });

  it('Scenario 4: dynamically computes AMBER risk tier when adherence is 70-84%', async () => {
    const mockPatient = {
      id: 'patient-medium-adherence',
      userId: 'user-002',
      dateOfBirth: new Date(Date.now() - 365.25 * 24 * 3600 * 1000 * 42),
      gender: 'Male',
      emergencyContact: 'Village Morinda',
      createdAt: new Date(Date.now() - 86400000 * 3),
      user: {
        firstName: 'Harpreet',
        lastName: 'Singh',
      },
      recoveryPlans: [
        {
          id: 'plan-002',
          dischargeDate: new Date(Date.now() - 86400000 * 3),
          status: 'ACTIVE',
          template: { name: 'Orthopedic Knee Surgery' },
          medications: [
            {
              id: 'med-1',
              name: 'Diclofenac',
              schedules: [
                { id: 's1', events: [{ status: 'TAKEN' }] },
                { id: 's2', events: [{ status: 'TAKEN' }] },
                { id: 's3', events: [{ status: 'TAKEN' }] },
                { id: 's4', events: [{ status: 'TAKEN' }] },
                { id: 's5', events: [{ status: 'MISSED' }] },
              ],
            },
          ],
          redFlagEvents: [],
        },
      ],
    };

    mockPrisma.patientProfile.findMany.mockResolvedValue([mockPatient]);

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload.length).toBe(1);
    const item = caseload[0];
    validateCaseloadItemShape(item);

    // 4 taken out of 5 scheduled doses = 80%
    expect(item.medicationAdherenceRate).toBe(80);
    expect(item.riskTier).toBe('AMBER');
    expect(item.riskScore).toBeGreaterThanOrEqual(40);
    expect(item.riskScore).toBeLessThan(75);
  });

  it('Scenario 5: dynamically elevates to RED if recent emergency red flag exists regardless of adherence', async () => {
    const mockPatient = {
      id: 'patient-emergency-flag',
      userId: 'user-003',
      emergencyContact: 'Village Bassi',
      createdAt: new Date(Date.now() - 86400000 * 2),
      user: {
        firstName: 'Amrit',
        lastName: 'Kaur',
      },
      recoveryPlans: [
        {
          id: 'plan-003',
          dischargeDate: new Date(Date.now() - 86400000 * 2),
          status: 'ACTIVE',
          template: { name: 'Appendectomy Recovery' },
          medications: [
            {
              id: 'med-1',
              name: 'Cefixime',
              schedules: [
                { id: 's1', events: [{ status: 'TAKEN' }] },
                { id: 's2', events: [{ status: 'TAKEN' }] },
              ],
            },
          ],
          redFlagEvents: [
            {
              id: 'rf-1',
              severity: 'EMERGENCY',
              resolvedAt: null,
              createdAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
            },
          ],
        },
      ],
    };

    mockPrisma.patientProfile.findMany.mockResolvedValue([mockPatient]);

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload.length).toBe(1);
    const item = caseload[0];
    validateCaseloadItemShape(item);

    // 100% adherence but has EMERGENCY red flag
    expect(item.medicationAdherenceRate).toBe(100);
    expect(item.riskTier).toBe('RED');
    expect(item.recentRedFlagsCount).toBe(1);
    expect(item.riskFactors).toContain('Emergency/Urgent Red Flag Triggered');
  });

  it('Scenario 6: dynamically computes GREEN risk tier when adherence >= 85% and no warnings', async () => {
    const mockPatient = {
      id: 'patient-healthy-green',
      userId: 'user-004',
      emergencyContact: 'Village Ropar',
      createdAt: new Date(Date.now() - 86400000 * 6),
      user: {
        firstName: 'Daljit',
        lastName: 'Kaur',
      },
      recoveryPlans: [
        {
          id: 'plan-004',
          dischargeDate: new Date(Date.now() - 86400000 * 6),
          status: 'ACTIVE',
          template: { name: 'Cholecystectomy Pathway' },
          medications: [
            {
              id: 'med-1',
              name: 'Paracetamol',
              schedules: [
                { id: 's1', events: [{ status: 'TAKEN' }] },
                { id: 's2', events: [{ status: 'TAKEN' }] },
                { id: 's3', events: [{ status: 'TAKEN' }] },
                { id: 's4', events: [{ status: 'TAKEN' }] },
                { id: 's5', events: [{ status: 'TAKEN' }] },
              ],
            },
          ],
          redFlagEvents: [],
        },
      ],
    };

    mockPrisma.patientProfile.findMany.mockResolvedValue([mockPatient]);

    const caseload = await service.getCaseload('asha-worker-001');

    expect(caseload.length).toBe(1);
    const item = caseload[0];
    validateCaseloadItemShape(item);

    expect(item.medicationAdherenceRate).toBe(100);
    expect(item.missedDosesCount).toBe(0);
    expect(item.recentRedFlagsCount).toBe(0);
    expect(item.riskTier).toBe('GREEN');
    expect(item.riskScore).toBeLessThanOrEqual(30);
  });

  it('Scenario 7: filters caseload by block / village catchment area', async () => {
    mockPrisma.patientProfile.findMany.mockResolvedValue([]);

    const sahnewalCaseload = await service.getCaseload('asha-worker-001', { block: 'Sahnewal' });
    expect(sahnewalCaseload.length).toBe(1);
    expect(sahnewalCaseload[0].name).toBe('Gurpreet Kaur');
    expect(sahnewalCaseload[0].village).toContain('Sahnewal');

    const dehlonCaseload = await service.getCaseload('asha-worker-001', { village: 'Dehlon' });
    expect(dehlonCaseload.length).toBe(1);
    expect(dehlonCaseload[0].name).toBe('Balwinder Singh');
  });
});
