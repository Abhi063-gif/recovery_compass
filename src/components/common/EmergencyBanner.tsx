import React from 'react';
import { PhoneCall, AlertTriangle } from 'lucide-react';
import { useSafetyStore } from '@/stores/useSafetyStore';

export const EmergencyBanner: React.FC = () => {
  const triggerManualEmergency = useSafetyStore((s) => s.triggerManualEmergency);

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center justify-between text-xs text-red-900">
      <div className="flex items-center gap-1.5 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
        <span>Medical Emergency? Call 911 or visit the nearest ER immediately.</span>
      </div>
      <button
        onClick={triggerManualEmergency}
        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-0.5 rounded-full font-semibold text-[11px] transition shadow-sm focus:ring-2 focus:ring-red-400"
        aria-label="Open emergency contact protocol"
      >
        <PhoneCall className="w-3 h-3" />
        <span>Emergency Help</span>
      </button>
    </div>
  );
};
