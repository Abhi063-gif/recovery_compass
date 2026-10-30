import { apiClient } from './client';

export interface BackendFollowUp {
  id: string;
  planId: string;
  appointmentType: string;
  clinicianName?: string | null;
  clinicianRole?: string | null;
  purpose?: string | null;
  scheduledDate?: string | null;
  relativeDuration?: number | null;
  originalInstruction?: string | null;
  sourceText?: string | null;
  isConfirmed: boolean;
  notes?: string | null;
  pendingTests?: Array<{
    id: string;
    testName: string;
    purpose?: string | null;
    isCompleted: boolean;
  }>;
}

export const followupsApi = {
  getByPlan: async (planId: string): Promise<BackendFollowUp[]> => {
    return apiClient.get<BackendFollowUp[]>(`/plans/${planId}/follow-ups`);
  },

  create: async (data: {
    planId: string;
    appointmentType: string;
    scheduledDate: string;
    clinicianName?: string;
    purpose?: string;
    notes?: string;
  }): Promise<BackendFollowUp> => {
    return apiClient.post<BackendFollowUp>('/follow-ups', data);
  },

  getById: async (id: string): Promise<BackendFollowUp> => {
    return apiClient.get<BackendFollowUp>(`/follow-ups/${id}`);
  },

  getCalendarBlobUrl: async (id: string): Promise<string> => {
    const icsText = await apiClient.get<string>(`/follow-ups/${id}/calendar`);
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    return URL.createObjectURL(blob);
  },

  downloadCalendarIcs: async (id: string): Promise<void> => {
    const url = await followupsApi.getCalendarBlobUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment-${id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
