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
        actionRequired: 'Call 108 for Emergency Ambulance immediately or visit the nearest Rural Hospital / Sub-District Hospital.',
        sourceReference: 'Emergency Protocol: Call 108 (Ambulance), 104 (Health Helpline) or 112 (National Emergency)',
        timestamp: new Date().toISOString(),
        emergencyPhone: '108',
        doctorPhone: '104',
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

      // Check both result.hasRedFlags AND result.hasRedFlag AND result.triggered
      const isTriggered = Boolean(
        result && (
          result.hasRedFlags ||
          result.hasRedFlag ||
          result.triggered ||
          (result.matches && result.matches.length > 0)
        )
      );

      if (isTriggered) {
        // If result.matches exists and has items, use result.matches[0] as primary triggered red flag
        const primaryMatch = result.matches && result.matches.length > 0 ? result.matches[0] : null;

        const ev = primaryMatch
          ? {
              id: primaryMatch.ruleId || result.eventId || `alert-${Date.now()}`,
              ruleName: primaryMatch.ruleName || primaryMatch.name || primaryMatch.ruleCode || 'Clinical red-flag criteria met',
              ruleCode: primaryMatch.ruleCode || 'RF-DETECTED',
              severity: primaryMatch.severity || 'WARNING',
              action: primaryMatch.action || 'CONTACT_CLINICIAN',
              message: primaryMatch.message,
              emergencyMessage: primaryMatch.emergencyMessage,
            }
          : result.event || {
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

        const isEmergency = ev.severity === 'EMERGENCY' || ev.severity === 'URGENT' || ev.action === 'SEEK_EMERGENCY_HELP';

        const alert: SafetyAlert = {
          id: ev.id || `alert-${Date.now()}`,
          triggerSymptom: ev.ruleName || 'Clinical red-flag criteria met',
          severity: severityMap[ev.severity || 'WARNING'] || 'MONITOR',
          actionRequired:
            ev.emergencyMessage ||
            ev.message ||
            'Call 108 for Emergency Ambulance immediately or contact your clinician on 104.',
          sourceReference: `Rule: ${ev.ruleCode} (${ev.ruleName || ''})`,
          timestamp: new Date().toISOString(),
          emergencyPhone: isEmergency ? '108' : undefined,
          doctorPhone: '104',
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
          actionRequired: 'Call 108 for Emergency Ambulance immediately or visit the nearest Rural Hospital / Sub-District Hospital. Do not drive yourself.',
          sourceReference: 'Offline Protocol: Discharge summary emergency warning signs (Call 108 / 112)',
          timestamp: new Date().toISOString(),
          emergencyPhone: '108',
          doctorPhone: '104',
        };
      } else if (isHighFever) {
        alert = {
          id: `alert-fallback-${Date.now()}`,
          triggerSymptom: `High temperature recorded (${log.temperature}°C >= 38.5°C)`,
          severity: 'MONITOR',
          actionRequired: 'Contact surgical triage or medical helpline (Call 104) immediately.',
          sourceReference: 'Offline Protocol: High fever warning threshold (>= 38.5°C)',
          timestamp: new Date().toISOString(),
          emergencyPhone: undefined,
          doctorPhone: '104',
        };
      }

      if (alert) {
        set({ activeAlert: alert });
      }
      return alert;
    }
  },
}));
