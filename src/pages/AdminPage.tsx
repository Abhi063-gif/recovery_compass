import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sliders,
  History,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/stores/useAuthStore';

export const AdminPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'settings' | 'audit'>('rules');
  const [remoteRules, setRemoteRules] = useState<any[]>([]);
  const [remotePathways, setRemotePathways] = useState<any[]>([]);
  const [configData, setConfigData] = useState<any>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      adminApi.getRedFlagRules().then(setRemoteRules).catch(() => {});
      adminApi.getPathways().then(setRemotePathways).catch(() => {});
      adminApi.getConfig().then(setConfigData).catch(() => {});
    }
  }, [isAdmin]);

  const defaultRules = [
    { id: '1', ruleCode: 'RF-TEMP-HIGH', name: 'High Fever (> 38.5°C / 101.3°F)', severity: 'URGENT', status: 'ACTIVE', action: 'CONTACT_CLINICIAN' },
    { id: '2', ruleCode: 'RF-PAIN-SEVERE', name: 'Severe pain (>= 8/10)', severity: 'WARNING', status: 'ACTIVE', action: 'CONTACT_CLINICIAN' },
    { id: '3', ruleCode: 'RF-CHEST-PAIN-BREATH', name: 'Breathing difficulty / Dyspnea / Calf swelling', severity: 'EMERGENCY', status: 'ACTIVE', action: 'SEEK_EMERGENCY_HELP' },
  ];

  const rules = remoteRules.length > 0 ? remoteRules : defaultRules;

  const defaultPathways = [
    { id: 'p1', identifier: 'POST_SURGERY', name: 'Post-Surgery Standard Recovery', version: 1, status: 'Active' },
    { id: 'p2', identifier: 'ORTHOPEDIC_RECOVERY', name: 'Orthopedic Joint Replacement', version: 1, status: 'Active' },
    { id: 'p3', identifier: 'CARDIAC_REHAB', name: 'Cardiac Rehabilitation', version: 1, status: 'Draft' },
  ];

  const pathways = remotePathways.length > 0 ? remotePathways : defaultPathways;

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Admin Authentication Required</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Administrative clinical safety constraints and pathway rules require an administrator role.
        </p>
        <button
          onClick={() => quickDemoLogin('ADMIN')}
          className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Switch to Admin Profile (admin@recoverycompass.com)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Admin & Clinical Safety Panel
            </h1>
            <span className="text-xs text-slate-500">
              Clinical safety constraints, deterministic rules, and pathway templates.
            </span>
          </div>
        </div>

        <button
          onClick={() => alert('New Rule: In production, clinician review & audit approval is required.')}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* 2-Column Admin Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Admin Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200 shadow-card space-y-1">
          {[
            { id: 'rules' as const, label: 'Red-Flag Rules', icon: AlertTriangle },
            { id: 'templates' as const, label: 'Pathway Templates', icon: FileText },
            { id: 'settings' as const, label: 'System Settings', icon: Sliders },
            { id: 'audit' as const, label: 'Audit Logs', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition text-left ${
                  activeTab === item.id
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

        {/* Right Rules / Content Table */}
        <div className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
          {activeTab === 'rules' && (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900">
                  Deterministic Clinical Red-Flag Rules
                </h2>
                <span className="text-xs text-slate-400">Strictly Non-AI Evaluation</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Rule Name</th>
                      <th className="pb-3">Severity</th>
                      <th className="pb-3">Action Required</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 font-mono font-bold text-slate-700">{r.ruleCode}</td>
                        <td className="py-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              r.severity === 'EMERGENCY'
                                ? 'bg-red-100 text-red-800'
                                : r.severity === 'URGENT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-mono text-[11px]">{r.action}</td>
                        <td className="py-3">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'templates' && (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900">Pathway Templates</h2>
                <span className="text-xs text-slate-400">Recovery Pathways</span>
              </div>
              <div className="space-y-3">
                {pathways.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {p.identifier} • Version {p.version}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3 text-xs">
              <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                System Global Settings
              </h2>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <pre>{JSON.stringify(configData || {
                  IS_PROTOTYPE: true,
                  RATE_LIMIT_MAX: 100,
                  CONFIDENCE_HIGH: 0.85,
                  CONFIDENCE_MEDIUM: 0.60,
                  OCR_ENGINE: 'tesseract',
                  STORAGE: 'memory'
                }, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Recent Audit Trail
              </h2>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>SYSTEM_SEEDED</span>
                  <span className="text-slate-400">2026-09-30T06:00:00Z</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>PLAN_CREATED</span>
                  <span className="text-slate-400">2026-09-30T06:15:00Z</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>CONSENT_RECORD_GRANTED (VIEW_PLAN)</span>
                  <span className="text-slate-400">2026-09-30T06:20:00Z</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
