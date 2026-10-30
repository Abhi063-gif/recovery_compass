import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Phone,
  Building2,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { communityApi } from '@/api/community';

interface EscalationRecord {
  id: string;
  patientId: string;
  patientName: string;
  village: string;
  ashaWorker: string;
  pathway: string;
  severity: 'WARNING' | 'URGENT' | 'EMERGENCY';
  reason: string;
  status: 'RAISED' | 'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED';
  createdAt: string;
  resolutionNotes?: string;
  referralFacility?: string;
}

const INITIAL_ESCALATIONS: EscalationRecord[] = [
  {
    id: 'esc-01',
    patientId: 'patient-ramesh-02',
    patientName: 'Ramesh Jadhav',
    village: 'Wagholi Rural, Haveli',
    ashaWorker: 'Meena Thopte (ASHA)',
    pathway: 'DIABETES',
    severity: 'EMERGENCY',
    reason: 'Fasting Blood Sugar > 245 mg/dL with persistent nausea, confusion and 3 missed insulin doses.',
    status: 'RAISED',
    createdAt: '1 hour ago',
  },
  {
    id: 'esc-02',
    patientId: 'patient-sharda-01',
    patientName: 'Sharda Patil',
    village: 'Koregaon Bhima, Shirur',
    ashaWorker: 'Sunita Kamble (ASHA)',
    pathway: 'POST_SURGERY',
    severity: 'URGENT',
    reason: 'Temperature 101.4°F on post-cholecystectomy Day 4. Incision site erythema and missed Cefuroxime.',
    status: 'ACKNOWLEDGED',
    createdAt: '3 hours ago',
    resolutionNotes: 'Advised ASHA to supervise evening antibiotic dose and perform antiseptic dressing. Tele-check with PHC Medical Officer.',
  },
  {
    id: 'esc-03',
    patientId: 'patient-geeta-05',
    patientName: 'Geeta Shinde',
    village: 'Sanaswadi, Shirur',
    ashaWorker: 'Sunita Kamble (ASHA)',
    pathway: 'PREGNANCY',
    severity: 'WARNING',
    reason: 'High blood pressure reading 142/92 on antenatal week 34 checkup. Trace pedal edema.',
    status: 'REFERRED',
    createdAt: 'Yesterday',
    resolutionNotes: 'Referred to Rural Hospital Shirur for obstetrician evaluation and lab protein test.',
    referralFacility: 'Rural Hospital Shirur',
  },
];

