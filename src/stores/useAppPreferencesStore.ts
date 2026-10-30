import { create } from 'zustand';
import { NotificationItem } from '@/types';
import { notificationsApi } from '@/api/notifications';
import { preferencesApi } from '@/api/preferences';

interface AppPreferencesState {
  isOffline: boolean;
  language: string;
  role: 'patient' | 'caregiver';
  highContrast: boolean;
  notifications: NotificationItem[];
  isLoadingNotifications: boolean;

  // Actions
  setOffline: (status: boolean) => void;
  setLanguage: (lang: string) => void;
  setRole: (role: 'patient' | 'caregiver') => void;
  toggleHighContrast: () => void;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Antibiotic Dose Due at 8:00 PM',
    message: 'Cefuroxime 500mg with evening meal.',
    type: 'medication',
    timestamp: '2026-09-30T14:30:00Z',
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'Incentive Spirometry Breathing Check',
    message: 'Remember to complete 10 deep breaths hourly while awake.',
    type: 'task',
    timestamp: '2026-09-30T13:00:00Z',
    isRead: false,
  },
  {
    id: 'notif-3',
    title: 'Caregiver Update',
    message: 'David Vance logged morning Paracetamol as taken.',
    type: 'family',
    timestamp: '2026-09-30T08:16:00Z',
    isRead: true,
  },
];

const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem('rc_selected_language');
    if (saved) return saved;
  } catch {}
  return 'en';
};

export const useAppPreferencesStore = create<AppPreferencesState>((set, get) => ({
  isOffline: !navigator.onLine,
  language: getInitialLanguage(),
  role: 'patient',
  highContrast: false,
  notifications: DEFAULT_NOTIFICATIONS,
  isLoadingNotifications: false,

  setOffline: (status) => set({ isOffline: status }),
  setLanguage: (lang) => {
    try {
      localStorage.setItem('rc_selected_language', lang);
    } catch {}
    set({ language: lang });
  },
  setRole: (role) => set({ role }),
  toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),

  fetchNotifications: async () => {
    set({ isLoadingNotifications: true });
    try {
      const data = await notificationsApi.getAll();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: NotificationItem[] = data.map((n) => ({
          id: n.id,
          title: n.title || n.subject || 'Recovery Reminder',
          message: n.message || n.body || '',
          type: n.type.toLowerCase().includes('med')
            ? 'medication'
            : n.type.toLowerCase().includes('safety')
            ? 'safety'
            : n.type.toLowerCase().includes('follow')
            ? 'followup'
            : n.type.toLowerCase().includes('caregiver')
            ? 'family'
            : 'task',
          timestamp: n.sentAt || n.scheduledFor || n.createdAt || new Date().toISOString(),
          isRead: n.status === 'READ',
          isUrgent: n.type === 'SAFETY_ALERT',
        }));
        set({ notifications: mapped, isLoadingNotifications: false });
        return;
      }
    } catch {
      // Keep defaults
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  markNotificationRead: async (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));

    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      console.warn('Backend markRead failed or offline:', err);
    }
  },

  clearAllNotifications: () => set({ notifications: [] }),
}));
