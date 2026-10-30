import { apiClient } from './client';

export interface SymptomDefinition {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface LogSymptomPayload {
  planId: string;
  painScore?: number;
  temperature?: number;
  symptomDefinitionId?: string;
  customSymptom?: string;
  notes?: string;
  recordedAt?: string;
}

export interface BackendSymptomLog {
  id: string;
  planId: string;
  painScore?: number | null;
  temperature?: number | null;
  customSymptom?: string | null;
  notes?: string | null;
  recordedAt: string;
  symptomDefinition?: SymptomDefinition | null;
  symptomLog?: BackendSymptomLog;
}

export const symptomsApi = {
  log: async (payload: LogSymptomPayload): Promise<BackendSymptomLog> => {
    return apiClient.post<BackendSymptomLog>('/symptoms', payload);
  },

  getByPlan: async (planId: string): Promise<BackendSymptomLog[]> => {
    return apiClient.get<BackendSymptomLog[]>(`/plans/${planId}/symptoms`);
  },

  getDefinitions: async (): Promise<SymptomDefinition[]> => {
    return apiClient.get<SymptomDefinition[]>('/symptoms/definitions');
  },
};
