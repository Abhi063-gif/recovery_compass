import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Flame,
  Thermometer,
  Send,
  History,
  AlertTriangle,
  TrendingDown,
  FileText,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Baby,
  Pill,
  Heart,
  Stethoscope,
  ShieldAlert,
  PhoneCall,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSymptomStore } from '@/stores/useSymptomStore';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/services/i18n';

export const SymptomsPage: React.FC = () => {
  const { history, addLog, fetchHistory } = useSymptomStore();
  const { evaluateSafety } = useSafetyStore();
  const plan = usePlanStore((s) => s.plan);
  const currentUser = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  // Active pathway determination (defaults to 'POST_SURGERY')
  const detectedPathway = (plan?.patientProfile?.pathway || 'POST_SURGERY').toUpperCase();
  const [selectedPathway, setSelectedPathway] = useState<string>(detectedPathway);

  useEffect(() => {
    if (plan?.patientProfile?.pathway) {
      setSelectedPathway(plan.patientProfile.pathway.toUpperCase());
    }
    if (plan?.id) {
      fetchHistory(plan.id);
    }
  }, [plan?.patientProfile?.pathway, plan?.id, fetchHistory]);

  // Section 1: Functional Mobility & Energy
  const [energyLevel, setEnergyLevel] = useState<string>('improving');
  const [ambulationLevel, setAmbulationLevel] = useState<string>('unassisted');

  // Section 2: Wound Triage (Post-Surgery)
  const [woundStatus, setWoundStatus] = useState<string>('clean_dry');
  const [hasCalfPain, setHasCalfPain] = useState<boolean>(false);

  // Section 3: Pain & Relief Assessment
  const [painLevel, setPainLevel] = useState<number>(3);
  const [painLocation, setPainLocation] = useState<string>('incision');
  const [painRelief, setPainRelief] = useState<string>('relieved');

  // Section 4: Gastrointestinal & Tolerability
  const [bowelStatus, setBowelStatus] = useState<string>('normal');
  const [hydrationStatus, setHydrationStatus] = useState<string>('tolerating');
  const [medSideEffects, setMedSideEffects] = useState<string[]>([]);

  // Section 5: Objective Vitals
  const [temperature, setTemperature] = useState<string>('98.6');
  const [bpSystolic, setBpSystolic] = useState<string>('120');
  const [bpDiastolic, setBpDiastolic] = useState<string>('80');
  const [fastingSugar, setFastingSugar] = useState<string>('');
  const [postPrandialSugar, setPostPrandialSugar] = useState<string>('');
  const [fetalKicks, setFetalKicks] = useState<string>('');
  const [hasSevereHeadache, setHasSevereHeadache] = useState<boolean>(false);
  const [hasSevereSwelling, setHasSevereSwelling] = useState<boolean>(false);
  const [hasVisionChanges, setHasVisionChanges] = useState<boolean>(false);
  const [dotsDoseTaken, setDotsDoseTaken] = useState<boolean>(false);
  const [tbSymptoms, setTbSymptoms] = useState<string[]>([]);

  // Additional freeform notes & submission feedback
  const [notes, setNotes] = useState<string>('');
  const [justSaved, setJustSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Temperature Safety Classification
  const tempNumber = parseFloat(temperature) || 98.6;
  const tempStatus = useMemo(() => {
    if (tempNumber < 99.0) {
      return { label: 'Normal Temperature', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (tempNumber <= 100.4) {
      return { label: 'Low-Grade Post-Op Reaction (Monitor)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (tempNumber <= 101.3) {
      return { label: 'Elevated Post-Op Fever (Alert)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    }
    return { label: 'High Postoperative Fever (Emergency Threshold)', color: 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse' };
  }, [tempNumber]);

  // Live Blood Pressure Safety Classification
  const systolicNum = parseInt(bpSystolic, 10);
  const diastolicNum = parseInt(bpDiastolic, 10);
  const bpStatus = useMemo(() => {
    if (isNaN(systolicNum) || isNaN(diastolicNum)) return null;
    if (systolicNum >= 160 || diastolicNum >= 100) {
      return { label: 'Hypertensive Crisis — Seek Immediate Medical Care', color: 'text-rose-700 bg-rose-50 border-rose-300' };
    }
    if (systolicNum >= 140 || diastolicNum >= 90) {
      return { label: 'Stage 2 Hypertension', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (systolicNum >= 130 || diastolicNum >= 80) {
      return { label: 'Stage 1 Hypertension', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    if (systolicNum >= 120 && diastolicNum < 80) {
      return { label: 'Elevated Blood Pressure', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    }
    return { label: 'Optimal Blood Pressure Range', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }, [systolicNum, diastolicNum]);

  // Live Blood Sugar Status (Diabetes Pathway)
  const sugarNum = parseFloat(fastingSugar);
  const sugarStatus = useMemo(() => {
    if (isNaN(sugarNum)) return null;
    if (sugarNum < 70) {
      return { label: 'Hypoglycemia Alert (<70 mg/dL) — Eat sugar / fruit juice immediately', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (sugarNum > 200) {
      return { label: 'Hyperglycemia Alert (>200 mg/dL) — Hydrate and check insulin/meds', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (sugarNum > 140) {
      return { label: 'Borderline High Fasting Sugar (140-200 mg/dL)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { label: 'Normal Fasting Glycemic Target (70-140 mg/dL)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }, [sugarNum]);

  const toggleMedSideEffect = (effect: string) => {
    if (medSideEffects.includes(effect)) {
      setMedSideEffects(medSideEffects.filter((e) => e !== effect));
    } else {
      setMedSideEffects([...medSideEffects, effect]);
    }
  };

  const toggleTbSymptom = (sym: string) => {
    if (tbSymptoms.includes(sym)) {
      setTbSymptoms(tbSymptoms.filter((s) => s !== sym));
    } else {
      setTbSymptoms([...tbSymptoms, sym]);
    }
  };

  // Form Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan?.id) return;
    setIsSubmitting(true);

    try {
      let tempNum = temperature ? parseFloat(temperature) : undefined;
      // Convert Fahrenheit (>50) to Celsius for backend deterministic rule engine
      if (tempNum && tempNum > 50) {
        tempNum = Math.round(((tempNum - 32) * (5 / 9)) * 10) / 10;
      }

      const structuredSummary: string[] = [];
      const extraSymptoms: string[] = [];

      // Caregiver / Frontline Worker attribution
      if (currentUser?.role === 'CAREGIVER') {
        structuredSummary.push(`Recorded by Caregiver (${currentUser.firstName || 'Family'})`);
      } else if (currentUser?.role === 'ASHA' || currentUser?.role === 'ANM') {
        structuredSummary.push(`Recorded by Frontline Health Worker (${currentUser.firstName || currentUser.role})`);
      }

      // Functional Mobility
      structuredSummary.push(`Mobility: ${ambulationLevel}, Energy: ${energyLevel}`);
      if (ambulationLevel === 'bedbound') {
        extraSymptoms.push('Severe immobility / Bedbound');
      }
      if (energyLevel === 'dizzy_standing') {
        extraSymptoms.push('Postural dizziness / weakness');
      }

      // Surgical Wound Check
      if (selectedPathway === 'POST_SURGERY') {
        structuredSummary.push(`Wound Status: ${woundStatus}`);
        if (woundStatus === 'pus_drainage') {
          extraSymptoms.push('Wound pus / discharge', 'Purulent drainage');
        } else if (woundStatus === 'active_leakage') {
          extraSymptoms.push('Active fluid leakage', 'Wound discharge');
        } else if (woundStatus === 'spreading_redness') {
          extraSymptoms.push('Incision redness', 'Spreading erythema');
        }

        if (hasCalfPain) {
          structuredSummary.push('Calf Swelling / Tenderness: YES (DVT risk)');
          extraSymptoms.push('Calf swelling / tenderness (DVT risk)');
        }
      }

      // Pain
      structuredSummary.push(`Pain: ${painLevel}/10 at ${painLocation} (${painRelief})`);
      if (painLevel >= 8) {
        extraSymptoms.push('Severe intractable pain');
      }
      if (painLocation === 'chest') {
        extraSymptoms.push('Chest pain / tightness');
      } else if (painLocation === 'calf') {
        extraSymptoms.push('Calf swelling / tenderness (DVT risk)');
      }

      // Gastrointestinal / Ileus
      structuredSummary.push(`GI: ${bowelStatus}, Hydration: ${hydrationStatus}`);
      if (bowelStatus === 'no_gas_no_stool') {
        extraSymptoms.push('Post-op Ileus / No flatus');
      }
      if (hydrationStatus === 'vomiting') {
        extraSymptoms.push('Persistent nausea / Vomiting');
      }

      // Medication Side Effects
      if (medSideEffects.length > 0) {
        structuredSummary.push(`Med Side-Effects: ${medSideEffects.join(', ')}`);
        extraSymptoms.push(...medSideEffects);
      }

      // Pathway Specifics
      if (selectedPathway === 'HYPERTENSION') {
        if (bpSystolic && bpDiastolic) {
          structuredSummary.push(`BP: ${bpSystolic}/${bpDiastolic} mmHg`);
        }
        if (systolicNum >= 160 || diastolicNum >= 100) {
          extraSymptoms.push('Severe Hypertension (>=160)');
        }
      } else if (selectedPathway === 'DIABETES') {
        if (fastingSugar) structuredSummary.push(`Fasting Sugar: ${fastingSugar} mg/dL`);
        if (postPrandialSugar) structuredSummary.push(`Post-Prandial: ${postPrandialSugar} mg/dL`);
        if (sugarNum < 70) extraSymptoms.push('Hypoglycemia (<70)');
        if (sugarNum > 200) extraSymptoms.push('Hyperglycemia (>200)');
      } else if (selectedPathway === 'PREGNANCY') {
        if (fetalKicks !== '') structuredSummary.push(`Fetal Kicks (2h): ${fetalKicks}`);
        if (fetalKicks !== '' && parseInt(fetalKicks, 10) < 10) extraSymptoms.push('Decreased fetal movement (<10)');
        if (hasSevereHeadache) {
          structuredSummary.push('Severe Persistent Headache: YES');
          extraSymptoms.push('Severe headache');
        }
        if (hasSevereSwelling) {
          structuredSummary.push('Sudden Face/Hand Swelling: YES');
          extraSymptoms.push('Face / Hand swelling');
        }
        if (hasVisionChanges) {
          structuredSummary.push('Visual Disturbances: YES');
          extraSymptoms.push('Blurred vision / spots');
        }
      } else if (selectedPathway === 'TUBERCULOSIS') {
        structuredSummary.push(`DOTS Medication Swallowed: ${dotsDoseTaken ? 'YES' : 'NO'}`);
        if (tbSymptoms.length > 0) {
          structuredSummary.push(`TB Symptoms/Reactions: ${tbSymptoms.join(', ')}`);
          extraSymptoms.push(...tbSymptoms);
        }
      }

      // Add temperature fever alerts if high
      if (tempNum && tempNum >= 38.5) {
        extraSymptoms.push('High Postoperative Fever (>38.5C)');
      } else if (tempNum && tempNum >= 38.0) {
        extraSymptoms.push('Fever');
      }

      const combinedNotes = [
        ...structuredSummary,
        notes.trim(),
      ].filter(Boolean).join(' | ');

      const newEntry = await addLog(plan.id, {
        painScore: painLevel,
        selectedSymptoms: Array.from(new Set(extraSymptoms)),
        temperature: tempNum,
        notes: combinedNotes || undefined,
      });

      await evaluateSafety(plan.id, newEntry);

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3500);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Chart Data derived from history past 7 days
  const dynamicChartData = useMemo(() => {
    if (!history || history.length === 0) {
      return [
        { name: 'Day 1', pain: 6, temp: 98.6 },
        { name: 'Day 2', pain: 5, temp: 98.4 },
        { name: 'Day 3', pain: 4, temp: 98.6 },
        { name: 'Today', pain: painLevel, temp: parseFloat(temperature) || 98.6 },
      ];
    }

    const sorted = [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const recent = sorted.slice(-7);

    return recent.map((item, idx) => {
      const d = new Date(item.timestamp);
      const dayLabel = isNaN(d.getTime())
        ? `Log ${idx + 1}`
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      let tempF: number | undefined = undefined;
      if (item.temperature !== undefined && item.temperature !== null) {
        tempF = item.temperature < 50
          ? Math.round((item.temperature * 1.8 + 32) * 10) / 10
          : Math.round(item.temperature * 10) / 10;
      }

      return {
        name: dayLabel,
        pain: item.painScore ?? 0,
        temp: tempF,
      };
    });
  }, [history, painLevel, temperature]);

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic Post-Discharge Clinical Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('symptomTracker', 'Daily Clinical Recovery Check-in')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalized recovery interview adapting to your medical discharge report, surgical procedure, and medications.
          </p>
        </div>

        {justSaved && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Check-in saved & safety rules verified!</span>
          </div>
        )}
      </div>

      {/* Dynamic Plan & Extracted Clinical Context Banner */}
      {plan && plan.patientProfile && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {plan.patientProfile.surgeryType || 'Post-Discharge Recovery Care'}
              </span>
              <span className="text-[11px] text-slate-500">
                {plan.patientProfile.hospitalName ? `${plan.patientProfile.hospitalName} • ` : ''}
                {plan.patientProfile.surgeonName ? `Dr. ${plan.patientProfile.surgeonName} • ` : ''}
                Recovery Day {plan.currentDay || 1} of {plan.totalDays || 14}
              </span>
            </div>
          </div>
          {plan.medications && plan.medications.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Monitored Meds:</span>
              {plan.medications.slice(0, 4).map((m: any, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-xs">
                  {m.name || m.medicineName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pathway Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Pathway:</span>
        {[
          { id: 'POST_SURGERY', label: 'Post-Surgical Care', icon: Activity },
          { id: 'HYPERTENSION', label: 'Hypertension & Cardiac', icon: Heart },
          { id: 'DIABETES', label: 'Diabetes & Metabolic', icon: Droplets },
          { id: 'PREGNANCY', label: 'Maternal & Postpartum', icon: Baby },
          { id: 'TUBERCULOSIS', label: 'Infectious / TB DOTS', icon: Pill },
        ].map((pw) => {
          const Icon = pw.icon;
          const isSelected = selectedPathway === pw.id;
          return (
            <button
              key={pw.id}
              type="button"
              onClick={() => setSelectedPathway(pw.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{pw.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Dynamic Clinical Interview Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-7"
        >
          {/* SECTION 1: Functional Mobility & Ambulation */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-bold">1</span>
                Functional Mobility & Daily Energy
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Phase-Adaptive Ambulation</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                How is your physical energy and strength today compared to yesterday?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'improving', label: 'Improving & Stronger', color: 'border-emerald-300 hover:bg-emerald-50' },
                  { id: 'same', label: 'About the Same', color: 'border-slate-300 hover:bg-slate-50' },
                  { id: 'dizzy_standing', label: 'Unusually Weak or Dizzy', color: 'border-amber-300 hover:bg-amber-50 text-amber-900' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEnergyLevel(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      energyLevel === opt.id
                        ? 'bg-rose-50 border-rose-600 text-rose-900 font-bold ring-1 ring-rose-300'
                        : `bg-slate-50/50 text-slate-700 ${opt.color}`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                How independently are you able to walk around your room/home today?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'unassisted', label: 'Walking unassisted without dizziness' },
                  { id: 'supported', label: 'Walking with family help / stick' },
                  { id: 'bedbound', label: 'Unable to get out of bed (Severe pain/weakness)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAmbulationLevel(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      ambulationLevel === opt.id
                        ? 'bg-rose-50 border-rose-600 text-rose-900 font-bold ring-1 ring-rose-300'
                        : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Procedure & Pathway Triage */}
          {selectedPathway === 'POST_SURGERY' && (
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  Surgical Incision & Visual Wound Triage
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Infection Prevention
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Please inspect your surgical dressing or incision. What best describes it right now?
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'clean_dry', title: 'Clean, dry, and intact edges', desc: 'No oozing, normal healing', status: 'Normal', badge: 'bg-emerald-50 text-emerald-700' },
                    { id: 'mild_pink', title: 'Mild pinkness or slight itching along edges', desc: 'Expected tissue remodeling without warmth', status: 'Mild', badge: 'bg-sky-50 text-sky-700' },
                    { id: 'spreading_redness', title: 'Angry spreading redness (>2 cm), hot to touch, or swollen', desc: 'Erythema extending beyond incision margins', status: 'Warning', badge: 'bg-amber-50 text-amber-700 font-bold' },
                    { id: 'active_leakage', title: 'Active fluid leakage or dressing soaked through', desc: 'Clear/serous fluid saturating bandage', status: 'Alert', badge: 'bg-amber-50 text-amber-800 font-bold' },
                    { id: 'pus_drainage', title: 'Thick yellow/green foul-smelling pus or opening of incision', desc: 'Wound separation, dehiscence, or infection', status: 'Urgent', badge: 'bg-rose-50 text-rose-700 font-extrabold' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                        woundStatus === item.id
                          ? 'bg-rose-50/60 border-rose-600 ring-1 ring-rose-300'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="woundStatus"
                        value={item.id}
                        checked={woundStatus === item.id}
                        onChange={() => setWoundStatus(item.id)}
                        className="mt-1 text-rose-700 focus:ring-rose-500 w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border border-slate-200 ${item.badge}`}>
                            {item.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* DVT Calf Swelling Assessment */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCalfPain}
                    onChange={(e) => setHasCalfPain(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Calf Swelling / Tenderness Check (DVT Deep Vein Thrombosis Risk)
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Check if you have pain, cramping, redness, or asymmetry in either calf when bending your foot up.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* SECTION 2 (ALTERNATIVE): Hypertension Pathway */}
          {selectedPathway === 'HYPERTENSION' && (
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  Blood Pressure & Cardiac Assessment
                </span>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Target: &lt; 130/80 mmHg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Systolic Pressure (Top Number)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-sky-300 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mmHg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Diastolic Pressure (Bottom Number)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      placeholder="80"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-sky-300 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mmHg</span>
                  </div>
                </div>
              </div>

              {bpStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${bpStatus.color}`}>
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>{bpStatus.label}</span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2 (ALTERNATIVE): Diabetes Pathway */}
          {selectedPathway === 'DIABETES' && (
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  Glycemic Monitoring & Sugar Levels
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target: 70–140 mg/dL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fasting Blood Sugar (Morning)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={fastingSugar}
                      onChange={(e) => setFastingSugar(e.target.value)}
                      placeholder="e.g. 110"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mg/dL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Post-Prandial (2h After Lunch/Dinner)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={postPrandialSugar}
                      onChange={(e) => setPostPrandialSugar(e.target.value)}
                      placeholder="e.g. 138"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mg/dL</span>
                  </div>
                </div>
              </div>

              {sugarStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${sugarStatus.color}`}>
                  <Droplets className="w-4 h-4 shrink-0" />
                  <span>{sugarStatus.label}</span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2 (ALTERNATIVE): Maternal Pathway */}
          {selectedPathway === 'PREGNANCY' && (
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  Fetal Kicks & Pre-Eclampsia Screening
                </span>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Target: ≥ 10 kicks in 2h
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fetal Kick Count (within last 2 hours of quiet rest)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={fetalKicks}
                    onChange={(e) => setFetalKicks(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">kicks / 2h</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-purple-100">
                <span className="block text-[11px] font-bold text-slate-700">Pre-Eclampsia Risk Check:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSevereHeadache}
                      onChange={(e) => setHasSevereHeadache(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Severe headache not relieved by rest</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSevereSwelling}
                      onChange={(e) => setHasSevereSwelling(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Sudden swelling in face, eyelids, or fingers</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={hasVisionChanges}
                      onChange={(e) => setHasVisionChanges(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Visual disturbances (flashing lights, blurriness, dark spots)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2 (ALTERNATIVE): TB DOTS Pathway */}
          {selectedPathway === 'TUBERCULOSIS' && (
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold">2</span>
                  Daily DOTS Compliance & Side-Effect Screening
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  NTEP Protocol
                </span>
              </div>

              <label className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-300 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={dotsDoseTaken}
                  onChange={(e) => setDotsDoseTaken(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">I have swallowed today's prescribed DOTS blister pack dose</span>
                  <span className="text-[11px] text-slate-600">Supervised directly by family member or ASHA treatment supporter.</span>
                </div>
              </label>

              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] font-bold text-slate-700">Adverse Reaction Screening:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'Jaundice / Yellow eyes', label: 'Yellow eyes / dark urine (Hepatotoxicity Alert!)', urgent: true },
                    { id: 'Severe nausea', label: 'Severe nausea / vomiting' },
                    { id: 'Skin rash', label: 'Skin rash or severe itching' },
                    { id: 'Peripheral tingling', label: 'Tingling or burning in feet / hands' },
                    { id: 'Orange urine', label: 'Orange / Red urine (Normal Rifampicin effect)' },
                  ].map((sym) => (
                    <label key={sym.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tbSymptoms.includes(sym.id)}
                        onChange={() => toggleTbSymptom(sym.id)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span className={sym.urgent ? 'text-rose-700 font-bold' : ''}>{sym.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Pain Severity & Analgesia Efficacy */}
          <div className="space-y-4 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-bold">3</span>
                Pain Severity & Medication Relief
              </span>
              <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                painLevel >= 8
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : painLevel >= 4
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                Score: {painLevel} / 10
              </span>
            </div>

            {/* Pain Scale (0-10) */}
            <div className="space-y-2">
              <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                  const isSelected = painLevel === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setPainLevel(score)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center border ${
                        isSelected
                          ? 'bg-rose-700 text-white border-rose-700 shadow-md scale-105 z-10 ring-2 ring-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>0: No pain</span>
                <span>1–3: Mild</span>
                <span>4–6: Moderate</span>
                <span>7–10: Severe / Uncontrolled</span>
              </div>
            </div>

            {/* Pain Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Where is your main pain centered?
                </label>
                <select
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="incision">Directly around surgical incision</option>
                  <option value="deep_abdominal">Deep internal abdominal cramping</option>
                  <option value="chest">Chest or upper back (Emergency alert)</option>
                  <option value="calf">Calf or lower leg (DVT alert)</option>
                  <option value="head">Headache / Temples</option>
                  <option value="generalized">Generalized body ache</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Did pain medicine provide relief?
                </label>
                <select
                  value={painRelief}
                  onChange={(e) => setPainRelief(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="relieved">Yes, pain became manageable within 45 mins</option>
                  <option value="partial">Partial relief only — still uncomfortable</option>
                  <option value="no_relief">No relief at all from medication</option>
                  <option value="no_medicine">Did not take pain medicine today</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Gastrointestinal & Tolerability Check */}
          <div className="space-y-4 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-bold">4</span>
                Gastrointestinal Recovery & Tolerability
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Post-Op Ileus Check</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bowel Movement & Flatus (Gas)
                </label>
                <select
                  value={bowelStatus}
                  onChange={(e) => setBowelStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="normal">Passed gas & bowel movement normally</option>
                  <option value="flatus_only">Passed gas (flatus) only, no bowel movement</option>
                  <option value="no_gas_no_stool">Neither gas nor bowel movement, feeling bloated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food & Liquid Tolerance
                </label>
                <select
                  value={hydrationStatus}
                  onChange={(e) => setHydrationStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="tolerating">Eating and drinking normally</option>
                  <option value="low_appetite">Low appetite, but drinking plenty of liquids</option>
                  <option value="vomiting">Persistent nausea or vomited food/meds</option>
                </select>
              </div>
            </div>

            {/* Medication Adverse Effects Screening */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Are you experiencing any unpleasant side-effects from your medications?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Severe Constipation (Opioids)',
                  'Stomach Burning / Acidity (Painkillers)',
                  'Drowsiness / Extreme sleepiness',
                  'Skin Itching / Rash',
                  'Dry Mouth / Thirst',
                ].map((item) => {
                  const isChecked = medSideEffects.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMedSideEffect(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isChecked
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 5: Objective Vitals Entry */}
          <div className="space-y-4 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-bold">5</span>
                Body Temperature & Objective Vitals
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Thermometer Reading</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Body Temperature (°F)
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="98.6"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">°F</span>
                </div>

                <div className="flex gap-1.5 pt-2">
                  {['98.6', '99.5', '100.4', '101.5'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTemperature(val)}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                    >
                      {val}°F
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Temperature Safety Badge */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">Live Clinical Triage Status:</span>
                <div className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2 ${tempStatus.color}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="block">{tempStatus.label}</span>
                    <span className="text-[10px] font-normal opacity-90 block mt-0.5">
                      {tempNumber > 100.4
                        ? 'Fever above 100.4°F indicates potential surgical site infection or inflammation. Alerting care team.'
                        : 'Temperature is within normal expected postoperative boundaries.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Additional Notes & Caregiver Log Info */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Additional Observations or Patient Questions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Slept 6 hours, took morning pain med with milk, small walk in garden..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPainLevel(3);
                setWoundStatus('clean_dry');
                setEnergyLevel('improving');
                setAmbulationLevel('unassisted');
                setTemperature('98.6');
                setNotes('');
                setHasCalfPain(false);
                setMedSideEffects([]);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              Reset Answers
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Evaluating Safety...' : t('saveSymptomLog', 'Save Daily Clinical Check-in')}</span>
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Recent Logs & Pain/Temp Trend Graph */}
        <div className="lg:col-span-5 space-y-4">
          {/* Emergency Helper Card */}
          <div className="bg-rose-950 text-white rounded-3xl p-5 border border-rose-800/80 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Punjab Emergency Protocol (108 Dispatch)</span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              If the patient experiences shortness of breath, sudden severe chest pain, or continuous profuse wound bleeding, dial immediately:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:108"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 108 (Ambulance)</span>
              </a>
              <a
                href="tel:104"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 transition"
              >
                <span>Call 104 (Health Helpline)</span>
              </a>
            </div>
          </div>

          {/* Recent Logs List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {t('symptoms', 'Recent Clinical Check-ins')}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {history.length} logged
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">{t('noLogsYet', 'No check-ins logged yet')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daily recovery interview responses will appear here with clinical markers.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {history.slice(0, 5).map((log) => {
                  const logDate = new Date(log.timestamp);
                  const timeStr = isNaN(logDate.getTime())
                    ? 'Recent'
                    : logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = isNaN(logDate.getTime())
                    ? ''
                    : logDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  const painColor =
                    log.painScore >= 7
                      ? 'bg-rose-600'
                      : log.painScore >= 4
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${painColor} shrink-0 mt-1`} />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            Pain {log.painScore}/10
                            {log.temperature ? ` • ${log.temperature > 50 ? log.temperature : Math.round((log.temperature * 1.8 + 32) * 10) / 10}°F` : ''}
                          </span>
                          <span className="text-[11px] text-slate-600 block line-clamp-2 mt-0.5">
                            {log.notes || (log.selectedSymptoms && log.selectedSymptoms.length > 0 ? log.selectedSymptoms.join(', ') : 'Normal recovery check-in')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 font-semibold block">{timeStr}</span>
                        {dateStr && <span className="text-[9px] text-slate-400 block">{dateStr}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adherence & Pain/Temp Trend Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Vitals & Pain Trend</h3>
                <span className="text-[11px] text-slate-400 font-medium">Past 7 days trajectory</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-700 inline-block" /> Pain (0–10)
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Temp (°F)
                </span>
              </div>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[96, 104]} stroke="#f59e0b" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Pain') return [`${value} / 10`, 'Pain Level'];
                      if (name === 'Temp') return [`${value}°F`, 'Body Temperature'];
                      return [value, name];
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="pain"
                    name="Pain"
                    stroke="#be123c"
                    strokeWidth={3}
                    dot={{ fill: '#be123c', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="temp"
                    name="Temp"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
