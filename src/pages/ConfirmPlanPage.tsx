import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Pill,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ListTodo,
  PhoneCall,
  Activity,
  ChevronLeft,
  HelpCircle
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';

export const ConfirmPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, confirmAndActivatePlan } = usePlanStore();
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);

  const handleActivate = async () => {
    if (!hasConfirmedCheckbox) return;
    await confirmAndActivatePlan(plan.id);
    navigate('/dashboard');
  };

  const unclearCount = plan.extractions.filter((e) => e.status === 'unclear').length;
  const conditionalCount = plan.extractions.filter((e) => e.condition).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header (Matching Wireframe 6) */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Review and confirm your recovery plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Nothing will be activated until you confirm.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        {/* 7 Metric Colored Summary Boxes (Directly matching Wireframe 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-center">
            <span className="text-2xl font-extrabold text-medical-700 block">
              {plan.medications.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Medicines</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <span className="text-2xl font-extrabold text-emerald-700 block">
              {plan.tasks.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Daily Tasks</span>
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
            <span className="text-2xl font-extrabold text-purple-700 block">
              {plan.followUps.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Follow-up</span>
          </div>

          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center">
            <span className="text-2xl font-extrabold text-slate-700 block">
              {plan.restrictions.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Restrictions</span>
          </div>

          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
            <span className="text-2xl font-extrabold text-urgentRed-600 block">
              {plan.redFlags.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Warning Signs</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <span className="text-2xl font-extrabold text-amberRisk-600 block">
              {unclearCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Unclear Item</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center col-span-2 sm:col-span-2">
            <span className="text-2xl font-extrabold text-slate-500 block">
              {conditionalCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Conditional Actions</span>
          </div>
        </div>

        {/* Explicit Confirmation Checkbox (Matching Wireframe 6 exact wording) */}
        <label className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-100/80 transition">
          <input
            type="checkbox"
            checked={hasConfirmedCheckbox}
            onChange={(e) => setHasConfirmedCheckbox(e.target.value === 'true' || e.target.checked)}
            className="w-5 h-5 rounded text-rose-700 focus:ring-rose-600 shrink-0 mt-0.5"
          />
          <span className="text-xs text-slate-700 font-medium leading-relaxed">
            I confirm that the information is correct and I understand this plan reorganizes my
            clinician's instructions. It does not replace medical advice.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate(`/verification/${plan.id || 'current'}`)}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            disabled={!hasConfirmedCheckbox}
            onClick={handleActivate}
            className={`px-6 py-3.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              hasConfirmedCheckbox
                ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Confirm & Build My Recovery Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
