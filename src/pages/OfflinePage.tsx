import React from 'react';
import { Link } from 'react-router-dom';
import {
  WifiOff,
  CheckCircle2,
  Calendar,
  Pill,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const OfflinePage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-subtle">
        <WifiOff className="w-10 h-10 text-rose-700" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">You're offline</h1>
        <p className="text-xs text-slate-500">
          Showing your last saved recovery plan.
        </p>
      </div>

      {/* Available Offline Features List (Matching Wireframe 16) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card text-left space-y-3 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
          Available Offline:
        </span>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>View plan details & doctor notes</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>View 14-day interactive timeline</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>View medication schedule</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>View symptom history</span>
          </div>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
      >
        <span>Open Cached Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
