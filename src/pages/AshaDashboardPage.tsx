import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Pill,
  MessageSquare,
  Shield,
  Search,
  FileCheck,
  HeartPulse,
  User,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  ArrowRight,
  Activity,
  X,
} from 'lucide-react';
import { communityApi, CaseloadPatient, LogAshaVisitDto, EscalateRiskDto } from '@/api/community';
import { offlineStorage } from '@/services/offlineSync';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/services/i18n';

/**
 * Authentic Punjab Caseload — Pre-configured for Punjab Public Health District Testing.
 * Displayed ONLY when demo mode is active or user explicitly clicks "Load Punjab Demo Caseload".
 */
export const PUNJAB_DEMO_CASELOAD: CaseloadPatient[] = [
  {
    patientId: 'patient-gurpreet-01',
    name: 'Gurpreet Kaur',
    age: 48,
    gender: 'Female',
    village: 'Sahnewal Khurd, Ludhiana',
    pathway: 'POST_SURGERY',
    dischargeDate: '2026-10-27',
    currentDay: 4,
    riskTier: 'AMBER',
    riskScore: 65,
    riskFactors: ['1 Missed Cefuroxime Dose', 'Temperature 101.2°F reported', 'Surgical incision mild erythema'],
    lastVisitDate: '2026-10-29',
    nextScheduledVisit: '2026-10-31',
    medicationAdherenceRate: 85,
    missedDosesCount: 1,
    recentRedFlagsCount: 1,
    isAshaVerified: true,
  },
  {
    patientId: 'patient-balwinder-02',
    name: 'Balwinder Singh',
    age: 62,
    gender: 'Male',
    village: 'Dehlon Rural, Ludhiana',
    pathway: 'DIABETES',
    dischargeDate: '2026-10-24',
    currentDay: 7,
    riskTier: 'RED',
    riskScore: 88,
    riskFactors: ['High Fasting Blood Sugar (245 mg/dL)', 'Missed 3 Insulin Doses', 'Foot tingling & dizziness'],
    lastVisitDate: '2026-10-28',
    nextScheduledVisit: 'Today',
    medicationAdherenceRate: 58,
    missedDosesCount: 3,
    recentRedFlagsCount: 2,
    isAshaVerified: false,
  },
  {
    patientId: 'patient-manpreet-03',
    name: 'Manpreet Kaur',
    age: 24,
    gender: 'Female',
    village: 'Gill Village, Ludhiana',
    pathway: 'PREGNANCY',
    dischargeDate: '2026-10-28',
    currentDay: 3,
    riskTier: 'GREEN',
    riskScore: 12,
    riskFactors: ['Postnatal Day 3', 'Normal BP (118/76 mmHg)', 'Infant breastfeeding well'],
    lastVisitDate: '2026-10-30',
    nextScheduledVisit: '2026-11-02',
    medicationAdherenceRate: 100,
    missedDosesCount: 0,
    recentRedFlagsCount: 0,
    isAshaVerified: true,
  },
  {
    patientId: 'patient-harbhajan-04',
    name: 'Harbhajan Singh',
    age: 55,
    gender: 'Male',
    village: 'Majri Village, Ludhiana',
    pathway: 'TUBERCULOSIS',
    dischargeDate: '2026-10-19',
    currentDay: 12,
    riskTier: 'GREEN',
    riskScore: 18,
    riskFactors: ['DOTS Verified Daily', 'No hemoptysis', 'Weight gain 1.2 kg'],
    lastVisitDate: '2026-10-30',
    nextScheduledVisit: '2026-11-01',
    medicationAdherenceRate: 100,
    missedDosesCount: 0,
    recentRedFlagsCount: 0,
    isAshaVerified: true,
  },
];

