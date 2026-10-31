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
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSymptomStore } from '@/stores/useSymptomStore';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useTranslation } from '@/services/i18n';

export const SymptomsPage: React.FC = () => {
  const { history, addLog, fetchHistory } = useSymptomStore();
  const { evaluateSafety } = useSafetyStore();
  const plan = usePlanStore((s) => s.plan);
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

  // Common Vitals
  const [painLevel, setPainLevel] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<string>('98.6');
  const [notes, setNotes] = useState<string>('');
  const [justSaved, setJustSaved] = useState(false);

  // Pathway 1: DIABETES Vitals
  const [fastingSugar, setFastingSugar] = useState<string>('');
  const [postPrandialSugar, setPostPrandialSugar] = useState<string>('');

  // Pathway 2: HYPERTENSION Vitals
  const [bpSystolic, setBpSystolic] = useState<string>('');
  const [bpDiastolic, setBpDiastolic] = useState<string>('');

  // Pathway 3: PREGNANCY Vitals
  const [fetalKicks, setFetalKicks] = useState<string>('');
  const [hasSevereHeadache, setHasSevereHeadache] = useState<boolean>(false);
  const [hasSevereSwelling, setHasSevereSwelling] = useState<boolean>(false);

  // Pathway 4: TUBERCULOSIS Vitals
  const [dotsDoseTaken, setDotsDoseTaken] = useState<boolean>(false);
  const [tbSideEffects, setTbSideEffects] = useState<string[]>([]);

  // Pathway 5: POST_SURGERY Vitals
  const [woundRedness, setWoundRedness] = useState<boolean>(false);
  const [woundDischarge, setWoundDischarge] = useState<boolean>(false);

  // Adaptive symptom options based on active pathway
  const symptomOptions = useMemo(() => {
    switch (selectedPathway) {
      case 'DIABETES':
        return ['Excessive thirst', 'Frequent urination', 'Fatigue', 'Dizziness', 'Trembling / Shaking', 'Blurred vision'];
      case 'HYPERTENSION':
        return ['Severe headache', 'Dizziness', 'Chest pain / tightness', 'Blurred vision', 'Shortness of breath', 'Palpitations'];
      case 'PREGNANCY':
        return ['Nausea / Vomiting', 'Severe headache', 'Blurred vision', 'Face / Hand swelling', 'Decreased fetal movement', 'Abdominal pain'];
      case 'TUBERCULOSIS':
        return ['Persistent cough', 'Fever', 'Night sweats', 'Nausea', 'Orange / Red urine', 'Skin itching / rash', 'Jaundice / Yellow eyes'];
      case 'POST_SURGERY':
      default:
        return ['Surgical soreness', 'Incision redness', 'Wound discharge', 'Fever', 'Nausea', 'Swelling', 'Shortness of breath'];
    }
  }, [selectedPathway]);

  const toggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let tempNum = temperature ? parseFloat(temperature) : undefined;
    // Normalize Fahrenheit (> 50) to Celsius for backend deterministic rule engine
    if (tempNum && tempNum > 50) {
      tempNum = Math.round(((tempNum - 32) * (5 / 9)) * 10) / 10;
    }

    const pathwayDetails: string[] = [];
    const extraSymptoms: string[] = [...selectedSymptoms];

    if (selectedPathway === 'DIABETES') {
      if (fastingSugar) pathwayDetails.push(`Fasting Sugar: ${fastingSugar} mg/dL`);
      if (postPrandialSugar) pathwayDetails.push(`Post-Prandial: ${postPrandialSugar} mg/dL`);
      if (fastingSugar && parseFloat(fastingSugar) > 200) extraSymptoms.push('Hyperglycemia (>200)');
      if (fastingSugar && parseFloat(fastingSugar) < 70) extraSymptoms.push('Hypoglycemia (<70)');
    } else if (selectedPathway === 'HYPERTENSION') {
      if (bpSystolic && bpDiastolic) pathwayDetails.push(`Blood Pressure: ${bpSystolic}/${bpDiastolic} mmHg`);
      if (bpSystolic && parseFloat(bpSystolic) >= 160) extraSymptoms.push('Severe Hypertension (>=160)');
    } else if (selectedPathway === 'PREGNANCY') {
      if (fetalKicks !== '') pathwayDetails.push(`Fetal Kicks (2h): ${fetalKicks}`);
      if (fetalKicks !== '' && parseInt(fetalKicks, 10) < 10) extraSymptoms.push('Decreased fetal movement (<10)');
      if (hasSevereHeadache) {
        pathwayDetails.push('Severe Persistent Headache: YES');
        extraSymptoms.push('Severe headache');
      }
      if (hasSevereSwelling) {
        pathwayDetails.push('Sudden Face/Hand Swelling: YES');
        extraSymptoms.push('Face / Hand swelling');
      }
    } else if (selectedPathway === 'TUBERCULOSIS') {
      pathwayDetails.push(`Daily DOTS Dose Swallowed: ${dotsDoseTaken ? 'YES' : 'NO'}`);
      if (tbSideEffects.length > 0) {
        pathwayDetails.push(`TB Side-Effects: ${tbSideEffects.join(', ')}`);
        extraSymptoms.push(...tbSideEffects);
      }
    } else {
      if (woundRedness) {
        pathwayDetails.push('Incision Redness: Present');
        extraSymptoms.push('Incision redness');
      }
      if (woundDischarge) {
        pathwayDetails.push('Wound Discharge: Present');
        extraSymptoms.push('Wound discharge');
      }
    }

    const combinedNotes = [
      ...pathwayDetails,
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
    setTimeout(() => setJustSaved(false), 3000);
    setNotes('');
  };

  // Dynamic Chart Data derived from useSymptomStore.history past 7 days
  const dynamicChartData = useMemo(() => {
    if (!history || history.length === 0) {
      return [
        { name: 'Day 1', pain: 6, temp: 98.6 },
        { name: 'Day 2', pain: 5, temp: 98.4 },
        { name: 'Day 3', pain: 4, temp: 98.6 },
        { name: 'Today', pain: painLevel, temp: parseFloat(temperature) || 98.6 },
      ];
    }

    // Sort chronologically ascending
    const sorted = [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Keep the most recent 7 logs
    const recent = sorted.slice(-7);

    return recent.map((item, idx) => {
      const d = new Date(item.timestamp);
      const dayLabel = isNaN(d.getTime())
        ? `Day ${idx + 1}`
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('symptomTracker', 'Log Your Symptoms & Vitals')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('symptomSubtitle', 'Personalized recovery monitoring based on your active care pathway.')}
          </p>
        </div>

        {justSaved && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('savedSuccess', 'Check-in saved successfully!')}</span>
          </div>
        )}
      </div>

      {/* Pathway Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Pathway:</span>
        {[
          { id: 'POST_SURGERY', label: 'Post-Surgery', icon: Activity },
          { id: 'DIABETES', label: 'Diabetes Care', icon: Droplets },
          { id: 'HYPERTENSION', label: 'Hypertension', icon: Heart },
          { id: 'PREGNANCY', label: 'Maternal Care', icon: Baby },
          { id: 'TUBERCULOSIS', label: 'TB DOTS', icon: Pill },
        ].map((pw) => {
          const Icon = pw.icon;
          const isSelected = selectedPathway === pw.id;
          return (
            <button
              key={pw.id}
              type="button"
              onClick={() => setSelectedPathway(pw.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{pw.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6"
        >
          {/* Pathway-Specific Vitals Section */}
          {selectedPathway === 'DIABETES' && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Blood Sugar Monitoring
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mg/dL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Post-Prandial (2h Post-Meal)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={postPrandialSugar}
                      onChange={(e) => setPostPrandialSugar(e.target.value)}
                      placeholder="e.g. 135"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mg/dL</span>
                  </div>
                </div>
              </div>

              {fastingSugar && parseFloat(fastingSugar) > 200 && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>High blood sugar (&gt;200 mg/dL). Drink water, take prescribed insulin/medication, and alert your ASHA.</span>
                </div>
              )}
              {fastingSugar && parseFloat(fastingSugar) < 70 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Low blood sugar (&lt;70 mg/dL). Eat 3 teaspoons of sugar, jaggery, or fruit juice immediately.</span>
                </div>
              )}
            </div>
          )}

          {selectedPathway === 'HYPERTENSION' && (
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                    Blood Pressure Monitoring
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-sky-800 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                  Normal: 120/80 mmHg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Systolic Pressure (Top)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-200 focus:border-sky-600 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mmHg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Diastolic Pressure (Bottom)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-200 focus:border-sky-600 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">mmHg</span>
                  </div>
                </div>
              </div>

              {bpSystolic && parseFloat(bpSystolic) >= 160 && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Stage 2 High BP (≥160 mmHg). Rest quietly for 15 minutes. If persistent with headache or chest pain, call 108.</span>
                </div>
              )}
            </div>
          )}

          {selectedPathway === 'PREGNANCY' && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Fetal & Maternal Monitoring
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                  Target: ≥10 kicks in 2h
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fetal Movement Kick Count (last 2 hours)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={fetalKicks}
                    onChange={(e) => setFetalKicks(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">kicks / 2 hrs</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-purple-100">
                <span className="block text-[11px] font-bold text-slate-700">Pre-eclampsia Screening:</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSevereHeadache}
                    onChange={(e) => setHasSevereHeadache(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Severe or persistent headache not relieved by rest</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSevereSwelling}
                    onChange={(e) => setHasSevereSwelling(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Sudden swelling of face, eyelids, or fingers</span>
                </label>
              </div>

              {fetalKicks !== '' && parseInt(fetalKicks, 10) < 10 && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Fetal movement is below 10 kicks in 2 hours. Lie on your left side and inform your ANM immediately.</span>
                </div>
              )}
            </div>
          )}

          {selectedPathway === 'TUBERCULOSIS' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Daily DOTS Dose Confirmation
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                  NTEP Compliance
                </span>
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dotsDoseTaken}
                  onChange={(e) => setDotsDoseTaken(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">I have swallowed today's DOTS medication</span>
                  <span className="text-[11px] text-slate-500">Supervised directly by treatment supporter or ASHA worker.</span>
                </div>
              </label>

              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] font-bold text-slate-700">Side-Effect Screening:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'Nausea', label: 'Severe nausea / vomiting' },
                    { id: 'Orange urine', label: 'Orange / Red urine (Rifampicin normal effect)' },
                    { id: 'Skin rash', label: 'Skin rash / severe itching' },
                    { id: 'Jaundice', label: 'Yellow eyes / dark urine (Alert!)' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tbSideEffects.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTbSideEffects([...tbSideEffects, item.id]);
                          else setTbSideEffects(tbSideEffects.filter((x) => x !== item.id));
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span className={item.id === 'Jaundice' ? 'text-rose-700 font-bold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedPathway === 'POST_SURGERY' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-700" />
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Surgical Wound & Incision Site Check
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                  Infection Prevention
                </span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={woundRedness}
                    onChange={(e) => setWoundRedness(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Noticeable spreading redness or heat around surgical incision</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={woundDischarge}
                    onChange={(e) => setWoundDischarge(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Yellowish pus, foul odor, or bleeding from the incision dressing</span>
                </label>
              </div>
            </div>
          )}

          {/* Pain Scale (0-10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('painScore', 'Pain Level (1–10)')}
              </label>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Score: {painLevel} / 10
              </span>
            </div>

            <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
              {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                const isSelected = painLevel === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setPainLevel(score)}
                    className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center border ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-700 shadow-md scale-105 z-10 font-extrabold ring-2 ring-rose-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span>No pain (0)</span>
              <span>Worst pain (10)</span>
            </div>
          </div>

          {/* Symptom Multi-Select Chips */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('selectSymptoms', 'Symptoms (select all that apply)')}
            </label>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                const isUrgent =
                  sym.includes('breath') ||
                  sym.includes('Fever') ||
                  sym.includes('Chest') ||
                  sym.includes('Jaundice') ||
                  sym.includes('fetal');

                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('temperature', 'Body Temperature (°F)')}
            </label>
            <div className="relative max-w-xs">
              <Thermometer className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-600 outline-none"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('additionalNotes', 'Additional Notes (optional)')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comments, food intake, or questions..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-600 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPainLevel(4);
                setSelectedSymptoms([]);
                setNotes('');
                setFastingSugar('');
                setPostPrandialSugar('');
                setBpSystolic('');
                setBpDiastolic('');
                setFetalKicks('');
                setHasSevereHeadache(false);
                setHasSevereSwelling(false);
                setDotsDoseTaken(false);
                setTbSideEffects([]);
                setWoundRedness(false);
                setWoundDischarge(false);
              }}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              Reset
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition hover:-translate-y-0.5"
            >
              {t('saveSymptomLog', 'Save Daily Check-in')}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Recent Logs & Pain/Temp Trend Graph */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recent Logs List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {t('symptoms', 'Recent Symptom Logs')}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {history.length} recorded
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">{t('noLogsYet', 'No logs yet')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your daily recovery check-ins will appear here.
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
                          <span className="text-[11px] text-slate-600 block line-clamp-2">
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
                <h3 className="font-bold text-sm text-slate-900">Adherence & Vitals Trend</h3>
                <span className="text-[11px] text-slate-400 font-medium">Pain score & temperature over past 7 days</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-700 inline-block" /> Pain (0-10)
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
