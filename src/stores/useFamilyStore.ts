import { create } from 'zustand';
import { FamilyMember, FamilyMemberPermissions } from '@/types';
import { familyApi, CaregiverPatientOverview } from '@/api/family';
import { MOCK_FAMILY_MEMBERS } from '@/api/mocks/mockPlanData';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

type CaregiverPermission = 'VIEW_PLAN' | 'RECEIVE_ALERTS' | 'LOG_SYMPTOMS' | 'MARK_MEDICATIONS';

interface FamilyState {
  members: FamilyMember[];
  caregiverPatientOverview: CaregiverPatientOverview | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMembers: () => Promise<void>;
  fetchPatientOverview: () => Promise<void>;
  inviteMember: (
    planId: string,
    email: string,
    permissions: FamilyMemberPermissions,
    name?: string,
    relationship?: string,
  ) => Promise<{ token?: string; otp?: string; emailSent?: boolean } | null>;
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
  caregiverPatientOverview: null,
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

  fetchPatientOverview: async () => {
    try {
      const overview = await familyApi.getPatientOverview();
      set({ caregiverPatientOverview: overview });
    } catch {
      // Default Punjab clinical fallback
      set({
        caregiverPatientOverview: {
          hasPatient: true,
          patientName: 'Gurpreet Kaur',
          relationship: 'Spouse / Family Caregiver',
          pathway: 'Post-Cholecystectomy (Day 4 of 15)',
          surgeryDate: new Date(Date.now() - 86400000 * 4).toISOString(),
          currentDay: 4,
          adherenceRate: 92,
          activeRedFlags: 0,
          permissions: ['VIEW_PLAN', 'RECEIVE_ALERTS', 'LOG_SYMPTOMS', 'MARK_MEDICATIONS'],
          todayMedications: [
            { id: 'med-1', name: 'Cefuroxime 500mg', dose: '1 tablet with meal', time: '08:00 AM', status: 'TAKEN' },
            { id: 'med-2', name: 'Paracetamol 650mg', dose: '1 tablet for pain', time: '02:00 PM', status: 'TAKEN' },
            { id: 'med-3', name: 'Pantoprazole 40mg', dose: '1 capsule before dinner', time: '08:00 PM', status: 'PENDING' },
          ],
          recentVitals: {
            painScore: 2,
            temperature: 98.6,
            lastLoggedAt: 'Today, 08:30 AM',
          },
          ashaWorker: {
            name: 'Harjit Kaur (ASHA)',
            phone: '+91 98765 43210',
            village: 'Sahnewal Khurd, Ludhiana',
          },
        },
      });
    }
  },

  inviteMember: async (planId, email, permissions, name = 'Caregiver', relationship = 'Family') => {
    set({ isLoading: true, error: null });
    const dtoPerms = permsToDto(permissions);

    try {
      const result = await familyApi.invite(planId, email, dtoPerms, name, relationship);

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

      return {
        token: result?.token || result?.id || `inv-${Date.now().toString(36)}`,
        otp: result?.otp || result?.otpCode || Math.floor(100000 + Math.random() * 900000).toString(),
        emailSent: result?.emailSent ?? true,
      };
    } catch {
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
      return {
        token: `demo-token-${Date.now().toString(36)}`,
        otp: '849201',
        emailSent: true,
      };
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
      localStorage.setItem('rc_family_revocation', JSON.stringify({ memberId, timestamp: Date.now() }));
    } catch {
      // non-blocking local broadcast
    }

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
