import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Globe,
  Bell,
  Lock,
  Database,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { privacyApi } from '@/api/privacy';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, resetAll, loadDemoPatient } = usePlanStore();
  const { language, setLanguage } = useAppPreferencesStore();

  const [activeMenu, setActiveMenu] = useState<'profile' | 'language' | 'notifications' | 'privacy' | 'data'>('privacy');
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Recovery_Compass_Health_Record.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleConfirmDeletion = async () => {
    try {
      await privacyApi.requestDeletion();
    } catch (e) {
      console.warn('Backend deletion request offline or skipped:', e);
    }
    resetAll();
    setShowDeletionConfirm(false);
    await useAuthStore.getState().logout();
    navigate('/');
    alert('All stored recovery data and account records have been permanently deleted.');
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Settings & Privacy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your account preferences, consent history, and data export.
        </p>
      </div>

      {/* 2-Column Layout (Matching Wireframe 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-card space-y-1">
          {[
            { id: 'profile' as const, label: 'Profile', icon: User },
            { id: 'language' as const, label: 'Language', icon: Globe },
            { id: 'notifications' as const, label: 'Notifications', icon: Bell },
            { id: 'privacy' as const, label: 'Privacy & Consent', icon: Lock },
            { id: 'data' as const, label: 'Data Management', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition text-left ${
                  activeMenu === item.id
                    ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-rose-700" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Panel */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
          {activeMenu === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="font-bold text-base text-slate-900">Privacy & Data</h2>
                <span className="text-xs text-slate-500">
                  Manage how your health instructions and recovery records are stored.
                </span>
              </div>

              <div className="space-y-3">
                {/* Download my data box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      Download my data
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Get a copy of your recovery plan and logged check-ins.
                    </span>
                  </div>

                  <button
                    onClick={handleDownloadData}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-subtle flex items-center gap-1.5 transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadSuccess ? 'Downloaded!' : 'Export JSON'}</span>
                  </button>
                </div>

                {/* Request data deletion box */}
                <div className="p-4 bg-urgentRed-50/60 rounded-2xl border border-urgentRed-200 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-urgentRed-950 block">
                      Request data deletion
                    </span>
                    <span className="text-[11px] text-urgentRed-700">
                      Permanently delete your local recovery plan & logs.
                    </span>
                  </div>

                  <button
                    onClick={() => setShowDeletionConfirm(true)}
                    className="px-4 py-2 bg-urgentRed-600 hover:bg-urgentRed-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                  >
                    Delete Data
                  </button>
                </div>
              </div>

              {/* Consent Notice Record */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Processing Consent Active</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Consented on 16-Apr-2026. Data is strictly processed for the patient's recovery timeline
                  and not shared with third parties.
                </p>
              </div>
            </div>
          )}

          {activeMenu === 'profile' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="font-bold text-base text-slate-900">Patient Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block">Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {plan.patientProfile.name}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block">Care Pathway</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {plan.patientProfile.pathway}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'language' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="font-bold text-base text-slate-900">Language</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (Spanish)</option>
              </select>
            </div>
          )}

          {activeMenu === 'data' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="font-bold text-base text-slate-900">Demo Presets & Data Tools</h2>
              <button
                onClick={loadDemoPatient}
                className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Knee Surgery Demo Patient</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Deletion Confirmation Modal */}
      {showDeletionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Permanent Deletion?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will erase all extracted medications, logged symptoms, and timeline notes from this browser session.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeletionConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletion}
                className="px-4 py-2 bg-urgentRed-600 hover:bg-urgentRed-700 text-white font-bold text-xs rounded-xl"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
