import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  PhoneCall,
  FileText,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { useTranslation } from '@/services/i18n';

export const SafetyCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const plan = usePlanStore((s) => s.plan);
  const activeAlert = useSafetyStore((s) => s.activeAlert);
  const triggerManualEmergency = useSafetyStore((s) => s.triggerManualEmergency);

  const warningSign = activeAlert?.triggerSymptom || 'High fever (above 38°C / 101.0°F) or persistent chills';
  const sourceRef = activeAlert?.sourceReference || 'Source: Discharge Summary — Page 1';
  const recommendedAction = activeAlert?.actionRequired || 'Contact your clinician immediately. Do not delay if temperature stays above 101°F.';
  const doctorPhone = activeAlert?.doctorPhone || plan.patientProfile?.clinicPhone || '104';

  const planIdToUse = plan?.id || 'plan-demo-punjab';

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      {/* High-Visibility Danger Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-urgentRed-200 shadow-card text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-urgentRed-100 text-urgentRed-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
          {t('redFlagSafety', 'Red Flags & Safety')}
        </span>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-urgentRed-950">
            {t('urgentAttention', 'Urgent Attention Required')}
          </h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {t(
              'urgentSubtitle',
              'Your logged symptom matches a warning sign in your recovery instructions.',
            )}
          </p>
        </div>

        {/* Warning Sign Box */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-urgentRed-600 shrink-0 mt-1" />
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t('warningSign', 'Warning Sign')}
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                {warningSign}
              </h3>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {sourceRef}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t('recommendedAction', 'Recommended Action')}
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">
              {recommendedAction}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <a
            href={`tel:${doctorPhone}`}
            className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>
              {t('callClinician', 'Call Your Clinician')} ({doctorPhone})
            </span>
          </a>

          <button
            onClick={() => navigate(`/verification/${planIdToUse}`)}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            {t('viewSource', 'View Source Instructions')}
          </button>
        </div>

        {/* Bottom Emergency Help Disclaimer */}
        <div className="pt-2 text-center text-xs text-urgentRed-700 font-medium">
          <button
            onClick={triggerManualEmergency}
            className="underline font-bold hover:text-urgentRed-900"
          >
            {t(
              'emergencyDisclaimer',
              'If you feel this is a medical emergency, seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline).',
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
