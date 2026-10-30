import React from 'react';
import { AlertOctagon, PhoneCall, X, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { usePlanStore } from '@/stores/usePlanStore';

export const SafetyAlertModal: React.FC = () => {
  const { activeAlert, dismissAlert } = useSafetyStore();
  const plan = usePlanStore((s) => s.plan);

  if (!activeAlert) return null;

  const isEmergency = activeAlert.severity === 'EMERGENCY';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-start justify-between ${
            isEmergency ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {isEmergency ? (
                <AlertOctagon className="w-7 h-7 text-white" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                {isEmergency ? 'Urgent Safety Trigger' : 'Clinical Red-Flag Notice'}
              </span>
              <h2 id="safety-alert-title" className="text-xl font-bold mt-0.5">
                {isEmergency ? 'Emergency Action Required' : 'Contact Your Care Team'}
              </h2>
            </div>
          </div>
          <button
            onClick={dismissAlert}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
              Matched Sign
            </span>
            <p className="font-semibold text-slate-900 mt-0.5">
              {activeAlert.triggerSymptom}
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recommended Protocol
            </h3>
            <p className="text-slate-800 font-medium text-base leading-relaxed">
              {activeAlert.actionRequired}
            </p>
          </div>

          {activeAlert.sourceReference && (
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2">
              <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">From your discharge instructions:</span>
                <span className="italic text-slate-700">"{activeAlert.sourceReference}"</span>
              </div>
            </div>
          )}

          {/* Action Call Buttons */}
          <div className="pt-2 space-y-2.5">
            {isEmergency ? (
              <a
                href={`tel:${activeAlert.emergencyPhone || '108'}`}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition"
              >
                <PhoneCall className="w-5 h-5" />
                Call Emergency Ambulance ({activeAlert.emergencyPhone || '108'})
              </a>
            ) : (
              <a
                href={`tel:${activeAlert.doctorPhone || plan.patientProfile.clinicPhone}`}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-100 transition"
              >
                <PhoneCall className="w-5 h-5" />
                Call Clinician: {activeAlert.doctorPhone || plan.patientProfile.clinicPhone}
              </a>
            )}

            <button
              onClick={dismissAlert}
              className="w-full py-2.5 text-slate-600 hover:text-slate-800 text-sm font-medium hover:bg-slate-100 rounded-xl transition"
            >
              I Understand & Will Follow Guidance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
