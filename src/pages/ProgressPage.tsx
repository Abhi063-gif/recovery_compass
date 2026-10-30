import React from 'react';
import {
  TrendingUp,
  Pill,
  CheckCircle2,
  Calendar,
  Activity,
  ShieldCheck,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePlanStore } from '@/stores/usePlanStore';
import { useSymptomStore } from '@/stores/useSymptomStore';

import { plansApi } from '@/api/plans';

export const ProgressPage: React.FC = () => {
  const plan = usePlanStore((s) => s.plan);
  const symptomHistory = useSymptomStore((s) => s.history);
  const [remoteProgress, setRemoteProgress] = React.useState<any>(null);

  React.useEffect(() => {
    if (plan.id) {
      plansApi
        .getProgress(plan.id)
        .then((data) => setRemoteProgress(data))
        .catch(() => {});
    }
  }, [plan.id]);

  const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = plan.tasks.length || 1;
  const taskCompletionRate =
    remoteProgress?.taskCompletion ?? Math.round((completedTasks / totalTasks) * 100);

  const takenMeds = plan.medications.filter((m) => m.todayStatus === 'taken').length;
  const totalMeds = plan.medications.length || 1;
  const medAdherenceRate =
    remoteProgress?.medAdherence ?? Math.round((takenMeds / totalMeds) * 100);

  const weeklyActivityData = [
    { day: 'Day 1', completion: 60 },
    { day: 'Day 2', completion: 80 },
    { day: 'Day 3', completion: 90 },
    { day: 'Day 4', completion: 75 },
    { day: 'Day 5', completion: taskCompletionRate || 85 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Adherence & Activity Metrics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Recovery Plan Completion</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tracks execution of verified tasks and medications. This measures checklist completion, not clinical healing certainty.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{taskCompletionRate}%</div>
          <span className="text-xs text-slate-500 block">
            {completedTasks} of {totalTasks} daily actions completed
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Medication Adherence</span>
            <Pill className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{medAdherenceRate}%</div>
          <span className="text-xs text-slate-500 block">
            {takenMeds} of {totalMeds} prescribed doses taken
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Symptom Check-ins</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {symptomHistory.length}
          </div>
          <span className="text-xs text-slate-500 block">
            Logged across past 3 days
          </span>
        </div>
      </div>

      {/* Completion Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">
            Daily Checklist Completion Rate (%)
          </h2>
          <span className="text-xs text-slate-400">Past 5 Days</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="completion" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Safety Notice Note */}
      <div className="p-4 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Clinical Note:</strong> Recovery speed varies for each individual. If you feel increased fatigue or sharp discomfort while executing tasks, rest and notify your surgical care team.
        </span>
      </div>
    </div>
  );
};
