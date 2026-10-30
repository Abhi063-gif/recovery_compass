import { create } from 'zustand';
import { SymptomLog } from '@/types';
import { symptomsApi } from '@/api/symptoms';
import { MOCK_SYMPTOM_HISTORY } from '@/api/mocks/mockPlanData';

const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

interface SymptomState {
  history: SymptomLog[];
  isLoading: boolean;
  error: string | null;

  fetchHistory: (planId: string) => Promise<void>;
  addLog: (planId: string, log: Omit<SymptomLog, 'id' | 'timestamp'>) => Promise<SymptomLog>;
}

export const useSymptomStore = create<SymptomState>((set) => ({
  history: DEMO_MODE ? MOCK_SYMPTOM_HISTORY : [],
  isLoading: false,
  error: null,


  fetchHistory: async (planId: string) => {
    set({ isLoading: true });
    try {
      const data = await symptomsApi.getByPlan(planId);
      if (Array.isArray(data) && data.length > 0) {
        const mapped: SymptomLog[] = data.map((d) => ({
          id: d.id,
          timestamp: d.recordedAt,
          painScore: d.painScore ?? 0,
          temperature: d.temperature ?? undefined,
          selectedSymptoms: d.customSymptom ? [d.customSymptom] : [],
          notes: d.notes ?? undefined,
        }));
        set({ history: mapped, isLoading: false });
        return;
      }
    } catch {
      // Fallback
    } finally {
      set({ isLoading: false });
    }
  },

  addLog: async (planId: string, newEntry: Omit<SymptomLog, 'id' | 'timestamp'>) => {
    const tempId = `sym-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const localLog: SymptomLog = {
      ...newEntry,
      id: tempId,
      timestamp,
    };

    // Optimistically update
    set((state) => ({
      history: [localLog, ...state.history],
    }));

    try {
      const result = await symptomsApi.log({
        planId,
        painScore: newEntry.painScore,
        temperature: newEntry.temperature,
        customSymptom: newEntry.selectedSymptoms.join(', ') || newEntry.customSymptom,
        notes: newEntry.notes,
      });

      const logData = result?.symptomLog || result;
      if (logData && logData.id) {
        const savedLog: SymptomLog = {
          ...newEntry,
          id: logData.id,
          timestamp: logData.recordedAt,
        };

        set((state) => ({
          history: state.history.map((h) => (h.id === tempId ? savedLog : h)),
        }));
        return savedLog;
      }
    } catch (err) {
      console.warn('Backend symptom log failed, preserved locally:', err);
    }

    return localLog;
  },
}));
