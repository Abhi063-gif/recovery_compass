import { apiClient } from './client';

export interface SafetyCheckPayload {
  painScore?: number;
  temperature?: number;
  symptomCodes?: string[];
  notes?: string;
  symptomLogId?: string;
}

export interface BackendSafetyEvaluation {
  hasRedFlag?: boolean;
  triggered?: boolean;
  severity?: 'INFORMATIONAL' | 'WARNING' | 'URGENT' | 'EMERGENCY';
  action?: 'MONITOR' | 'CONTACT_CLINICIAN' | 'SEEK_EMERGENCY_HELP';
  message?: string;
  emergencyMessage?: string;
  ruleCode?: string;
  sourceReference?: string;
  eventId?: string;
  event?: {
    id?: string;
    ruleName?: string;
    ruleCode?: string;
    severity?: string;
    action?: string;
    message?: string;
    emergencyMessage?: string;
  };
}

export const safetyApi = {
  check: async (planId: string, payload: SafetyCheckPayload): Promise<BackendSafetyEvaluation> => {
    return apiClient.post<BackendSafetyEvaluation>(`/plans/${planId}/safety/check`, payload);
  },

  getRedFlags: async (planId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/plans/${planId}/red-flags`);
  },
};
