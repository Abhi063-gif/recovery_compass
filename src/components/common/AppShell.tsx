import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { EmergencyBanner } from './EmergencyBanner';
import { DisclaimerBanner } from './DisclaimerBanner';
import { MobileBottomNav } from './MobileBottomNav';
import { SafetyAlertModal } from './SafetyAlertModal';
import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';
import { WifiOff } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { offlineStorage } from '@/services/offlineSync';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

export const AppShell: React.FC = () => {
  const { isOffline, setOffline, fetchNotifications } = useAppPreferencesStore();
  const { checkSession, isAuthenticated } = useAuthStore();
  const { loadOfflineSnapshot, fetchRemotePlan } = usePlanStore();
  const { fetchMembers } = useFamilyStore();

  useEffect(() => {
    // In live mode, purge any stale demo plan snapshot from localStorage
    if (!DEMO_MODE) {
      try {
        const raw = localStorage.getItem('rc_recovery_plan_snapshot');
        if (raw) {
          const parsed = JSON.parse(raw);
          // If the stored plan looks like a demo plan (has demo IDs), clear it
          if (parsed?.plan?.id && (
            parsed.plan.id.includes('demo') ||
            parsed.plan.id.includes('chole') ||
            parsed.plan.id.includes('mock')
          )) {
            localStorage.removeItem('rc_recovery_plan_snapshot');
          }
        }
      } catch { /* ignore */ }
    }

    // Check authentication session first
    checkSession().then(() => {
      // After session check — fetch live data only if authenticated and online
      if (navigator.onLine) {
        fetchNotifications();
        fetchRemotePlan();
        fetchMembers();
      } else {
        loadOfflineSnapshot();
      }
    });

    const handleOnline = () => {
      setOffline(false);
      fetchNotifications();
      fetchRemotePlan();
      fetchMembers();
    };
    const handleOffline = () => {
      setOffline(true);
      loadOfflineSnapshot();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline, checkSession, fetchNotifications, fetchRemotePlan, loadOfflineSnapshot, fetchMembers]);



  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-8">
      {/* Global Emergency Access Banner */}
      <EmergencyBanner />

      {/* Main Top Header */}
      <TopBar />

      {/* Persistent Medical Disclaimer */}
      <DisclaimerBanner />

      {/* Offline Status Pill if disconnected */}
      {isOffline && (
        <div
          role="status"
          className="bg-slate-800 text-slate-100 text-xs py-2 px-4 flex items-center justify-center gap-2 border-b border-slate-700"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>You are offline. Showing cached recovery plan data.</span>
        </div>
      )}

      {/* Page Content Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Fixed Navigation */}
      <MobileBottomNav />

      {/* Global High-Priority Safety Alert Modal */}
      <SafetyAlertModal />
    </div>
  );
};
