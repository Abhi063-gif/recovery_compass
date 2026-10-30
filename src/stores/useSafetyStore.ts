import { create } from 'zustand';
import { SafetyAlert, SafetySeverity, SymptomLog } from '@/types';
import { safetyApi } from '@/api/safety';

interface SafetyState {
  activeAlert: SafetyAlert | null;
  dismissAlert: () => void;
  triggerManualEmergency: () => void;
  evaluateSafety: (planId: string, log: SymptomLog) => Promise<SafetyAlert | null>;
}

export const useSafetyStore = create<SafetyState>((set) => ({
  activeAlert: null,

  dismissAlert: () => set({ activeAlert: null }),

  triggerManualEmergency: () => {
    set({
      activeAlert: {
        id: `alert-${Date.now()}`,
        triggerSymptom: 'Emergency Help Triggered by User',
        severity: 'EMERGENCY',
        actionRequired: 'Call emergency services (911 / 999) or proceed to the nearest Emergency Department immediately.',
        sourceReference: 'Global clinician emergency protocol',
        timestamp: new Date().toISOString(),
        emergencyPhone: '911',
        doctorPhone: '+1 (555) 382-9010',
      },
    });
  },

  evaluateSafety: async (planId: string, log: SymptomLog): Promise<SafetyAlert | null> => {
    try {
      // Primary: Authoritative Backend Deterministic Rule Engine
      const result = await safetyApi.check(planId, {
        painScore: log.painScore,
        temperature: log.temperature,
        symptomCodes: log.selectedSymptoms,
        notes: log.notes,
        symptomLogId: log.id,
      });

      const isTriggered = result && (result.triggered || result.hasRedFlag);
      if (isTriggered) {
        const ev = result.event || {
          id: result.eventId || `alert-${Date.now()}`,
          ruleName: result.ruleCode || 'Clinical red-flag criteria met',
          ruleCode: result.ruleCode || 'RF-DETECTED',
          severity: result.severity || 'WARNING',
          action: result.action || 'CONTACT_CLINICIAN',
          message: result.message,
          emergencyMessage: result.emergencyMessage,
        };

        const severityMap: Record<string, SafetySeverity> = {
          EMERGENCY: 'EMERGENCY',
          URGENT: 'EMERGENCY',
          WARNING: 'MONITOR',
          INFORMATIONAL: 'NORMAL',
        };

        const alert: SafetyAlert = {
          id: ev.id || `alert-${Date.now()}`,
          triggerSymptom: ev.ruleName || 'Clinical red-flag criteria met',
          severity: severityMap[ev.severity || 'WARNING'] || 'MONITOR',
          actionRequired:
            ev.emergencyMessage ||
            ev.message ||
            'Please contact your surgical care team immediately.',
          sourceReference: `Rule: ${ev.ruleCode} (${ev.ruleName || ''})`,
          timestamp: new Date().toISOString(),
          emergencyPhone: ev.action === 'SEEK_EMERGENCY_HELP' ? '911' : undefined,
          doctorPhone: '+1 (555) 382-9010',
        };

        set({ activeAlert: alert });
        return alert;
      }

      return null;
    } catch (err) {
      // Fallback only if backend is unreachable (Development / Offline fallback)
      console.warn('Backend safety check unavailable, applying deterministic offline protocol:', err);
      let alert: SafetyAlert | null = null;
      const lowerSymptoms = log.selectedSymptoms.map((s) => s.toLowerCase());
      const isChestOrBreath = lowerSymptoms.some((s) =>
        s.includes('chest pain') || s.includes('shortness of breath') || s.includes('calf swelling')
      );
      const isHighFever = log.temperature && log.temperature >= 38.5;

      if (isChestOrBreath) {
        alert = {
          id: `alert-fallback-${Date.now()}`,
          triggerSymptom: 'Shortness of breath / Chest symptoms',
          severity: 'EMERGENCY',
          actionRequired: 'Seek immediate Emergency Department care or call 911/999. Do not drive yourself.',
          sourceReference: 'Offline Protocol: Discharge summary emergency warning signs',
          timestamp: new Date().toISOString(),
          emergencyPhone: '911',
          doctorPhone: '+1 (555) 382-9010',
        };
      } else if (isHighFever) {
        alert = {
          id: `alert-fallback-${Date.now()}`,
          triggerSymptom: `High temperature recorded (${log.temperature}°C >= 38.5°C)`,
          severity: 'MONITOR',
          actionRequired: 'Contact surgical triage or on-call clinic immediately.',
          sourceReference: 'Offline Protocol: High fever warning threshold (>= 38.5°C)',
          timestamp: new Date().toISOString(),
          doctorPhone: '+1 (555) 382-9010',
        };
      }

      if (alert) {
        set({ activeAlert: alert });
      }
      return alert;
    }
  },
}));
