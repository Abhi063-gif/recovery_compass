import { apiClient } from './client';

export interface UserSession {
  userId: string;
  email: string;
  role: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM';
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: UserSession;
}

export const authApi = {
  register: async (data: {
    email?: string;
    password?: string;
    pin?: string;
    role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM';
    firstName: string;
    lastName: string;
    phone?: string;
    relationship?: string;
  }): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/register', data, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  login: async (data: {
    email?: string;
    phone?: string;
    password?: string;
    pin?: string;
  }): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    try {
      const token = refreshToken || localStorage.getItem('recovery_compass_refresh_token') || '';
      return await apiClient.post<{ message: string }>('/auth/logout', { refreshToken: token });
    } finally {
      apiClient.clearTokens();
    }
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  getMe: async (): Promise<UserSession> => {
    return apiClient.get<UserSession>('/auth/me');
  },
};
