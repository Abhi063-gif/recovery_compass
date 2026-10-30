import { apiClient } from './client';

export interface BackendMedicationSchedule {
  id: string;
  medicationId: string;
  scheduledAt: string;
  timeLabel?: string | null;
  events?: Array<{
    id: string;
    status: 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED';
    actedAt: string;
    notes?: string | null;
  }>;
}

export interface BackendMedication {
  id: string;
  planId: string;
  name: string;
  normalizedName?: string | null;
  dose: string;
  doseUnit: string;
  frequency: string;
  timing?: string | null;
  durationDays?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isAsNeeded: boolean;
  instructions?: string | null;
  sourceText?: string | null;
  validationStatus: 'VALID' | 'NEEDS_REVIEW' | 'CONFLICT' | 'CONFIRMED';
  schedules?: BackendMedicationSchedule[];
}

export interface LogMedicationEventPayload {
  status: 'TAKEN' | 'SKIPPED' | 'MISSED';
  notes?: string;
  idempotencyKey?: string;
}

export const medicationsApi = {
  getByPlan: async (planId: string): Promise<BackendMedication[]> => {
    return apiClient.get<BackendMedication[]>(`/plans/${planId}/medications`);
  },

  getToday: async (planId: string): Promise<BackendMedication[]> => {
    return apiClient.get<BackendMedication[]>(`/plans/${planId}/medications/today`);
  },

  getMissed: async (planId: string): Promise<BackendMedicationSchedule[]> => {
    return apiClient.get<BackendMedicationSchedule[]>(`/plans/${planId}/medications/missed`);
  },

  logEvent: async (scheduleId: string, payload: LogMedicationEventPayload): Promise<any> => {
    const key = payload.idempotencyKey || `med-evt-${scheduleId}-${Date.now()}`;
    return apiClient.post<any>(`/medications/${scheduleId}/events`, payload, {
      headers: {
        'Idempotency-Key': key,
      },
    });
  },
};
