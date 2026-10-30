import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Check,
  X,
  History,
  BellRing,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePlanStore } from '@/stores/usePlanStore';

export const MedicationsPage: React.FC = () => {
  const { plan, recordMedicationAction } = usePlanStore();
  const [tabView, setTabView] = useState<'upcoming' | 'calendars'>('upcoming');

  const medications = plan.medications;

  const adherenceWeeklyData = [
    { day: 'Mon', rate: 100 },
    { day: 'Tue', rate: 100 },
    { day: 'Wed', rate: 75 },
    { day: 'Thu', rate: 100 },
    { day: 'Fri', rate: 85 },
    { day: 'Sat', rate: 90 },
    { day: 'Sun', rate: 85 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header & Tabs (Matching Wireframe 9) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Medication Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribed schedule extracted from your discharge instructions.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTabView('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tabView === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTabView('calendars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tabView === 'calendars' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Calendars
          </button>
        </div>
      </div>

      {/* Today Date Strip */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <Calendar className="w-4 h-4 text-rose-700" />
        <span>Today, 16 Apr 2026</span>
      </div>

      {/* Medication Cards List (Matching Wireframe 9) */}
      <div className="space-y-3">
        {medications.map((med, idx) => {
          const isTaken = med.todayStatus === 'taken';
          const isSkipped = med.todayStatus === 'skipped';

          // Color accents for pill icons
          const pillBg =
            idx === 0
              ? 'bg-amber-100 text-amber-800'
              : idx === 1
              ? 'bg-red-100 text-urgentRed-700'
              : 'bg-sky-100 text-medical-700';

          return (
            <div
              key={med.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${pillBg}`}>
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {med.name} {med.dose}{med.unit}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {med.frequency} • {med.timing}
                  </span>
                  <span className="text-[11px] text-slate-400 italic">
                    Duration: {med.duration}
                  </span>
                </div>
              </div>

              {/* Actions & Status Pill */}
              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => recordMedicationAction(med.id, 'skipped')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isSkipped
                      ? 'bg-slate-300 text-slate-900 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Skip
                </button>

                <button
                  onClick={() => recordMedicationAction(med.id, 'taken')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isTaken
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTaken ? 'Taken ✓' : 'Take Dose'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adherence History Section (Matching Wireframe 9 bottom graph) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Adherence History</h3>
            <span className="text-xs text-slate-400">Weekly dose completion trend</span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-medical-700 block leading-none">
              85%
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">This week</span>
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adherenceWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="rate" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
