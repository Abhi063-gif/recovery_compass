import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Pill,
  Activity,
  Phone,
  MessageSquare,
  Shield,
  Search,
  Filter,
  Plus,
  Send,
  Eye,
  FileCheck,
  HeartPulse,
  Clock,
  Sparkles,
} from 'lucide-react';
import { speakText } from '@/services/i18n';
import { communityApi, CaseloadPatient, LogAshaVisitDto, EscalateRiskDto } from '@/api/community';
import { offlineStorage } from '@/services/offlineSync';

const INITIAL_CASELOAD: CaseloadPatient[] = [
  {
    patientId: 'patient-sharda-01',
    name: 'Sharda Patil',
    age: 48,
    gender: 'Female',
    village: 'Koregaon Bhima, Shirur',
    pathway: 'POST_SURGERY',
    dischargeDate: '2026-04-12',
    currentDay: 4,
    riskTier: 'AMBER',
    riskScore: 65,
    riskFactors: ['1 Missed Antibiotic Dose', 'Temperature 101.2°F reported', 'Incision redness'],
    lastVisitDate: '2026-04-14',
    nextScheduledVisit: '2026-04-16',
    medicationAdherenceRate: 85,
    missedDosesCount: 1,
    recentRedFlagsCount: 1,
    isAshaVerified: true,
  },
  {
    patientId: 'patient-ramesh-02',
    name: 'Ramesh Jadhav',
    age: 62,
    gender: 'Male',
    village: 'Wagholi Rural, Haveli',
    pathway: 'DIABETES',
    dischargeDate: '2026-04-09',
    currentDay: 7,
    riskTier: 'RED',
    riskScore: 88,
    riskFactors: ['High Fasting Blood Sugar (245 mg/dL)', 'Missed 3 Insulin Doses', 'Foot tingling'],
    lastVisitDate: '2026-04-12',
    nextScheduledVisit: 'Today',
    medicationAdherenceRate: 58,
    missedDosesCount: 3,
    recentRedFlagsCount: 2,
    isAshaVerified: false,
  },
  {
    patientId: 'patient-anita-03',
    name: 'Anita Shinde',
    age: 24,
    gender: 'Female',
    village: 'Sanaswadi, Shirur',
    pathway: 'PREGNANCY',
    dischargeDate: '2026-04-13',
    currentDay: 3,
    riskTier: 'GREEN',
    riskScore: 12,
    riskFactors: ['Postnatal Day 3', 'Normal BP (118/76)'],
    lastVisitDate: '2026-04-15',
    nextScheduledVisit: '2026-04-19',
    medicationAdherenceRate: 100,
    missedDosesCount: 0,
    recentRedFlagsCount: 0,
    isAshaVerified: true,
  },
  {
    patientId: 'patient-tukaram-04',
    name: 'Tukaram Kadam',
    age: 55,
    gender: 'Male',
    village: 'Pabal, Khed',
    pathway: 'TUBERCULOSIS',
    dischargeDate: '2026-04-04',
    currentDay: 12,
    riskTier: 'GREEN',
    riskScore: 20,
    riskFactors: ['DOTS Verified', 'Daily Dose Supervised'],
    lastVisitDate: '2026-04-14',
    nextScheduledVisit: '2026-04-17',
    medicationAdherenceRate: 100,
    missedDosesCount: 0,
    recentRedFlagsCount: 0,
    isAshaVerified: true,
  },
];

