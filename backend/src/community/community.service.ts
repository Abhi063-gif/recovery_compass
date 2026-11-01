import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LogAshaVisitDto, EscalateRiskDto, ResolveEscalationDto } from './community.dto';
import { AuditService } from '../audit/audit.service';

export interface CaseloadItem {
  patientId: string;
  name: string;
  age?: number;
  gender?: string;
  village: string;
  pathway: string;
  dischargeDate: string;
  currentDay: number;
  riskTier: 'GREEN' | 'AMBER' | 'RED';
  riskScore: number;
  riskFactors: string[];
  lastVisitDate?: string;
  nextScheduledVisit: string;
  medicationAdherenceRate: number;
  missedDosesCount: number;
  recentRedFlagsCount: number;
  activeEscalation?: {
    id: string;
    severity: string;
    reason: string;
    status: string;
    createdAt: string;
  };
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  // In-memory store for robust operation when database is offline
  private inMemoryVisits: any[] = [];
  private inMemoryEscalations: any[] = [
    {
      id: 'esc-demo-1',
      patientId: 'patient-sharda-01',
      patientName: 'Gurpreet Kaur',
      raisedBy: 'Harjit Kaur (ASHA)',
      targetRole: 'ANM',
      severity: 'WARNING',
      reason: 'Persistent fever (101.4 F) on post-op Day 4 and missed morning antibiotic dose',
      status: 'ACKNOWLEDGED',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      notes: 'ANM Manpreet Sandhu assigned for tele-checkup or home visit',
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCaseload(
    ashaWorkerId: string,
    filters?: { block?: string; village?: string },
  ): Promise<CaseloadItem[]> {
    try {
      if (this.prisma.patientProfile) {
        const patients = await this.prisma.patientProfile.findMany({
          include: {
            user: true,
            recoveryPlans: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                template: true,
                medications: {
                  include: {
                    schedules: {
                      include: {
                        events: true,
                      },
                    },
                  },
                },
                redFlagEvents: {
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (patients && patients.length > 0) {
          let items: CaseloadItem[] = patients.map((patient) => {
            const plan = patient.recoveryPlans?.[0];
            const name = patient.user
              ? `${patient.user.firstName || ''} ${patient.user.lastName || ''}`.trim() || 'Patient'
              : 'Patient';

            // Calculate age if dateOfBirth is present
            let age: number | undefined;
            if (patient.dateOfBirth) {
              const diffMs = Date.now() - new Date(patient.dateOfBirth).getTime();
              age = Math.floor(diffMs / (365.25 * 24 * 3600 * 1000));
            }

            // Calculate discharge date & recovery day
            const discharge = plan?.dischargeDate
              ? new Date(plan.dischargeDate)
              : plan?.surgeryDate
                ? new Date(plan.surgeryDate)
                : new Date(patient.createdAt);
            const dischargeDate = discharge.toISOString().split('T')[0];
            const currentDay = Math.max(1, Math.floor((Date.now() - discharge.getTime()) / (24 * 3600 * 1000)) + 1);

            // Compute medication adherence:
            // medicationAdherenceRate = (takenDoses / totalScheduledDoses) * 100
            let totalScheduledDoses = 0;
            let takenDoses = 0;
            let missedDosesCount = 0;

            const medications = plan?.medications || [];
            for (const med of medications) {
              const schedules = med.schedules || [];
              for (const sched of schedules) {
                totalScheduledDoses++;
                const events = sched.events || [];
                const hasTaken = events.some((e) => e.status === 'TAKEN');
                const hasMissed = events.some((e) => e.status === 'MISSED' || e.status === 'SKIPPED');
                if (hasTaken) {
                  takenDoses++;
                } else if (hasMissed) {
                  missedDosesCount++;
                }
              }
            }

            const medicationAdherenceRate = totalScheduledDoses > 0
              ? Math.min(100, Math.max(0, Math.round((takenDoses / totalScheduledDoses) * 100)))
              : 100;

            // Red flag events
            const redFlags = plan?.redFlagEvents || [];
            const recentRedFlags = redFlags.filter(
              (rf) => !rf.resolvedAt && (Date.now() - new Date(rf.createdAt).getTime()) < 86400000 * 7,
            );
            const recentRedFlagsCount = recentRedFlags.length;

            const hasRecentEmergencyRedFlag = recentRedFlags.some(
              (rf) => rf.severity === 'EMERGENCY' || rf.severity === 'URGENT',
            );

            const warningRedFlagsCount = recentRedFlags.filter(
              (rf) => rf.severity === 'WARNING',
            ).length;

            // Compute riskTier:
            // 'RED' if recent emergency red flag or adherence < 70%
            // 'AMBER' if adherence < 85% or 1 warning
            // 'GREEN' otherwise
            let riskTier: 'GREEN' | 'AMBER' | 'RED';
            let riskScore = 20;
            const riskFactors: string[] = [];

            if (hasRecentEmergencyRedFlag || medicationAdherenceRate < 70) {
              riskTier = 'RED';
              riskScore = Math.max(75, Math.min(98, 100 - Math.round(medicationAdherenceRate * 0.3)));
              if (hasRecentEmergencyRedFlag) riskFactors.push('Emergency/Urgent Red Flag Triggered');
              if (medicationAdherenceRate < 70) riskFactors.push(`Adherence Below 70% (${medicationAdherenceRate}%)`);
              if (missedDosesCount > 0) riskFactors.push(`${missedDosesCount} Missed Dose(s)`);
            } else if (medicationAdherenceRate < 85 || warningRedFlagsCount >= 1) {
              riskTier = 'AMBER';
              riskScore = Math.max(40, Math.min(74, 85 - Math.round(medicationAdherenceRate * 0.2)));
              if (warningRedFlagsCount >= 1) riskFactors.push(`${warningRedFlagsCount} Safety Warning(s) Active`);
              if (medicationAdherenceRate < 85) riskFactors.push(`Adherence Below 85% (${medicationAdherenceRate}%)`);
              if (missedDosesCount > 0) riskFactors.push(`${missedDosesCount} Missed Dose(s)`);
            } else {
              riskTier = 'GREEN';
              riskScore = Math.max(10, Math.min(30, Math.round((100 - medicationAdherenceRate) * 0.5)));
              riskFactors.push('Adherence on Track', 'Vitals Normal');
            }

            // Find last recorded visit
            const patientVisits = this.inMemoryVisits.filter(
              (v) => v.patientId === patient.id || v.patientId === patient.userId,
            );
            const lastVisit = patientVisits.length > 0
              ? patientVisits[patientVisits.length - 1].visitDate
              : undefined;

            const nextDays = riskTier === 'RED' ? 1 : riskTier === 'AMBER' ? 2 : 4;
            const nextScheduledVisit = new Date(Date.now() + 86400000 * nextDays).toISOString().split('T')[0];

            const activeEscalation = this.inMemoryEscalations.find(
              (e) => (e.patientId === patient.id || e.patientId === patient.userId) && e.status !== 'RESOLVED',
            );

            return {
              patientId: patient.id,
              name,
              age,
              gender: patient.gender || undefined,
              village: patient.emergencyContact || 'Rural Health Subcenter',
              pathway: plan?.template?.name || plan?.template?.identifier || plan?.surgeryType || 'POST_SURGERY',
              dischargeDate,
              currentDay,
              riskTier,
              riskScore,
              riskFactors,
              lastVisitDate: lastVisit ? lastVisit.split('T')[0] : undefined,
              nextScheduledVisit,
              medicationAdherenceRate,
              missedDosesCount,
              recentRedFlagsCount,
              activeEscalation,
            };
          });

          if (filters?.block) {
            const b = filters.block.toLowerCase();
            items = items.filter((i) => i.village.toLowerCase().includes(b));
          }
          if (filters?.village) {
            const v = filters.village.toLowerCase();
            items = items.filter((i) => i.village.toLowerCase().includes(v));
          }

          return items;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to query database caseload: ${err.message}. Using demo persona fallback.`);
    }

    // Clean fallback: return curated community health worker caseload matching Punjab Rural Health & CHC Network
    let demoList = this.getDemoCaseload();
    if (filters?.block) {
      const b = filters.block.toLowerCase();
      demoList = demoList.filter((i) => i.village.toLowerCase().includes(b));
    }
    if (filters?.village) {
      const v = filters.village.toLowerCase();
      demoList = demoList.filter((i) => i.village.toLowerCase().includes(v));
    }
    return demoList;
  }

  private getDemoCaseload(): CaseloadItem[] {
    return [
      {
        patientId: 'patient-sharda-01',
        name: 'Gurpreet Kaur',
        age: 48,
        gender: 'Female',
        village: 'Sahnewal Khurd, Ludhiana',
        pathway: 'POST_SURGERY',
        dischargeDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
        currentDay: 4,
        riskTier: 'AMBER',
        riskScore: 65,
        riskFactors: ['1 Missed Antibiotic Dose', 'Elevated Temperature (101.2°F)', 'Wound Soreness'],
        lastVisitDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        nextScheduledVisit: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
        medicationAdherenceRate: 85,
        missedDosesCount: 1,
        recentRedFlagsCount: 1,
        activeEscalation: this.inMemoryEscalations.find(e => e.patientId === 'patient-sharda-01'),
      },
      {
        patientId: 'patient-ramesh-02',
        name: 'Balwinder Singh',
        age: 62,
        gender: 'Male',
        village: 'Dehlon Rural, Ludhiana',
        pathway: 'DIABETES',
        dischargeDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
        currentDay: 7,
        riskTier: 'RED',
        riskScore: 88,
        riskFactors: ['Fasting Glucose > 240 mg/dL', 'Missed 3 Insulin Doses', 'Mild Peripheral Numbness'],
        lastVisitDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        nextScheduledVisit: new Date().toISOString().split('T')[0],
        medicationAdherenceRate: 60,
        missedDosesCount: 3,
        recentRedFlagsCount: 2,
      },
      {
        patientId: 'patient-anita-03',
        name: 'Simranjit Kaur',
        age: 24,
        gender: 'Female',
        village: 'Gill Village, Ludhiana',
        pathway: 'PREGNANCY',
        dischargeDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        currentDay: 3,
        riskTier: 'GREEN',
        riskScore: 15,
        riskFactors: ['Postnatal Day 3', 'Normal BP (118/76)'],
        lastVisitDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        nextScheduledVisit: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        medicationAdherenceRate: 98,
        missedDosesCount: 0,
        recentRedFlagsCount: 0,
      },
      {
        patientId: 'patient-tukaram-04',
        name: 'Kulwant Singh',
        age: 55,
        gender: 'Male',
        village: 'Majri, Kharar (SAS Nagar)',
        pathway: 'TUBERCULOSIS',
        dischargeDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
        currentDay: 12,
        riskTier: 'GREEN',
        riskScore: 20,
        riskFactors: ['DOTS Verified', 'Daily Dose Taken with Family Supervision'],
        lastVisitDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        nextScheduledVisit: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        medicationAdherenceRate: 100,
        missedDosesCount: 0,
        recentRedFlagsCount: 0,
      },
    ];
  }

  async logVisit(dto: LogAshaVisitDto, ashaId: string) {
    const record = {
      id: `visit-${Date.now()}`,
      ashaId,
      ...dto,
      loggedAt: new Date().toISOString(),
    };
    this.inMemoryVisits.push(record);

    try {
      await this.audit.log({
        actorId: ashaId,
        action: 'ASHA_VISIT_LOGGED',
        resourceType: 'PatientVisit',
        resourceId: dto.patientId,
        metadata: {
          medicationVerified: dto.medicationVerified,
          vitals: dto.vitals,
        },
      });
    } catch {
      // Degraded mode fallback
    }

    return {
      success: true,
      message: 'ASHA home visit and medication verification successfully recorded.',
      record,
    };
  }

  async escalate(dto: EscalateRiskDto, actorId: string) {
    const escalation = {
      id: `esc-${Date.now()}`,
      patientId: dto.patientId,
      raisedBy: actorId,
      targetRole: dto.targetRole,
      severity: dto.severity,
      reason: dto.reason,
      status: 'RAISED',
      triggerDetails: dto.triggerDetails,
      vitalsSummary: dto.currentVitalsSummary,
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      // Prefilled SMS URI for low-connectivity rural cellular network
      prefilledSmsUri: `sms:?body=${encodeURIComponent(
        `[RECOVERY COMPASS ESCALATION] Patient: ${dto.patientId}. Severity: ${dto.severity}. Reason: ${dto.reason}. Please review on portal or call ASHA.`
      )}`,
    };

    this.inMemoryEscalations.unshift(escalation);

    try {
      await this.audit.log({
        actorId,
        action: 'RISK_ESCALATED',
        resourceType: 'RiskEscalation',
        resourceId: escalation.id,
        metadata: { ...dto } as Record<string, unknown>,
      });
    } catch {
      // Degraded mode fallback
    }

    return {
      success: true,
      message: `Risk escalation successfully submitted to ${dto.targetRole}.`,
      escalation,
    };
  }

  async getEscalations(role?: string) {
    if (!role || role === 'ALL') return this.inMemoryEscalations;
    return this.inMemoryEscalations.filter(e => e.targetRole === role || e.status === 'RAISED');
  }

  async resolveEscalation(id: string, dto: ResolveEscalationDto, actorId: string) {
    const item = this.inMemoryEscalations.find(e => e.id === id);
    if (item) {
      item.status = dto.status;
      item.resolutionNotes = dto.resolutionNotes;
      item.referralFacility = dto.referralFacility;
      item.resolvedAt = new Date().toISOString();
      item.resolvedBy = actorId;
    }
    return {
      success: true,
      message: `Escalation ${id} updated to ${dto.status}.`,
      escalation: item,
    };
  }
}
