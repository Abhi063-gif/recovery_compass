import { apiClient } from './client';
import { ENDPOINTS } from '@recovery-compass/contracts';

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  timezone: string;
}

export const preferencesApi = {
  async getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>(ENDPOINTS.USERS.PREFERENCES);
  },

  async updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    return apiClient.patch<NotificationPreferences>(ENDPOINTS.USERS.PREFERENCES, prefs);
  },

  async getProfile(): Promise<any> {
    return apiClient.get(ENDPOINTS.USERS.PROFILE);
  },

  async updateProfile(profile: any): Promise<any> {
    return apiClient.patch(ENDPOINTS.USERS.PROFILE, profile);
  },
};
