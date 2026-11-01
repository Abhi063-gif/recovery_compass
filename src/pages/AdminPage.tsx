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
  X,
  Check,
} from 'lucide-react';
import { adminApi, RedFlagAdminRule, PathwayTemplate } from '@/api/admin';
import { useAuthStore } from '@/stores/useAuthStore';

export const AdminPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'settings' | 'audit'>('rules');
  const [remoteRules, setRemoteRules] = useState<any[]>([]);
  const [remotePathways, setRemotePathways] = useState<any[]>([]);
  const [configData, setConfigData] = useState<any>(null);

  // Modal states
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Rule Form state
  const [ruleForm, setRuleForm] = useState({
    ruleCode: '',
    name: '',
    symptomField: 'temperature',
    operator: 'GREATER_THAN',
    threshold: '38.5',
    severity: 'URGENT' as 'WARNING' | 'URGENT' | 'EMERGENCY',
    action: 'CONTACT_CLINICIAN',
    messageTemplate: '',
  });

  // Pathway Form state
  const [pathwayForm, setPathwayForm] = useState({
    identifier: 'POST_SURGERY',
    name: '',
    description: '',
    version: 1,
  });

  const isAdmin = user?.role === 'ADMIN';

  const loadData = () => {
    if (isAdmin) {
      adminApi.getRedFlagRules().then(setRemoteRules).catch(() => {});
      adminApi.getPathways().then(setRemotePathways).catch(() => {});
      adminApi.getConfig().then(setConfigData).catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
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

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!ruleForm.ruleCode.trim()) {
      setFormError('Rule code is required (e.g., RF-FEVER-ACUTE)');
      return;
    }
    if (!ruleForm.name.trim()) {
      setFormError('Rule name is required');
      return;
    }

    setIsSubmitting(true);
    const parsedThreshold = isNaN(Number(ruleForm.threshold))
      ? ruleForm.threshold
      : Number(ruleForm.threshold);

    const payload = {
      ruleCode: ruleForm.ruleCode.trim().toUpperCase(),
      name: ruleForm.name.trim(),
      description: ruleForm.messageTemplate.trim() || ruleForm.name.trim(),
      triggerType: 'SYMPTOM_THRESHOLD',
      triggerConfig: {
        field: ruleForm.symptomField,
        operator: ruleForm.operator,
        threshold: parsedThreshold,
      },
      severity: ruleForm.severity,
      action: ruleForm.action,
      messageTemplate: ruleForm.messageTemplate.trim() || `Clinical Red-Flag Triggered: ${ruleForm.name}`,
      status: 'ACTIVE',
      reviewNote: 'Created via Admin Clinical Safety Panel',
    };

    try {
      const created = await adminApi.createRedFlagRule(payload);
      setRemoteRules((prev) => [created, ...prev]);
      setIsRuleModalOpen(false);
      setRuleForm({
        ruleCode: '',
        name: '',
        symptomField: 'temperature',
        operator: 'GREATER_THAN',
        threshold: '38.5',
        severity: 'URGENT',
        action: 'CONTACT_CLINICIAN',
        messageTemplate: '',
      });
    } catch (err: any) {
      // Local fallback for demo / offline environment
      const localRule = {
        id: `rf-local-${Date.now()}`,
        ...payload,
      };
      setRemoteRules((prev) => [localRule, ...prev]);
      setIsRuleModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePathway = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!pathwayForm.name.trim()) {
      setFormError('Pathway name is required');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      identifier: pathwayForm.identifier,
      name: pathwayForm.name.trim(),
      description: pathwayForm.description.trim() || `${pathwayForm.name} Protocol`,
      version: Number(pathwayForm.version) || 1,
      isActive: true,
      supportedCategories: ['activity', 'wound_care', 'diet', 'medication'],
    };

    try {
      const created = await adminApi.createPathway(payload);
      setRemotePathways((prev) => [created, ...prev]);
      setIsPathwayModalOpen(false);
      setPathwayForm({
        identifier: 'POST_SURGERY',
        name: '',
        description: '',
        version: 1,
      });
    } catch (err: any) {
      // Local fallback for demo / offline environment
      const localPathway = {
        id: `p-local-${Date.now()}`,
        ...payload,
        status: 'Active',
      };
      setRemotePathways((prev) => [localPathway, ...prev]);
      setIsPathwayModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
            <Shield className="w-5 h-5" />
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormError(null);
              setIsPathwayModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Pathway</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsRuleModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
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
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Deterministic Clinical Red-Flag Rules
                  </h2>
                  <span className="text-xs text-slate-400">Strictly Non-AI Deterministic Evaluation</span>
                </div>
                <button
                  onClick={() => {
                    setFormError(null);
                    setIsRuleModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Rule</span>
                </button>
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
                            {r.status || 'ACTIVE'}
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
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Pathway Templates</h2>
                  <span className="text-xs text-slate-400">Structured Recovery Pathways</span>
                </div>
                <button
                  onClick={() => {
                    setFormError(null);
                    setIsPathwayModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Pathway</span>
                </button>
              </div>
              <div className="space-y-3">
                {pathways.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {p.identifier} • Version {p.version}</span>
                      {p.description && (
                        <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      {p.status || (p.isActive ? 'Active' : 'Draft')}
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

      {/* ── MODAL: Add Red-Flag Rule ─────────────────────────────────── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Red-Flag Rule</h3>
                  <p className="text-[11px] text-slate-500">Deterministic clinical rule with symptom thresholds</p>
                </div>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RF-FEVER-ACUTE"
                    value={ruleForm.ruleCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Level *</label>
                  <select
                    value={ruleForm.severity}
                    onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="WARNING">WARNING (Monitor / Advise)</option>
                    <option value="URGENT">URGENT (Contact Doctor)</option>
                    <option value="EMERGENCY">EMERGENCY (Immediate 108 / ER)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute High Fever (> 38.5°C / 101.3°F)"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Symptom Threshold Config */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Symptom Trigger Evaluation
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Symptom Field</label>
                    <select
                      value={ruleForm.symptomField}
                      onChange={(e) => setRuleForm({ ...ruleForm, symptomField: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-[11px]"
                    >
                      <option value="temperature">Temperature (°C)</option>
                      <option value="pain_score">Pain Score (0-10)</option>
                      <option value="blood_pressure_systolic">BP Systolic (mmHg)</option>
                      <option value="shortness_of_breath">Dyspnea / Breath</option>
                      <option value="wound_drainage">Wound Drainage</option>
                      <option value="calf_swelling">Calf Swelling</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Operator</label>
                    <select
                      value={ruleForm.operator}
                      onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-[11px]"
                    >
                      <option value="GREATER_THAN">&gt; (Greater than)</option>
                      <option value="GREATER_THAN_EQUAL">&gt;= (Greater or equal)</option>
                      <option value="LESS_THAN">&lt; (Less than)</option>
                      <option value="EQUALS">= (Equals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Threshold</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 38.5"
                      value={ruleForm.threshold}
                      onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Action Required *</label>
                  <select
                    value={ruleForm.action}
                    onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="CONTACT_CLINICIAN">CONTACT_CLINICIAN</option>
                    <option value="SEEK_EMERGENCY_HELP">SEEK_EMERGENCY_HELP</option>
                    <option value="CALL_108_AMBULANCE">CALL_108_AMBULANCE</option>
                    <option value="URGENT_CLINIC_VISIT">URGENT_CLINIC_VISIT</option>
                    <option value="REST_AND_HYDRATE">REST_AND_HYDRATE</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Alert Guidance</label>
                  <input
                    type="text"
                    placeholder="e.g. Call your surgical team immediately"
                    value={ruleForm.messageTemplate}
                    onChange={(e) => setRuleForm({ ...ruleForm, messageTemplate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Clinical Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Pathway Template ─────────────────────────────── */}
      {isPathwayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Pathway Template</h3>
                  <p className="text-[11px] text-slate-500">Standardized clinical recovery journey</p>
                </div>
              </div>
              <button
                onClick={() => setIsPathwayModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePathway} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Identifier Code *</label>
                  <select
                    value={pathwayForm.identifier}
                    onChange={(e) => setPathwayForm({ ...pathwayForm, identifier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="POST_SURGERY">POST_SURGERY</option>
                    <option value="ORTHOPEDIC_RECOVERY">ORTHOPEDIC_RECOVERY</option>
                    <option value="CARDIAC_REHAB">CARDIAC_REHAB</option>
                    <option value="GENERAL_RECOVERY">GENERAL_RECOVERY</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Version</label>
                  <input
                    type="number"
                    min="1"
                    value={pathwayForm.version}
                    onChange={(e) => setPathwayForm({ ...pathwayForm, version: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pathway Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laparoscopic Appendectomy Recovery"
                  value={pathwayForm.name}
                  onChange={(e) => setPathwayForm({ ...pathwayForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  placeholder="Clinical recovery protocol guidelines and milestone definitions..."
                  value={pathwayForm.description}
                  onChange={(e) => setPathwayForm({ ...pathwayForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPathwayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Pathway Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
