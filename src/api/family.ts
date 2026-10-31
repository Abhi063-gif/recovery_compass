import { apiClient } from './client';

export type BackendCaregiverPermission =
  | 'VIEW_PLAN'
  | 'RECEIVE_ALERTS'
  | 'LOG_SYMPTOMS'
  | 'MARK_MEDICATIONS';

export interface BackendFamilyMember {
  id: string;
  patientProfileId?: string;
  caregiverProfileId?: string;
  permissions: BackendCaregiverPermission[];
  isActive: boolean;
  caregiverName?: string;
  email?: string;
  relationship?: string;
  caregiver?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    relationship?: string;
  };
  createdAt: string;
}

export interface FamilyInvitationResponse {
  id?: string;
  invitationId?: string;
  email?: string;
  permissions: BackendCaregiverPermission[];
  status: string;
  expiresAt: string;
  otpCode?: string;
  token?: string;
  otp?: string;
  emailSent?: boolean;
}

export interface CaregiverPatientOverview {
  hasPatient: boolean;
  patientName: string;
  relationship: string;
  pathway: string;
  surgeryDate?: string;
  currentDay: number;
  adherenceRate: number;
  activeRedFlags: number;
  permissions: string[];
  todayMedications: Array<{
    id: string;
    name: string;
    dose: string;
    time: string;
    status: 'PENDING' | 'TAKEN' | 'SKIPPED';
  }>;
  recentVitals: {
    painScore: number;
    temperature: number;
    lastLoggedAt: string;
  };
  ashaWorker?: {
    name: string;
    phone: string;
    village: string;
  };
}

export const familyApi = {
  invite: async (
    planId: string,
    email: string,
    permissions: BackendCaregiverPermission[],
    name?: string,
    relationship?: string,
  ): Promise<FamilyInvitationResponse> => {
    return apiClient.post<FamilyInvitationResponse>(`/plans/${planId}/family/invite`, {
      email,
      permissions,
      name,
      relationship,
    });
  },

  accept: async (token: string, otp: string): Promise<{ success: boolean; membershipId: string }> => {
    return apiClient.post<{ success: boolean; membershipId: string }>(
      `/family/invitations/${token}/accept`,
      { otp },
    );
  },

  acceptInvitation: async (token: string, otp: string): Promise<{ success: boolean; membershipId: string }> => {
    return familyApi.accept(token, otp);
  },

  updatePermissions: async (
    memberId: string,
    permissions: BackendCaregiverPermission[],
  ): Promise<BackendFamilyMember> => {
    return apiClient.patch<BackendFamilyMember>(`/family/members/${memberId}`, { permissions });
  },

  revoke: async (memberId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/family/members/${memberId}`);
  },

  getMembers: async (): Promise<BackendFamilyMember[]> => {
    return apiClient.get<BackendFamilyMember[]>('/family/members');
  },

  getPatientOverview: async (): Promise<CaregiverPatientOverview> => {
    return apiClient.get<CaregiverPatientOverview>('/family/patient-overview');
  },
};
