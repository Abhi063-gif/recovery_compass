import { apiClient } from './client';

export interface BackendDoctorQuestion {
  id: string;
  planId: string;
  questionText: string;
  context?: string | null;
  sourceType: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedNote?: string | null;
  createdAt: string;
}

export const doctorQuestionsApi = {
  getByPlan: async (planId: string): Promise<BackendDoctorQuestion[]> => {
    return apiClient.get<BackendDoctorQuestion[]>(`/plans/${planId}/doctor-questions`);
  },

  generate: async (planId: string): Promise<{ generated: number; questions: BackendDoctorQuestion[] }> => {
    return apiClient.post<{ generated: number; questions: BackendDoctorQuestion[] }>(
      `/plans/${planId}/doctor-questions/generate`,
    );
  },

  resolve: async (id: string, note?: string): Promise<BackendDoctorQuestion> => {
    return apiClient.post<BackendDoctorQuestion>(`/doctor-questions/${id}/resolve`, { note });
  },
};
