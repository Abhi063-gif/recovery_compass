import { create } from 'zustand';
import { authApi, UserSession, apiClient } from '@/api';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'CAREGIVER' | 'ADMIN';
  description: string;
  avatarInitials: string;
  color: string;
  badge: string;
}

/**
 * Demo personas — ONLY used when VITE_DEMO_MODE=true.
 * Never injected into production authentication flows.
 */
export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: 'usr-patient-maria',
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@example.com',
    role: 'PATIENT',
    description: 'Patient recovering from Laparoscopic Cholecystectomy (Day 3)',
    avatarInitials: 'MG',
    color: 'bg-rose-700',
    badge: 'Patient (Primary)',
  },
  {
    id: 'usr-caregiver-carlos',
    name: 'Carlos Gonzalez',
    email: 'carlos.gonzalez@example.com',
    role: 'CAREGIVER',
    description: 'Family Caregiver with View Plan & Receive Alert Permissions',
    avatarInitials: 'CG',
    color: 'bg-emerald-700',
    badge: 'Family Caregiver',
  },
  {
    id: 'usr-admin-jenkins',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@recoverycompass.local',
    role: 'ADMIN',
    description: 'Surgical Clinical Pathway Lead & Safety Administrator',
    avatarInitials: 'SJ',
    color: 'bg-sky-700',
    badge: 'Clinician / Admin',
  },
];

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'PATIENT' | 'CAREGIVER';
    phone?: string;
    password?: string;
    relationship?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  initSession: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;

  // Demo-only actions
  quickDemoLogin: (role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN') => Promise<boolean>;
  switchPersona: (persona: UserPersona) => void;
  setDemoUser: (role?: 'PATIENT' | 'CAREGIVER' | 'ADMIN') => void;
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
        firstName: 'Maria',
        lastName: 'Gonzalez',
      }
    : null,
  isAuthenticated: DEMO_MODE,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
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
      error: null,
    });
    return true;
  },

  // ── Demo-only actions ──────────────────────────────────────────────────────
  // These are guarded: in production mode they are no-ops with a console warning.

  switchPersona: (persona: UserPersona) => {
    if (!DEMO_MODE) {
      console.warn('[Auth] switchPersona is only available in DEMO_MODE=true');
      return;
    }
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
      error: null,
    });
  },

  setDemoUser: (role = 'PATIENT') => {
    if (!DEMO_MODE) {
      console.warn('[Auth] setDemoUser is only available in DEMO_MODE=true');
      return;
    }
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
      error: null,
    });
  },
}));
