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
}

export const familyApi = {
  invite: async (
    planId: string,
    email: string,
    permissions: BackendCaregiverPermission[],
  ): Promise<FamilyInvitationResponse> => {
    return apiClient.post<FamilyInvitationResponse>(`/plans/${planId}/family/invite`, {
      email,
      permissions,
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
};
