import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Calendar,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, fetchNotifications } = useAppPreferencesStore();
  const [activeTab, setActiveTab] = useState<'all' | 'medication' | 'alerts' | 'system'>('all');

  useEffect(() => {
    fetchNotifications().catch(() => {});
  }, [fetchNotifications]);

  const [prefs, setPrefs] = useState({
    medication: true,
    tasks: true,
    followup: true,
    safety: true,
    caregiver: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'medication') return n.type === 'medication';
    if (activeTab === 'alerts') return n.type === 'safety';
    return n.type === 'task' || n.type === 'family';
  });

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Header (Matching Wireframe 15) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage reminders and automated alerts.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Notifications List with Tabs */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            {[
              { id: 'all' as const, label: 'All (5)' },
              { id: 'medication' as const, label: 'Medication (2)' },
              { id: 'alerts' as const, label: 'Alerts (1)' },
              { id: 'system' as const, label: 'System (2)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-rose-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3 hover:bg-slate-100/70 transition cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">2h ago</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Notification Preferences (Matching Wireframe 15) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            Notification Preferences
          </h3>

          <div className="space-y-3 text-xs">
            {[
              { key: 'medication' as const, label: 'Medication reminders' },
              { key: 'tasks' as const, label: 'Task reminders' },
              { key: 'followup' as const, label: 'Follow-up reminders' },
              { key: 'safety' as const, label: 'Safety alerts' },
              { key: 'caregiver' as const, label: 'Caregiver alerts' },
            ].map((pref) => (
              <div
                key={pref.key}
                onClick={() => togglePref(pref.key)}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
              >
                <span className="font-semibold text-slate-800">{pref.label}</span>
                <input
                  type="checkbox"
                  checked={prefs[pref.key]}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-rose-700 focus:ring-rose-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
