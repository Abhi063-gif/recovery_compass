import { create } from 'zustand';
import { FamilyMember, FamilyMemberPermissions } from '@/types';
import { familyApi } from '@/api/family';
import { MOCK_FAMILY_MEMBERS } from '@/api/mocks/mockPlanData';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

// Use local type alias to avoid contract package dependency during conflict resolution
type CaregiverPermission = 'VIEW_PLAN' | 'RECEIVE_ALERTS' | 'LOG_SYMPTOMS' | 'MARK_MEDICATIONS';

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMembers: () => Promise<void>;
  inviteMember: (
    planId: string,
    email: string,
    permissions: FamilyMemberPermissions,
    name?: string,
    relationship?: string,
  ) => Promise<{ token?: string; otp?: string } | null>;
  updatePermissions: (memberId: string, permissions: Partial<FamilyMemberPermissions>) => Promise<void>;
  revokeAccess: (memberId: string) => Promise<void>;
  acceptInvitation: (token: string, otp: string) => Promise<boolean>;
}

function permsToDto(p: Partial<FamilyMemberPermissions>): CaregiverPermission[] {
  const result: CaregiverPermission[] = [];
  if (p.viewPlan) result.push('VIEW_PLAN');
  if (p.receiveAlerts) result.push('RECEIVE_ALERTS');
  if (p.logSymptoms) result.push('LOG_SYMPTOMS');
  if (p.markMedicines) result.push('MARK_MEDICATIONS');
  return result;
}

function dtoToPerms(dtoPerms: CaregiverPermission[] = []): FamilyMemberPermissions {
  return {
    viewPlan: dtoPerms.includes('VIEW_PLAN'),
    receiveAlerts: dtoPerms.includes('RECEIVE_ALERTS'),
    logSymptoms: dtoPerms.includes('LOG_SYMPTOMS'),
    markMedicines: dtoPerms.includes('MARK_MEDICATIONS'),
  };
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: DEMO_MODE ? MOCK_FAMILY_MEMBERS : [],
  isLoading: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true });
    try {
      const data = await familyApi.getMembers();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: FamilyMember[] = data.map((m) => ({
          id: m.id,
          name: m.caregiverName || (m.caregiver ? `${m.caregiver.user.firstName} ${m.caregiver.user.lastName}`.trim() : m.email || 'Caregiver'),
          relationship: m.relationship || m.caregiver?.relationship || 'Caregiver',
          email: m.email || m.caregiver?.user?.email || '',
          status: m.isActive ? 'active' : 'revoked',
          permissions: dtoToPerms(m.permissions),
          invitedAt: m.createdAt,
        }));
        set({ members: mapped, isLoading: false });
        return;
      }
    } catch {
      // Keep existing members or mock fallback
    } finally {
      set({ isLoading: false });
    }
  },

  inviteMember: async (planId, email, permissions, name = 'Caregiver', relationship = 'Family') => {
    set({ isLoading: true, error: null });
    const dtoPerms = permsToDto(permissions);

    try {
      const result = await familyApi.invite(planId, email, dtoPerms);

      const newMember: FamilyMember = {
        id: result?.invitationId || result?.id || `fam-${Date.now()}`,
        name,
        relationship,
        email,
        status: 'pending',
        permissions,
        invitedAt: new Date().toISOString(),
      };

      set((state) => ({
        members: [...state.members, newMember],
        isLoading: false,
      }));

      return { token: result?.token || result?.id || '', otp: result?.otp || result?.otpCode || '' };
    } catch (err: any) {
      // Local fallback for offline/demo
      const newMember: FamilyMember = {
        id: `fam-${Date.now()}`,
        name,
        relationship,
        email,
        status: 'pending',
        permissions,
        invitedAt: new Date().toISOString(),
      };
      set((state) => ({
        members: [...state.members, newMember],
        isLoading: false,
      }));
      return { token: `demo-token-${Date.now()}`, otp: '8492' };
    }
  },

  updatePermissions: async (memberId, permissions) => {
    const existing = get().members.find((m) => m.id === memberId);
    if (!existing) return;

    const merged = { ...existing.permissions, ...permissions };
    const dtoPerms = permsToDto(merged);

    // Optimistic UI update
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, permissions: merged } : m
      ),
    }));

    try {
      await familyApi.updatePermissions(memberId, dtoPerms);
    } catch (err) {
      console.warn('Backend update permissions failed or offline:', err);
    }
  },

  revokeAccess: async (memberId) => {
    // Immediate UI update
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, status: 'revoked' } : m
      ),
    }));

    try {
      await familyApi.revoke(memberId);
    } catch (err) {
      console.warn('Backend revoke failed or offline:', err);
    }
  },

  acceptInvitation: async (token, otp) => {
    set({ isLoading: true, error: null });
    try {
      await familyApi.acceptInvitation(token, otp);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to accept invitation. Invalid code or expired link.',
        isLoading: false,
      });
      return false;
    }
  },
}));
