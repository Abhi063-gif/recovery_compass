import { apiClient } from './client';

export interface CaseloadPatient {
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
  isAshaVerified?: boolean;
  activeEscalation?: {
    id: string;
    severity: string;
    reason: string;
    status: string;
    createdAt: string;
  };
}

export interface LogAshaVisitDto {
  patientId: string;
  visitDate: string;
  medicationVerified: boolean;
  medicationNotes?: string;
  remainingPillCount?: number;
  sideEffectsReported?: string[];
  vitals?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    bloodGlucoseMgDl?: number;
    temperatureFahrenheit?: number;
    pulseBpm?: number;
  };
  notes?: string;
  nextScheduledVisit?: string;
}

export interface EscalateRiskDto {
  patientId: string;
  targetRole: 'ANM' | 'PHC_MEDICAL_OFFICER';
  reason: string;
  severity: 'WARNING' | 'URGENT' | 'EMERGENCY';
  triggerDetails?: string;
  currentVitalsSummary?: string;
  notes?: string;
}

export interface ResolveEscalationDto {
  status: 'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED';
  resolutionNotes?: string;
  referralFacility?: string;
}

export interface Escalation {
  id: string;
  patientId: string;
  patientName: string;
  village?: string;
  raisedBy: string;
  ashaWorker?: string;
  targetRole: string;
  pathway?: string;
  severity: 'WARNING' | 'URGENT' | 'EMERGENCY';
  reason: string;
  status: 'RAISED' | 'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED';
  createdAt: string;
  notes?: string;
  resolutionNotes?: string;
  referralFacility?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export const communityApi = {
  getCaseload: () => apiClient.get<CaseloadPatient[]>('/community/caseload'),
  logVisit: (dto: LogAshaVisitDto) => apiClient.post('/community/visits', dto),
  escalate: (dto: EscalateRiskDto) => apiClient.post('/community/escalate', dto),
  getEscalations: (role?: string) =>
    apiClient.get<Escalation[]>('/community/escalations', { params: role ? { role } : undefined }),
  resolveEscalation: (id: string, dto: ResolveEscalationDto) =>
    apiClient.put(`/community/escalations/${id}/resolve`, dto),
};