export const AnmDashboardPage: React.FC = () => {
  const [escalations, setEscalations] = useState<EscalationRecord[]>(INITIAL_ESCALATIONS);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeReviewEscalation, setActiveReviewEscalation] = useState<EscalationRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED'>('REFERRED');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>('Primary Health Centre (PHC) Koregaon Bhima');

  useEffect(() => {
    communityApi
      .getEscalations('ANM')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: EscalationRecord[] = data.map((d: any) => ({
            id: d.id,
            patientId: d.patientId,
            patientName: d.patientName || d.patientId,
            village: d.village || 'Shirur Taluka',
            ashaWorker: d.raisedBy || 'ASHA Worker',
            pathway: d.pathway || 'POST_SURGERY',
            severity: d.severity || 'URGENT',
            reason: d.reason,
            status: d.status || 'RAISED',
            createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent',
            resolutionNotes: d.resolutionNotes || d.notes,
            referralFacility: d.referralFacility,
          }));
          setEscalations(mapped);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch escalations from backend, keeping cached state:', err);
      });
  }, []);

  const filteredEscalations = escalations.filter((e) => {
    if (selectedStatus === 'ALL') return true;
    return e.status === selectedStatus;
  });

  const handleResolveEscalation = async () => {
    if (!activeReviewEscalation) return;

    try {
      await communityApi.resolveEscalation(activeReviewEscalation.id, {
        status: resolutionAction,
        resolutionNotes: actionNotes,
        referralFacility: resolutionAction === 'REFERRED' ? selectedFacility : undefined,
      });
    } catch (err) {
      console.warn('Could not update escalation on backend (offline):', err);
    }

    setEscalations((prev) =>
      prev.map((e) =>
        e.id === activeReviewEscalation.id
          ? {
              ...e,
              status: resolutionAction,
              resolutionNotes: actionNotes,
              referralFacility: resolutionAction === 'REFERRED' ? selectedFacility : undefined,
            }
          : e
      )
    );
    setActiveReviewEscalation(null);
    setActionNotes('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/60 text-purple-200 text-[11px] font-semibold tracking-wide uppercase border border-purple-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>ANM Supervisory Portal (PRD v3.0)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Escalation & Referral Review
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl leading-relaxed">
            Auxiliary Nurse Midwife (ANM) Sub-Centre Headquarters • Review high-risk clinical escalations raised by village ASHAs, assign home visits, and confirm hospital referrals.
          </p>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-2">
          <div className="bg-rose-500/20 backdrop-blur-sm px-4 py-3 rounded-2xl border border-rose-400/30 text-center">
            <span className="text-2xl font-black text-rose-300">
              {escalations.filter((e) => e.status === 'RAISED').length}
            </span>
            <span className="text-[10px] text-rose-200 uppercase font-bold block">Pending</span>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm px-4 py-3 rounded-2xl border border-emerald-400/30 text-center">
            <span className="text-2xl font-black text-emerald-300">
              {escalations.filter((e) => e.status === 'RESOLVED' || e.status === 'REFERRED').length}
            </span>
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Actioned</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-card overflow-x-auto text-xs">
        {['ALL', 'RAISED', 'ACKNOWLEDGED', 'REFERRED', 'RESOLVED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedStatus === status
                ? 'bg-purple-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status === 'ALL' ? 'All Escalations' : status}
          </button>
        ))}
      </div>

      {/* Escalation Cards List */}
      <div className="space-y-4">
        {filteredEscalations.map((item) => {
          const isEmergency = item.severity === 'EMERGENCY';
          const isUrgent = item.severity === 'URGENT';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 border shadow-card transition space-y-4 ${
                isEmergency
                  ? 'border-rose-400 bg-rose-50/20'
                  : isUrgent
                  ? 'border-amber-400 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isEmergency
                          ? 'bg-rose-100 text-rose-800'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Raised {item.createdAt}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      Status: {item.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-1">{item.patientName}</h3>
                  <p className="text-xs text-slate-500">
                    {item.village} • Raised by: <strong>{item.ashaWorker}</strong> • {item.pathway}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveReviewEscalation(item);
                    setActionNotes(item.resolutionNotes || '');
                  }}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Review & Action
                </button>
              </div>

              {/* Clinical Reason */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Clinical Concern from ASHA:
                </span>
                <p className="text-slate-800 font-medium">{item.reason}</p>
              </div>

              {/* Resolution Info if actioned */}
              {item.resolutionNotes && (
                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-purple-900 uppercase block">
                    ANM Supervisory Decision:
                  </span>
                  <p className="text-slate-700 italic">"{item.resolutionNotes}"</p>
                  {item.referralFacility && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-950 pt-1">
                      <Building2 className="w-3.5 h-3.5 text-purple-700" />
                      <span>Referred to: {item.referralFacility}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Ribbon */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <a
                    href="tel:108"
                    className="flex items-center gap-1 text-rose-700 hover:underline font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call 108 Ambulance</span>
                  </a>
                  <a
                    href="tel:104"
                    className="flex items-center gap-1 text-sky-700 hover:underline font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call 104 Helpline</span>
                  </a>
                </div>

                <button
                  onClick={() => {
                    setActiveReviewEscalation(item);
                    setActionNotes(item.resolutionNotes || '');
                  }}
                  className="text-purple-900 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Take Supervisory Action</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review & Action Modal */}
      {activeReviewEscalation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 uppercase">
                  Supervisory Clinical Decision
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Action Escalation: {activeReviewEscalation.patientName}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeReviewEscalation.village} • Raised by {activeReviewEscalation.ashaWorker}
                </p>
              </div>
              <button
                onClick={() => setActiveReviewEscalation(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-rose-800 block mb-0.5">
                  Clinical Trigger:
                </span>
                <p className="text-rose-950 font-medium">{activeReviewEscalation.reason}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Select Action / Disposition:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ACKNOWLEDGED' as const, label: 'Tele-Consult Patient' },
                    { id: 'VISITED' as const, label: 'Schedule In-Person Visit' },
                    { id: 'REFERRED' as const, label: 'Refer to PHC / Hospital' },
                    { id: 'RESOLVED' as const, label: 'Issue Resolved & Safe' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setResolutionAction(act.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        resolutionAction === act.id
                          ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {resolutionAction === 'REFERRED' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Select Referral Facility:
                  </label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Primary Health Centre (PHC) Koregaon Bhima">
                      Primary Health Centre (PHC) Koregaon Bhima
                    </option>
                    <option value="Rural Hospital Shirur (Sub-District)">
                      Rural Hospital Shirur (Sub-District)
                    </option>
                    <option value="District Hospital Aundh, Pune">
                      District Hospital Aundh, Pune
                    </option>
                    <option value="Sassoon General Hospital, Pune (Tertiary)">
                      Sassoon General Hospital, Pune (Tertiary)
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Supervisory Clinical Notes & Instructions:
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  placeholder="E.g., Advised patient to report to PHC by 10 AM. ASHA Sunita to accompany with discharge slip."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setActiveReviewEscalation(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveEscalation}
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-bold shadow-sm"
                >
                  Confirm & Save Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