export const AshaDashboardPage: React.FC = () => {
  const [caseload, setCaseload] = useState<CaseloadPatient[]>(INITIAL_CASELOAD);
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
    communityApi
      .getCaseload()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCaseload(data);
          offlineStorage.saveCaseload(data).catch(() => {});
        }
      })
      .catch(async (err) => {
        console.warn('Backend caseload unavailable, loading from offlineStorage:', err);
        const cached = await offlineStorage.getCaseload();
        if (Array.isArray(cached) && cached.length > 0) {
          setCaseload(cached);
        }
      });
  }, []);

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
      notes: `Escalated by ASHA for patient ${activeEscalatePatient.name} in ${activeEscalatePatient.village}`,
    };

    let isOffline = false;
    try {
      await communityApi.escalate(escalateDto);
      setEscalationSuccessMsg(
        `Escalation lodged with ${escalateTargetRole}. An offline SMS link has also been generated.`
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
        `Offline: Escalation saved to device outbox. Please use the cellular SMS link below to alert the ${escalateTargetRole} directly.`
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

  const handleSendEscalation = handleEscalate;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Community Health Worker Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ASHA Worker Caseload & Home Visits
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
            Sunita Kamble (ASHA ID: MH-PUN-0842) • Shirur Taluka, Pune District. Verify medications, log home visits, and escalate clinical risks to ANM.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-2xl font-black text-white">{caseload.length}</span>
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Assigned</span>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-sm px-4 py-3 rounded-2xl border border-rose-400/30 text-center">
            <span className="text-2xl font-black text-rose-300">
              {caseload.filter((p) => p.riskTier === 'RED').length}
            </span>
            <span className="text-[10px] text-rose-200 uppercase font-bold block">High Risk</span>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-sm px-4 py-3 rounded-2xl border border-amber-400/30 text-center">
            <span className="text-2xl font-black text-amber-300">
              {caseload.filter((p) => p.riskTier === 'AMBER').length}
            </span>
            <span className="text-[10px] text-amber-200 uppercase font-bold block">Amber</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, village, condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        {/* Risk Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'RED', 'AMBER', 'GREEN'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedRiskFilter(tier)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedRiskFilter === tier
                  ? tier === 'RED'
                    ? 'bg-rose-600 text-white'
                    : tier === 'AMBER'
                    ? 'bg-amber-500 text-white'
                    : tier === 'GREEN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier === 'ALL' ? 'All Patients' : `${tier} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Caseload Patient Cards */}
      <div className="space-y-4">
        {filteredCaseload.map((patient) => {
          const isRed = patient.riskTier === 'RED';
          const isAmber = patient.riskTier === 'AMBER';

          return (
            <div
              key={patient.patientId}
              className={`bg-white rounded-3xl p-6 border shadow-card transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isRed
                  ? 'border-rose-300 bg-rose-50/10'
                  : isAmber
                  ? 'border-amber-300 bg-amber-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3 flex-1">
                {/* Patient Header */}
                <div className="flex items-start justify-between sm:justify-start sm:gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                      <span className="text-xs text-slate-400 font-medium">
                        ({patient.age}y / {patient.gender})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {patient.village} • Post-Discharge Day {patient.currentDay} ({patient.pathway})
                    </p>
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isRed
                        ? 'bg-rose-100 text-rose-800'
                        : isAmber
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Score: {patient.riskScore} ({patient.riskTier})
                  </span>
                </div>

                {/* Risk Factors */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Triggers:</span>
                  {patient.riskFactors.map((factor, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium ${
                        isRed
                          ? 'bg-rose-100/70 text-rose-800'
                          : isAmber
                          ? 'bg-amber-100/70 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Adherence & Visit Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-sky-600" />
                    Adherence: <strong>{patient.medicationAdherenceRate}%</strong>
                    {patient.missedDosesCount > 0 && (
                      <span className="text-rose-600 font-bold ml-1">
                        ({patient.missedDosesCount} missed)
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Last Visit: {patient.lastVisitDate || 'None yet'}
                  </span>
                  {patient.isAshaVerified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ASHA Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => setActiveVisitPatient(patient)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Log Home Visit & Meds
                </button>

                <button
                  onClick={() => {
                    setActiveEscalatePatient(patient);
                    setEscalateReason(patient.riskFactors.join('. '));
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    isRed
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Escalate to ANM
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Home Visit & Medication Verification Checklist */}
      {activeVisitPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  ASHA Visit Checklist (PRD C3)
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Home Visit: {activeVisitPatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Day {activeVisitPatient.currentDay} • {activeVisitPatient.village}
                </p>
              </div>
              <button
                onClick={() => setActiveVisitPatient(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Medication Verification */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  Medication Verification (PRD C3)
                </h4>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={medsPresentInBlister}
                    onChange={(e) => setMedsPresentInBlister(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Medicines physically present in strip / blister pack</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={takenAsPerPlan}
                    onChange={(e) => setTakenAsPerPlan(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Doses taken on schedule as per discharge prescription</span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Remaining Pill Count
                    </label>
                    <input
                      type="number"
                      value={remainingPillsCount}
                      onChange={(e) => setRemainingPillsCount(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Side Effects Noted?
                    </label>
                    <input
                      type="text"
                      value={reportedSideEffects}
                      onChange={(e) => setReportedSideEffects(e.target.value)}
                      placeholder="e.g. Mild nausea, dizziness"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Vitals Entry */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-3">
                <h4 className="font-bold text-sky-950 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-sky-600" />
                  Vitals & Clinical Observation
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      BP (mmHg)
                    </label>
                    <input
                      type="text"
                      value={vitalsBp}
                      onChange={(e) => setVitalsBp(e.target.value)}
                      placeholder="120/80"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Sugar (mg/dL)
                    </label>
                    <input
                      type="text"
                      value={vitalsSugar}
                      onChange={(e) => setVitalsSugar(e.target.value)}
                      placeholder="e.g. 110"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Temp (°F)
                    </label>
                    <input
                      type="text"
                      value={vitalsTemp}
                      onChange={(e) => setVitalsTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Visit Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  ASHA Visit Remarks
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Patient instructed on fluid intake; wound dressing checked and intact."
                  rows={2}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setActiveVisitPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveVisit(activeVisitPatient.patientId)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save & Mark ASHA Verified
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Risk Escalation to ANM / PHC */}
      {activeEscalatePatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                  Clinical Risk Escalation (PRD C5)
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Escalate: {activeEscalatePatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: Auxiliary Nurse Midwife (ANM) / PHC Medical Officer
                </p>
              </div>
              <button
                onClick={() => setActiveEscalatePatient(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {escalationSuccessMsg ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">{escalationSuccessMsg}</p>
                {/* Always make prefilled SMS button available */}
                <div className="pt-2">
                  <a
                    href={`sms:?body=${encodeURIComponent(
                      `[RECOVERY COMPASS ESCALATION] Patient: ${activeEscalatePatient.name} (${activeEscalatePatient.village}). Severity: ${escalateSeverity}. Reason: ${escalateReason || 'Urgent clinical review requested'}.`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Cellular SMS to ANM</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Target Role & Severity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Escalate To:
                    </label>
                    <select
                      value={escalateTargetRole}
                      onChange={(e) => setEscalateTargetRole(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="ANM">ANM (Supervisor)</option>
                      <option value="PHC_MEDICAL_OFFICER">PHC Medical Officer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Urgency:
                    </label>
                    <select
                      value={escalateSeverity}
                      onChange={(e) => setEscalateSeverity(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                    >
                      <option value="WARNING">Warning (Review in 24h)</option>
                      <option value="URGENT">Urgent (Review Today)</option>
                      <option value="EMERGENCY">Emergency (Immediate)</option>
                    </select>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Clinical Trigger / Escalation Reason
                  </label>
                  <textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    rows={3}
                    placeholder="Patient shows high fever, missing essential medicines, wound discharge..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Free SMS Fallback Button (PRD 18 & 129) */}
                <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Offline Cellular SMS</span>
                    <span className="text-[11px] text-slate-500">
                      Send prefilled SMS from user SIM with zero API fees
                    </span>
                  </div>
                  <a
                    href={`sms:?body=${encodeURIComponent(
                      `[RECOVERY COMPASS ESCALATION] Patient: ${activeEscalatePatient.name} (${activeEscalatePatient.village}). Severity: ${escalateSeverity}. Reason: ${escalateReason || 'Urgent review requested'}.`
                    )}`}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-slate-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open SMS
                  </a>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setActiveEscalatePatient(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEscalate}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Submit Escalation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
