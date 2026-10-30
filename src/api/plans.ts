import { apiClient } from './client';

export interface CreatePlanPayload {
  extractionId?: string;
  pathwayIdentifier: 'POST_SURGERY' | 'CARDIAC_REHAB' | 'ORTHOPEDIC_RECOVERY';
  surgeryDate?: string;
  dischargeDate?: string;
  surgeryType?: string;
  clinicianName?: string;
  hospitalName?: string;
}

export interface BackendPlan {
  id: string;
  patientProfileId: string;
  extractionId?: string | null;
  pathwayTemplateId: string;
  planVersion: number;
  status: 'DRAFT' | 'AWAITING_CONFIRMATION' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  surgeryDate?: string | null;
  dischargeDate?: string | null;
  surgeryType?: string | null;
  clinicianName?: string | null;
  hospitalName?: string | null;
  confirmedAt?: string | null;
  tasks?: any[];
  medications?: any[];
  followUps?: any[];
  symptomLogs?: any[];
}

export interface PlanProgress {
  taskCompletion: number;
  medAdherence: number;
  followUpCompletion: number;
  painTrend: Array<{ date: string; score: number }>;
}

export const plansApi = {
  listUserPlans: async (): Promise<BackendPlan[]> => {
    return apiClient.get<BackendPlan[]>('/plans');
  },

  create: async (payload: CreatePlanPayload): Promise<BackendPlan> => {
    return apiClient.post<BackendPlan>('/plans', payload);
  },

  getById: async (id: string): Promise<BackendPlan> => {
    return apiClient.get<BackendPlan>(`/plans/${id}`);
  },

  confirm: async (id: string): Promise<BackendPlan> => {
    return apiClient.post<BackendPlan>(`/plans/${id}/confirm`);
  },

  getTimeline: async (id: string): Promise<BackendPlan> => {
    return apiClient.get<BackendPlan>(`/plans/${id}/timeline`);
  },

  getSnapshot: async (id: string): Promise<BackendPlan> => {
    return apiClient.get<BackendPlan>(`/plans/${id}/snapshot`);
  },

  getProgress: async (id: string): Promise<PlanProgress> => {
    return apiClient.get<PlanProgress>(`/plans/${id}/progress`);
  },

  updateTaskStatus: async (taskId: string, status: 'SCHEDULED' | 'COMPLETED' | 'SKIPPED', notes?: string): Promise<any> => {
    return apiClient.patch<any>(`/plans/tasks/${taskId}`, { status, notes });
  },
};
