export class LogAshaVisitDto {
  patientId!: string;
  visitDate!: string;
  medicationVerified!: boolean;
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

export class EscalateRiskDto {
  patientId!: string;
  targetRole!: 'ANM' | 'PHC_MEDICAL_OFFICER';
  reason!: string;
  severity!: 'WARNING' | 'URGENT' | 'EMERGENCY';
  triggerDetails?: string;
  currentVitalsSummary?: string;
  notes?: string;
}

export class ResolveEscalationDto {
  status!: 'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED';
  resolutionNotes?: string;
  referralFacility?: string;
}
