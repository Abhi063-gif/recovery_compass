import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { ConfidenceLevel } from '@/types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
  if (confidence === 'high') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        High Confidence
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
        <HelpCircle className="w-3 h-3 text-sky-600" />
        Verified Match
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 animate-pulse ${className}`}>
      <AlertCircle className="w-3 h-3 text-amber-600" />
      Could not read reliably — please verify
    </span>
  );
};
