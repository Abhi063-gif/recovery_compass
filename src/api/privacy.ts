import { apiClient } from './client';

export const privacyApi = {
  requestDeletion: async (): Promise<{ requestId: string; status: string; message: string }> => {
    return apiClient.post<{ requestId: string; status: string; message: string }>('/privacy/delete-request');
  },
};
