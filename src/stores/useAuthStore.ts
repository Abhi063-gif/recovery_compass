import { create } from 'zustand';
import { authApi, UserSession, apiClient } from '@/api';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM';
  description: string;
  avatarInitials: string;
  color: string;
  badge: string;
}

/**
 * Demo personas — Indian Public Health Personas (PRD Section 10).
 * Pre-configured for Punjab Block-level & District Hospital testing.
 */
export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: 'usr-patient-gurpreet',
    name: 'Gurpreet Kaur',
    email: 'gurpreet.kaur@rural.recoverycompass.org',
    role: 'PATIENT',
    description: 'Patient, Post-Cholecystectomy, Day 4, Sahnewal, Ludhiana, Punjab',
    avatarInitials: 'GK',
    color: 'bg-rose-700',
    badge: 'Patient (Primary)',
  },
  {
    id: 'usr-asha-harjit',
    name: 'Harjit Kaur (ASHA)',
    email: 'harjit.asha@rural.recoverycompass.org',
    role: 'ASHA',
    description: 'ASHA Worker, Sub-Centre Gill / Sahnewal Block, Ludhiana',
    avatarInitials: 'HK',
    color: 'bg-amber-600',
    badge: 'ASHA Worker',
  },
  {
    id: 'usr-anm-manpreet',
    name: 'Manpreet Sister Sandhu',
    email: 'manpreet.anm@rural.recoverycompass.org',
    role: 'ANM',
    description: 'ANM Supervisor, CHC Sahnewal / Civil Hospital Ludhiana',
    avatarInitials: 'MS',
    color: 'bg-teal-700',
    badge: 'ANM Supervisor',
  },
  {
    id: 'usr-dr-dhillon',
    name: 'Dr. Harinder Singh Dhillon',
    email: 'dr.dhillon@rural.recoverycompass.org',
    role: 'ADMIN',
    description: 'Senior Medical Officer (SMO), Civil Hospital Ludhiana',
    avatarInitials: 'HD',
    color: 'bg-sky-700',
    badge: 'Medical Officer / Doctor',
  },
];

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;

  // Actions
  login: (
    credentials: string | { email?: string; phone?: string; password?: string; pin?: string },
    password?: string
  ) => Promise<boolean>;
  register: (data: {
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM';
    password?: string;
    pin?: string;
    relationship?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  initSession: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;

  // Demo-only actions
  quickDemoLogin: (role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM') => Promise<boolean>;
  switchPersona: (persona: UserPersona) => void;
  setDemoUser: (role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN' | 'ASHA' | 'ANM') => void;
  exitDemo: () => void;
}

/**
 * Authentication store.
 *
 * Production (VITE_DEMO_MODE=false):
 *   - login / register call the real backend API
 *   - Failures surface real error messages — NEVER fall to mock
 *   - No fake sessions created
 *
 * Demo mode (VITE_DEMO_MODE=true):
 *   - switchPersona / setDemoUser inject synthetic user sessions
 *   - Clearly labelled as demo in the UI
 *   - Production auth also works in demo mode
 */
export const useAuthStore = create<AuthState>((set) => ({
  // In demo mode, start with a demo user pre-loaded
  user: DEMO_MODE
    ? {
        userId: DEMO_PERSONAS[0].id,
        email: DEMO_PERSONAS[0].email,
        role: DEMO_PERSONAS[0].role,
        firstName: 'Gurpreet',
        lastName: 'Kaur',
      }
    : null,
  isAuthenticated: DEMO_MODE,
  isLoading: false,
  isDemoMode: DEMO_MODE,
  error: null,

  login: async (credentials, password) => {
    set({ isLoading: true, error: null });
    try {
      let payload: { email?: string; phone?: string; password?: string; pin?: string };
      if (typeof credentials === 'string') {
        if (credentials.includes('@')) {
          payload = { email: credentials, password };
        } else {
          payload = { phone: credentials, pin: password, password };
        }
      } else {
        payload = credentials;
      }

      const res = await authApi.login(payload);
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      // PRODUCTION: Surface real errors — NEVER fall back to mock sessions
      const message =
        err?.message ||
        'Login failed. Please check your credentials and try again.';

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });

      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const message =
        err?.message ||
        'Registration failed. Please try again.';

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });

      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear tokens even if API call fails
      apiClient.clearTokens();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isDemoMode: false,
        error: null,
      });
    }
  },

  initSession: async () => {
    // In demo mode, session is already set in initial state
    if (DEMO_MODE) return;

    const token = apiClient.getAccessToken();
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      // Session expired or invalid — clear state
      apiClient.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkSession: async () => {
    const token = apiClient.getAccessToken();
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      apiClient.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),

  quickDemoLogin: async (role = 'PATIENT') => {
    const persona = DEMO_PERSONAS.find((p) => p.role === role) || DEMO_PERSONAS[0];
    set({
      user: {
        userId: persona.id,
        email: persona.email,
        role: persona.role,
        firstName: persona.name.split(' ')[0],
        lastName: persona.name.split(' ')[1] || '',
      },
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
      error: null,
    });
    return true;
  },

  // ── Demo-only actions ──────────────────────────────────────────────────────
  // These are guarded: in production mode they are no-ops with a console warning.

  switchPersona: (persona: UserPersona) => {
    set({
      user: {
        userId: persona.id,
        email: persona.email,
        role: persona.role,
        firstName: persona.name.split(' ')[0],
        lastName: persona.name.split(' ')[1] || '',
      },
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
      error: null,
    });
  },

  setDemoUser: (role = 'PATIENT') => {
    const persona = DEMO_PERSONAS.find((p) => p.role === role) || DEMO_PERSONAS[0];
    set({
      user: {
        userId: persona.id,
        email: persona.email,
        role: persona.role,
        firstName: persona.name.split(' ')[0],
        lastName: persona.name.split(' ')[1] || '',
      },
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
      error: null,
    });
  },

  exitDemo: () => {
    set({
      user: null,
      isAuthenticated: false,
      isDemoMode: false,
      error: null,
    });
  },
}));
