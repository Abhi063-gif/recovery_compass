import React from 'react';
import { Info } from 'lucide-react';

interface DisclaimerBannerProps {
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ className = '' }) => {
  return (
    <div
      role="note"
      aria-label="Medical Disclaimer"
      className={`bg-slate-100/90 border-b border-slate-200 px-4 py-2 text-xs text-slate-600 flex items-center justify-center gap-2 ${className}`}
    >
      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
      <span className="text-center font-medium">
        This plan reorganizes your clinician's instructions. It does not replace medical advice or clinical evaluation.
      </span>
    </div>
  );
};
