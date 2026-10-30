import { apiClient } from './client';

export interface PathwayTemplate {
  id: string;
  identifier: string;
  name: string;
  description: string;
  version: number;
  isActive: boolean;
}

export interface RedFlagAdminRule {
  id: string;
  ruleCode: string;
  name: string;
  severity: string;
  action: string;
  status: string;
  reviewNote: string;
}

export const adminApi = {
  getPathways: async (): Promise<PathwayTemplate[]> => {
    return apiClient.get<PathwayTemplate[]>('/admin/pathways');
  },

  createPathway: async (data: Partial<PathwayTemplate>): Promise<PathwayTemplate> => {
    return apiClient.post<PathwayTemplate>('/admin/pathways', data);
  },

  getRedFlags: async (): Promise<RedFlagAdminRule[]> => {
    return apiClient.get<RedFlagAdminRule[]>('/admin/red-flags');
  },

  getRedFlagRules: async (): Promise<RedFlagAdminRule[]> => {
    return apiClient.get<RedFlagAdminRule[]>('/admin/red-flags');
  },

  createRedFlag: async (data: Partial<RedFlagAdminRule>): Promise<RedFlagAdminRule> => {
    return apiClient.post<RedFlagAdminRule>('/admin/red-flags', data);
  },

  updateRedFlag: async (id: string, data: Partial<RedFlagAdminRule>): Promise<RedFlagAdminRule> => {
    return apiClient.patch<RedFlagAdminRule>(`/admin/red-flags/${id}`, data);
  },

  getConfig: async (): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>('/admin/config');
  },
};
