import { apiClient } from './client';

export interface BackendNotification {
  id: string;
  userId?: string;
  type:
    | 'MEDICATION_REMINDER'
    | 'TASK_REMINDER'
    | 'FOLLOW_UP_REMINDER'
    | 'CAREGIVER_ALERT'
    | 'SAFETY_ALERT'
    | 'SYSTEM';
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  channel?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  createdAt?: string;
  sentAt?: string;
  scheduledFor?: string;
}

export const notificationsApi = {
  getAll: async (): Promise<BackendNotification[]> => {
    return apiClient.get<BackendNotification[]>('/notifications');
  },

  markRead: async (id: string): Promise<BackendNotification> => {
    return apiClient.patch<BackendNotification>(`/notifications/${id}/read`);
  },
};
