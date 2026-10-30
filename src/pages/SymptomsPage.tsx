import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSymptomStore } from '@/stores/useSymptomStore';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { usePlanStore } from '@/stores/usePlanStore';

const SYMPTOM_OPTIONS = ['Nausea', 'Headache', 'Fever', 'Fatigue', 'Swelling', 'Surgical soreness', 'Shortness of breath'];

export const SymptomsPage: React.FC = () => {
  const { history, addLog } = useSymptomStore();
  const { evaluateSafety } = useSafetyStore();

  const [painLevel, setPainLevel] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Surgical soreness']);
  const [temperature, setTemperature] = useState<string>('98.6');
  const [notes, setNotes] = useState<string>('');
  const [justSaved, setJustSaved] = useState(false);

  const plan = usePlanStore((s) => s.plan);

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
    // If entered in Fahrenheit (> 50), normalize to Celsius for backend deterministic rule engine
    if (tempNum && tempNum > 50) {
      tempNum = Math.round(((tempNum - 32) * (5 / 9)) * 10) / 10;
    }
    const newEntry = await addLog(plan.id, {
      painScore: painLevel,
      selectedSymptoms,
      temperature: tempNum,
      notes: notes.trim() || undefined,
    });

    await evaluateSafety(plan.id, newEntry);

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
    setNotes('');
  };

  const chartData = [
    { name: 'Day 1', pain: 6 },
    { name: 'Day 2', pain: 5 },
    { name: 'Day 3', pain: 4 },
    { name: 'Day 4', pain: painLevel },
  ];

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Header (Matching Wireframe 10) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Log Your Symptoms</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            How are you feeling today?
          </p>
        </div>

        {justSaved && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Check-in saved successfully!</span>
          </div>
        )}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6"
        >
          {/* Pain Scale (0-10) with "No pain" and "Worst pain" labels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pain Level
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
              Symptoms (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                const isUrgent = sym === 'Shortness of breath' || sym === 'Fever';

                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? isUrgent
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                          : 'bg-rose-700 text-white border-rose-700 shadow-sm'
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
              Temperature (optional)
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
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-600 outline-none"
            />
          </div>

          {/* Action Buttons: Cancel and Save */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPainLevel(4);
                setNotes('');
              }}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition hover:-translate-y-0.5"
            >
              Save Check-in
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Recent Logs & Pain Trend (Matching Wireframe 10) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recent Logs List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Recent Logs
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Pain 3/10</span>
                    <span className="text-[11px] text-slate-500">Mild tenderness</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">01:30 PM</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Pain 4/10</span>
                    <span className="text-[11px] text-slate-500">Mild soreness</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">02:30 AM</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Pain 5/10</span>
                    <span className="text-[11px] text-slate-500">Surgical site soreness, Bloating</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Yesterday</span>
              </div>
            </div>
          </div>

          {/* Pain Trend Mini Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Pain Trend</h3>
              <span className="text-[11px] text-slate-400 font-medium">Past 4 Days</span>
            </div>
            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    stroke="#be123c"
                    strokeWidth={3}
                    dot={{ fill: '#be123c', r: 4 }}
                    activeDot={{ r: 6 }}
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