export const AshaDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDemoMode } = useAuthStore();

  // Strict rule: No dummy data unless demoMode is active
  const [caseload, setCaseload] = useState<CaseloadPatient[]>(() => (isDemoMode ? PUNJAB_DEMO_CASELOAD : []));
  const [isLoading, setIsLoading] = useState<boolean>(!isDemoMode);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Visit Checklist Modal state
  const [activeVisitPatient, setActiveVisitPatient] = useState<CaseloadPatient | null>(null);
  const [medsPresentInBlister, setMedsPresentInBlister] = useState(true);
  const [takenAsPerPlan, setTakenAsPerPlan] = useState(true);
  const [remainingPillsCount, setRemainingPillsCount] = useState<number>(14);
  const [reportedSideEffects, setReportedSideEffects] = useState<string>('None');
  const [vitalsBp, setVitalsBp] = useState<string>('120/80');
  const [vitalsSugar, setVitalsSugar] = useState<string>('');
  const [vitalsTemp, setVitalsTemp] = useState<string>('98.6');
  const [visitNotes, setVisitNotes] = useState<string>('');

  // Escalation Modal state
  const [activeEscalatePatient, setActiveEscalatePatient] = useState<CaseloadPatient | null>(null);
  const [escalateSeverity, setEscalateSeverity] = useState<'WARNING' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [escalateReason, setEscalateReason] = useState<string>('');
  const [escalateTargetRole, setEscalateTargetRole] = useState<'ANM' | 'PHC_MEDICAL_OFFICER'>('ANM');
  const [escalationSuccessMsg, setEscalationSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    communityApi
      .getCaseload()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCaseload(data);
          offlineStorage.saveCaseload(data).catch(() => {});
        } else if (isDemoMode) {
          setCaseload(PUNJAB_DEMO_CASELOAD);
        }
      })
      .catch(async (err) => {
        console.warn('Backend caseload unavailable, attempting offline cache:', err);
        const cached = await offlineStorage.getCaseload();
        if (Array.isArray(cached) && cached.length > 0) {
          setCaseload(cached);
        } else if (isDemoMode) {
          setCaseload(PUNJAB_DEMO_CASELOAD);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isDemoMode]);

  const handleLoadDemoCaseload = () => {
    setCaseload(PUNJAB_DEMO_CASELOAD);
  };

  const filteredCaseload = caseload.filter((p) => {
    if (selectedRiskFilter !== 'ALL' && p.riskTier !== selectedRiskFilter) return false;
    if (searchQuery.trim() === '') return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pathway.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSaveVisit = async (patientId: string) => {
    const bpParts = vitalsBp.split('/');
    const visitDto: LogAshaVisitDto = {
      patientId,
      visitDate: new Date().toISOString(),
      medicationVerified: medsPresentInBlister && takenAsPerPlan,
      medicationNotes: `Blister check: ${medsPresentInBlister ? 'Yes' : 'No'}, Taken per plan: ${takenAsPerPlan ? 'Yes' : 'No'}`,
      remainingPillCount: remainingPillsCount,
      sideEffectsReported: reportedSideEffects && reportedSideEffects !== 'None' ? [reportedSideEffects] : [],
      vitals: {
        bloodPressureSystolic: bpParts[0] ? parseInt(bpParts[0], 10) : undefined,
        bloodPressureDiastolic: bpParts[1] ? parseInt(bpParts[1], 10) : undefined,
        bloodGlucoseMgDl: vitalsSugar ? parseFloat(vitalsSugar) : undefined,
        temperatureFahrenheit: vitalsTemp ? parseFloat(vitalsTemp) : undefined,
      },
      notes: visitNotes,
    };

    try {
      await communityApi.logVisit(visitDto);
    } catch (err) {
      console.warn('Offline logging ASHA visit, queueing mutation:', err);
      await offlineStorage.queueMutation({
        id: `visit-${Date.now()}`,
        entity: 'asha_visit',
        action: 'CREATE',
        payload: visitDto,
        clientTimestamp: new Date().toISOString(),
      });
    }

    setCaseload((prev) => {
      const updated = prev.map((p) =>
        p.patientId === patientId
          ? {
              ...p,
              isAshaVerified: true,
              lastVisitDate: new Date().toISOString().split('T')[0],
              riskTier: p.riskTier === 'RED' && takenAsPerPlan ? ('AMBER' as const) : p.riskTier,
            }
          : p
      );
      offlineStorage.saveCaseload(updated).catch(() => {});
      return updated;
    });

    setActiveVisitPatient(null);
  };

  const handleEscalate = async () => {
    if (!activeEscalatePatient) return;

    const escalateDto: EscalateRiskDto = {
      patientId: activeEscalatePatient.patientId,
      targetRole: escalateTargetRole,
      severity: escalateSeverity,
      reason: escalateReason || 'Clinical risk review requested by ASHA worker',
      triggerDetails: activeEscalatePatient.riskFactors.join(', '),
      currentVitalsSummary: `BP: ${vitalsBp}, Temp: ${vitalsTemp}°F`,
      notes: `Escalated by ASHA Harjit Kaur for patient ${activeEscalatePatient.name} in ${activeEscalatePatient.village}`,
    };

    let isOffline = false;
    try {
      await communityApi.escalate(escalateDto);
      setEscalationSuccessMsg(
        `Escalation lodged with ${escalateTargetRole}. Forwarded to ANM Supervisor Manpreet Sister Sandhu (CHC Sahnewal).`
      );
    } catch (err) {
      console.warn('Offline queuing escalation:', err);
      isOffline = true;
      await offlineStorage.queueMutation({
        id: `esc-${Date.now()}`,
        entity: 'escalation',
        action: 'CREATE',
        payload: escalateDto,
        clientTimestamp: new Date().toISOString(),
      });
      setEscalationSuccessMsg(
        `Offline: Escalation saved to phone outbox. It will automatically synchronize when mobile data or Wi-Fi reconnects.`
      );
    }

    setTimeout(() => {
      if (!isOffline) {
        setEscalationSuccessMsg(null);
        setActiveEscalatePatient(null);
        setEscalateReason('');
      }
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header Card — Deep Navy with Red accents */}
      <div className="bg-[#17243A] text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#25364F]">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25364F] text-slate-200 text-xs font-semibold tracking-wide border border-slate-700">
            <Shield className="w-3.5 h-3.5 text-[#C8103E]" />
            <span>Community Health Worker Portal • Punjab Public Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t('ashaTitle', 'ASHA Worker Caseload & Field Monitoring')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Harjit Kaur (ASHA ID: PB-LDH-4412) • Sub-Centre Gill / Sahnewal Block, Ludhiana District. Conduct home visits, verify blister packs, monitor vital signs, and escalate clinical deterioration to ANM supervisor.
          </p>
        </div>

        {/* 4-Card Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-[#25364F] px-4 py-3 rounded-xl border border-slate-700/80 text-center">
            <span className="text-2xl font-black text-white">{caseload.length}</span>
            <span className="text-[10px] text-slate-300 uppercase font-bold block mt-0.5">Total Caseload</span>
          </div>
          <div className="bg-rose-950/40 px-4 py-3 rounded-xl border border-rose-800/40 text-center">
            <span className="text-2xl font-black text-rose-400">
              {caseload.filter((p) => p.riskTier === 'RED').length}
            </span>
            <span className="text-[10px] text-rose-300 uppercase font-bold block mt-0.5">High Risk</span>
          </div>
          <div className="bg-amber-950/40 px-4 py-3 rounded-xl border border-amber-800/40 text-center">
            <span className="text-2xl font-black text-amber-400">
              {caseload.filter((p) => p.riskTier === 'AMBER').length}
            </span>
            <span className="text-[10px] text-amber-300 uppercase font-bold block mt-0.5">Moderate</span>
          </div>
          <div className="bg-emerald-950/40 px-4 py-3 rounded-xl border border-emerald-800/40 text-center">
            <span className="text-2xl font-black text-emerald-400">
              {caseload.filter((p) => p.riskTier === 'GREEN').length}
            </span>
            <span className="text-[10px] text-emerald-300 uppercase font-bold block mt-0.5">Stable</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPatients', 'Search by patient name, village, or condition...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8103E] text-slate-800 font-medium"
          />
        </div>

        {/* Risk Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'RED', 'AMBER', 'GREEN'] as const).map((tier) => {
            const count =
              tier === 'ALL'
                ? caseload.length
                : caseload.filter((p) => p.riskTier === tier).length;
            return (
              <button
                key={tier}
                onClick={() => setSelectedRiskFilter(tier)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedRiskFilter === tier
                    ? tier === 'RED'
                      ? 'bg-rose-700 text-white'
                      : tier === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : tier === 'GREEN'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#17243A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tier === 'ALL' ? t('allRisks', 'All Patients') : tier}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedRiskFilter === tier ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caseload Patient Cards or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#C8103E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading patient caseload...</p>
        </div>
      ) : filteredCaseload.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <HeartPulse className="w-7 h-7 text-[#C8103E]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {t('emptyCaseloadTitle', 'No Patients in Caseload')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? 'No patients matched your search filters.'
                : t(
                    'emptyCaseloadDesc',
                    'There are currently no active post-discharge patients assigned to this village beat.'
                  )}
            </p>
          </div>
          <button
            onClick={handleLoadDemoCaseload}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('loadDemoCaseload', 'Load Punjab Demo Caseload')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCaseload.map((patient) => {
            const isRed = patient.riskTier === 'RED';
            const isAmber = patient.riskTier === 'AMBER';

            return (
              <div
                key={patient.patientId}
                className={`bg-white rounded-2xl p-6 border shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isRed
                    ? 'border-rose-300 bg-rose-50/20'
                    : isAmber
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="space-y-3 flex-1">
                  {/* Patient Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {patient.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                          <span className="text-xs text-slate-500 font-medium">
                            ({patient.age}y / {patient.gender})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {patient.village}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            Day {patient.currentDay} ({patient.pathway})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Badge */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        isRed
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isAmber
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRed ? 'bg-rose-600' : isAmber ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}
                      />
                      <span>{patient.riskTier} RISK</span>
                    </span>
                  </div>

                  {/* Clinical Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-slate-500" />
                      <span>Adherence: {patient.medicationAdherenceRate}%</span>
                    </div>

                    {patient.missedDosesCount > 0 && (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{patient.missedDosesCount} Missed Doses</span>
                      </div>
                    )}

                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Visit: {patient.lastVisitDate}</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Next Due: {patient.nextScheduledVisit}</span>
                    </div>
                  </div>

                  {/* Clinical Risk Factors Callout */}
                  {patient.riskFactors && patient.riskFactors.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {t('riskFactors', 'Clinical Risk Factors')}:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {patient.riskFactors.map((factor, idx) => (
                          <li key={idx} className="font-medium">
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => {
                      setActiveVisitPatient(patient);
                      setVisitNotes('');
                      setMedsPresentInBlister(true);
                      setTakenAsPerPlan(true);
                    }}
                    className="flex-1 md:w-36 py-2.5 px-3 rounded-xl bg-[#17243A] hover:bg-[#25364F] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('logHomeVisit', 'Log Home Visit')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveEscalatePatient(patient);
                      setEscalateReason(
                        patient.riskFactors.length > 0 ? patient.riskFactors.join('; ') : ''
                      );
                      setEscalateSeverity(patient.riskTier === 'RED' ? 'EMERGENCY' : 'URGENT');
                    }}
                    className="flex-1 md:w-36 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#C8103E] border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t('escalateToAnm', 'Escalate to ANM')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Home Visit Modal */}
      {activeVisitPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Field Checklist • ASHA Home Visit
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Visit Record: {activeVisitPatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeVisitPatient.village} • Day {activeVisitPatient.currentDay}
                </p>
              </div>
              <button
                onClick={() => setActiveVisitPatient(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Vitals Input */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Patient Vital Signs
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Temp (°F)
                    </label>
                    <input
                      type="text"
                      value={vitalsTemp}
                      onChange={(e) => setVitalsTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      BP (mmHg)
                    </label>
                    <input
                      type="text"
                      value={vitalsBp}
                      onChange={(e) => setVitalsBp(e.target.value)}
                      placeholder="120/80"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Sugar (mg/dL)
                    </label>
                    <input
                      type="text"
                      value={vitalsSugar}
                      onChange={(e) => setVitalsSugar(e.target.value)}
                      placeholder="Fasting/PP"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                    />
                  </div>
                </div>
              </div>

              {/* Medication Blister Check */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Medication Verification
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={medsPresentInBlister}
                    onChange={(e) => setMedsPresentInBlister(e.target.checked)}
                    className="w-4 h-4 text-[#C8103E] rounded border-slate-300"
                  />
                  <span>All prescribed medicines present in original packaging / strip</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={takenAsPerPlan}
                    onChange={(e) => setTakenAsPerPlan(e.target.checked)}
                    className="w-4 h-4 text-[#C8103E] rounded border-slate-300"
                  />
                  <span>Patient / caregiver confirms doses taken per schedule</span>
                </label>
                <div className="pt-1">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                    Remaining Pills Counted:
                  </label>
                  <input
                    type="number"
                    value={remainingPillsCount}
                    onChange={(e) => setRemainingPillsCount(parseInt(e.target.value, 10) || 0)}
                    className="w-28 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Observation & Notes:
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Record surgical wound condition, mobility, diet, or patient concerns..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveVisitPatient(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveVisit(activeVisitPatient.patientId)}
                className="px-5 py-2.5 rounded-xl bg-[#C8103E] hover:bg-rose-800 text-white text-xs font-bold shadow-sm transition"
              >
                {t('saveVisit', 'Save Visit Record')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation to ANM Modal */}
      {activeEscalatePatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-[#C8103E] uppercase">
                  Clinical Escalation • ASHA to ANM
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Escalate: {activeEscalatePatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Supervisor: Manpreet Sister Sandhu (ANM, CHC Sahnewal)
                </p>
              </div>
              <button
                onClick={() => setActiveEscalatePatient(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {escalationSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="font-bold">{escalationSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Severity Level:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['WARNING', 'URGENT', 'EMERGENCY'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setEscalateSeverity(sev)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                          escalateSeverity === sev
                            ? sev === 'EMERGENCY'
                              ? 'bg-rose-700 text-white border-rose-700'
                              : sev === 'URGENT'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Reason for Escalation / Observed Danger Signs:
                  </label>
                  <textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="Describe symptoms, missed doses, high fever, wound discharge, or altered sensorium..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C8103E]"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Offline / Cellular Fail-Safe:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This escalation queues in your device outbox and forwards instantly to ANM Supervisor Manpreet Sister Sandhu's dashboard at CHC Sahnewal.
                  </p>
                </div>
              </div>
            )}

            {!escalationSuccessMsg && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveEscalatePatient(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEscalate}
                  className="px-5 py-2.5 rounded-xl bg-[#C8103E] hover:bg-rose-800 text-white text-xs font-bold shadow-sm transition"
                >
                  Confirm & Escalate
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
