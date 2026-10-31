import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Phone,
  Building2,
  UserCheck,
  ChevronRight,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  HeartPulse,
  X,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { communityApi } from '@/api/community';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/services/i18n';

export interface EscalationRecord {
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

/**
 * Authentic Punjab Escalations — Pre-configured for Punjab Public Health District Testing.
 * Displayed ONLY when demo mode is active or user explicitly clicks "Load Punjab Demo Escalations".
 */
export const PUNJAB_DEMO_ESCALATIONS: EscalationRecord[] = [
  {
    id: 'esc-pb-01',
    patientId: 'patient-balwinder-02',
    patientName: 'Balwinder Singh',
    village: 'Dehlon Rural, Ludhiana',
    ashaWorker: 'Harjit Kaur (ASHA)',
    pathway: 'DIABETES',
    severity: 'EMERGENCY',
    reason: 'Fasting Blood Sugar > 245 mg/dL with persistent nausea, confusion, and 3 missed insulin doses.',
    status: 'RAISED',
    createdAt: '1 hour ago',
  },
  {
    id: 'esc-pb-02',
    patientId: 'patient-gurpreet-01',
    patientName: 'Gurpreet Kaur',
    village: 'Sahnewal Khurd, Ludhiana',
    ashaWorker: 'Harjit Kaur (ASHA)',
    pathway: 'POST_SURGERY',
    severity: 'URGENT',
    reason: 'Temperature 101.4°F on post-cholecystectomy Day 4. Incision site erythema and missed Cefuroxime antibiotic.',
    status: 'ACKNOWLEDGED',
    createdAt: '3 hours ago',
    resolutionNotes: 'Advised ASHA Harjit Kaur to supervise evening antibiotic dose and perform antiseptic povidone-iodine dressing. Tele-check with CHC Sahnewal Medical Officer scheduled.',
  },
  {
    id: 'esc-pb-03',
    patientId: 'patient-sukhwinder-05',
    patientName: 'Sukhwinder Kaur',
    village: 'Gill Village, Ludhiana',
    ashaWorker: 'Harjit Kaur (ASHA)',
    pathway: 'PREGNANCY',
    severity: 'WARNING',
    reason: 'Elevated blood pressure reading 142/92 mmHg on antenatal week 34 checkup. Trace pedal edema reported.',
    status: 'REFERRED',
    createdAt: 'Yesterday',
    resolutionNotes: 'Referred to Civil Hospital Ludhiana for obstetrician ultrasound evaluation and urinary protein analysis.',
    referralFacility: 'Civil Hospital Ludhiana (District Hospital)',
  },
];

const PUNJAB_REFERRAL_FACILITIES = [
  'Civil Hospital Ludhiana (District Hospital)',
  'Community Health Centre (CHC) Sahnewal',
  'Primary Health Centre (PHC) Dehlon',
  'Sub-Divisional Hospital (SDH) Jagraon',
  'Aam Aadmi Clinic (AAC) Gill',
  'Civil Hospital Jalandhar',
  'District Hospital SAS Nagar (Mohali)',
];

export const AnmDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDemoMode } = useAuthStore();

  // Strict rule: No dummy data unless demoMode is active
  const [escalations, setEscalations] = useState<EscalationRecord[]>(() =>
    isDemoMode ? PUNJAB_DEMO_ESCALATIONS : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isDemoMode);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeReviewEscalation, setActiveReviewEscalation] = useState<EscalationRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<
    'ACKNOWLEDGED' | 'VISITED' | 'RESOLVED' | 'REFERRED'
  >('REFERRED');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>(PUNJAB_REFERRAL_FACILITIES[0]);

  useEffect(() => {
    setIsLoading(true);
    communityApi
      .getEscalations('ANM')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: EscalationRecord[] = data.map((d: any) => ({
            id: d.id,
            patientId: d.patientId,
            patientName: d.patientName || d.patientId,
            village: d.village || 'Ludhiana District',
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
        } else if (isDemoMode) {
          setEscalations(PUNJAB_DEMO_ESCALATIONS);
        }
      })
      .catch((err) => {
        console.warn('Backend escalations query failed, using demo if active:', err);
        if (isDemoMode) {
          setEscalations(PUNJAB_DEMO_ESCALATIONS);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isDemoMode]);

  const handleLoadDemoEscalations = () => {
    setEscalations(PUNJAB_DEMO_ESCALATIONS);
  };

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
      console.warn('Backend resolve call failed, updating local state:', err);
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
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header — Deep Navy with Red accents */}
      <div className="bg-[#17243A] text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#25364F]">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25364F] text-slate-200 text-xs font-semibold tracking-wide border border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C8103E]" />
            <span>ANM Supervisory Portal • Punjab Public Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t('anmTitle', 'ANM Clinical Supervisory & Escalation Triage')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Manpreet Sister Sandhu (ANM Supervisor ID: PB-ANM-1092) • CHC Sahnewal Sector / Civil Hospital Ludhiana. Review red-flag clinical escalations reported by village ASHAs, conduct triage, issue supervisory directions, and confirm hospital referrals.
          </p>
        </div>

        {/* 4-Card Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-[#25364F] px-4 py-3 rounded-xl border border-slate-700/80 text-center">
            <span className="text-2xl font-black text-white">{escalations.length}</span>
            <span className="text-[10px] text-slate-300 uppercase font-bold block mt-0.5">Total Queue</span>
          </div>
          <div className="bg-rose-950/40 px-4 py-3 rounded-xl border border-rose-800/40 text-center">
            <span className="text-2xl font-black text-rose-400">
              {escalations.filter((e) => e.status === 'RAISED').length}
            </span>
            <span className="text-[10px] text-rose-300 uppercase font-bold block mt-0.5">Action Due</span>
          </div>
          <div className="bg-amber-950/40 px-4 py-3 rounded-xl border border-amber-800/40 text-center">
            <span className="text-2xl font-black text-amber-400">
              {escalations.filter((e) => e.status === 'ACKNOWLEDGED' || e.status === 'VISITED').length}
            </span>
            <span className="text-[10px] text-amber-300 uppercase font-bold block mt-0.5">In Review</span>
          </div>
          <div className="bg-emerald-950/40 px-4 py-3 rounded-xl border border-emerald-800/40 text-center">
            <span className="text-2xl font-black text-emerald-400">
              {escalations.filter((e) => e.status === 'RESOLVED' || e.status === 'REFERRED').length}
            </span>
            <span className="text-[10px] text-emerald-300 uppercase font-bold block mt-0.5">Actioned</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto text-xs">
        {['ALL', 'RAISED', 'ACKNOWLEDGED', 'VISITED', 'REFERRED', 'RESOLVED'].map((status) => {
          const count =
            status === 'ALL'
              ? escalations.length
              : escalations.filter((e) => e.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatus === status
                  ? 'bg-[#17243A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{status === 'ALL' ? t('allEscalations', 'All Escalations') : status}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Escalation Cards List or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#C8103E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading escalation queue...</p>
        </div>
      ) : filteredEscalations.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {t('emptyEscalationsTitle', 'No Pending Escalations')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'emptyEscalationsDesc',
                'All patients across your sub-centre sector are currently stable with no unresolved escalations.'
              )}
            </p>
          </div>
          <button
            onClick={handleLoadDemoEscalations}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('loadDemoEscalations', 'Load Punjab Demo Escalations')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEscalations.map((item) => {
            const isEmergency = item.severity === 'EMERGENCY';
            const isUrgent = item.severity === 'URGENT';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-6 border shadow-sm transition space-y-4 ${
                  isEmergency
                    ? 'border-rose-300 bg-rose-50/20'
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-[#E2E8F0]'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        isEmergency
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{item.severity}</span>
                    </span>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.patientName}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.village}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{item.pathway}</span>
                        <span>•</span>
                        <span>Raised by {item.ashaWorker}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      item.status === 'RAISED'
                        ? 'bg-rose-100 text-rose-800'
                        : item.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'REFERRED'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Clinical Concern from ASHA */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Clinical Concern Reported by ASHA:
                  </span>
                  <p className="text-slate-900 font-semibold leading-relaxed">{item.reason}</p>
                </div>

                {/* ANM Supervisory Decision if actioned */}
                {item.resolutionNotes && (
                  <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-[#17243A] uppercase block">
                      ANM Supervisory Action & Notes:
                    </span>
                    <p className="text-slate-800 italic font-medium">"{item.resolutionNotes}"</p>
                    {item.referralFacility && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#C8103E] pt-1">
                        <Building2 className="w-4 h-4" />
                        <span>Referred Hospital: {item.referralFacility}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <a
                      href="tel:108"
                      className="flex items-center gap-1.5 text-[#C8103E] hover:underline font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('call108', 'Call 108 Ambulance')}</span>
                    </a>
                    <a
                      href="tel:104"
                      className="flex items-center gap-1.5 text-sky-700 hover:underline font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call 104 Medical Helpline</span>
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      setActiveReviewEscalation(item);
                      setActionNotes(item.resolutionNotes || '');
                      if (item.referralFacility) {
                        setSelectedFacility(item.referralFacility);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17243A] hover:bg-[#25364F] text-white rounded-xl font-bold transition shadow-sm"
                  >
                    <span>{t('takeSupervisoryAction', 'Review & Take Action')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Action Modal */}
      {activeReviewEscalation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 uppercase">
                  Supervisory Decision • Sub-Centre HQ
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Action Escalation: {activeReviewEscalation.patientName}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeReviewEscalation.village} • Raised by {activeReviewEscalation.ashaWorker}
                </p>
              </div>
              <button
                onClick={() => setActiveReviewEscalation(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-rose-800 block mb-0.5">
                  Clinical Danger Trigger:
                </span>
                <p className="text-rose-950 font-bold">{activeReviewEscalation.reason}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Select Action / Disposition:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ACKNOWLEDGED' as const, label: 'Tele-Consult Patient' },
                    { id: 'VISITED' as const, label: 'Schedule In-Person Visit' },
                    { id: 'REFERRED' as const, label: 'Refer to Hospital' },
                    { id: 'RESOLVED' as const, label: 'Issue Resolved & Safe' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setResolutionAction(act.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        resolutionAction === act.id
                          ? 'border-[#C8103E] bg-rose-50 text-rose-950 ring-2 ring-rose-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {resolutionAction === 'REFERRED' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Select Punjab Referral Health Facility:
                  </label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                  >
                    {PUNJAB_REFERRAL_FACILITIES.map((facility) => (
                      <option key={facility} value={facility}>
                        {facility}
                      </option>
                    ))}
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
                  placeholder="Provide instructions for ASHA, patient home care, or transport logistics..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReviewEscalation(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveEscalation}
                className="px-5 py-2.5 rounded-xl bg-[#C8103E] hover:bg-rose-800 text-white text-xs font-bold shadow-sm transition"
              >
                {t('closeEscalation', 'Confirm Supervisory Decision')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
