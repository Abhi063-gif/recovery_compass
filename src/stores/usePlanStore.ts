import { create } from 'zustand';
import {
  ExtractionField,
  FollowUpAppointment,
  MedicationItem,
  RecoveryPlan,
  RecoveryTask,
  DoctorQuestion,
  UserProfile,
} from '@/types';
import {
  MOCK_INITIAL_PLAN,
} from '@/api/mocks/mockPlanData';
import { plansApi } from '@/api/plans';
import { documentsApi } from '@/api/documents';
import { extractionApi } from '@/api/extraction';
import { medicationsApi } from '@/api/medications';
import { questionsApi } from '@/api/questions';
import { offlineStorage } from '@/services/offlineSync';

const SNAPSHOT_STORAGE_KEY = 'rc_recovery_plan_snapshot';
const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

/** Minimal empty plan — used as the live starting state in production */
const EMPTY_PLAN: RecoveryPlan = {
  id: '',
  patientProfile: {
    name: '',
    role: 'patient',
    language: 'en',
    surgeryDate: '',
    dischargeDate: '',
    pathway: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    hospitalName: '',
    surgeonName: '',
    clinicPhone: '',
  },
  currentDay: 0,
  totalDays: 0,
  isConfirmed: false,
  extractions: [],
  medications: [],
  tasks: [],
  restrictions: [],
  redFlags: [],
  followUps: [],
  doctorQuestions: [],
};

interface PlanState {
  plan: RecoveryPlan;
  isProcessingDoc: boolean;
  processingStage: number;
  processingStageLabel: string;
  uploadedFile: { name: string; size: string; type: string; url?: string; fileObj?: File } | null;
  uploadedDocumentId: string | null;
  selectedExtractionId: string | null;
  activeTimelineDay: number;
  isSyncing: boolean;
  syncError: string | null;

  // Actions
  setUploadedFile: (
    file: { name: string; size: string; type: string; url?: string; fileObj?: File } | null,
  ) => void;
  startDocProcessing: (onComplete: () => void) => Promise<void>;
  setSelectedExtractionId: (id: string | null) => void;
  setExtractions: (extractions: ExtractionField[], planId?: string) => void;
  updateExtractionField: (id: string, updates: Partial<ExtractionField>) => Promise<void>;
  confirmAllExtractions: () => Promise<void>;
  confirmAndActivatePlan: (planId?: string) => Promise<void>;
  setActiveTimelineDay: (day: number) => void;

  // Task & Med Actions
  toggleTaskStatus: (taskId: string) => void;
  recordMedicationAction: (
    medId: string,
    status: 'taken' | 'skipped',
    notes?: string,
  ) => Promise<void>;

  // Doctor Questions
  addDoctorQuestion: (questionText: string, reason?: string) => Promise<void>;
  toggleDoctorQuestionAnswered: (id: string) => Promise<void>;

  // Remote Sync & Offline
  fetchRemotePlan: (planId?: string) => Promise<boolean>;
  saveOfflineSnapshot: () => void;
  loadOfflineSnapshot: () => boolean;

  // Demo Reset
  loadDemoPatient: () => void;
  resetAll: () => void;
  setPatientProfile: (profile: Partial<UserProfile>) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: DEMO_MODE ? MOCK_INITIAL_PLAN : EMPTY_PLAN,
  isProcessingDoc: false,
  processingStage: 0,
  processingStageLabel: 'Preparing document',
  uploadedFile: DEMO_MODE
    ? {
        name: 'Discharge_Summary_Laparoscopy_90284.pdf',
        size: '1.4 MB',
        type: 'application/pdf',
      }
    : null,
  uploadedDocumentId: null,
  selectedExtractionId: DEMO_MODE ? 'ext-med-1' : null,
  activeTimelineDay: DEMO_MODE ? 3 : 1,
  isSyncing: false,
  syncError: null,

  setUploadedFile: (file) => set((state) => ({
    uploadedFile: file,
    uploadedDocumentId: null,
    plan: file ? { ...state.plan, extractions: [] } : state.plan,
  })),
  setPatientProfile: (profile) => {
    set((state) => ({
      plan: {
        ...state.plan,
        patientProfile: {
          ...state.plan.patientProfile,
          ...profile,
        },
      },
    }));
    get().saveOfflineSnapshot();
  },

  startDocProcessing: async (onComplete) => {
    set({ isProcessingDoc: true, processingStage: 1, processingStageLabel: 'Quality check & resolution analysis' });

    const currentFile = get().uploadedFile?.fileObj;

    if (currentFile) {
      try {
        // Attempt backend document upload
        const uploadRes = await documentsApi.upload(currentFile);
        if (uploadRes && uploadRes.documentId) {
          set({ uploadedDocumentId: uploadRes.documentId });
          await documentsApi.triggerProcessing(uploadRes.documentId);
        }
      } catch (err) {
        console.warn('Backend document upload skipped, proceeding with deterministic simulated pipeline:', err);
      }
    }

    const stages = [
      { delay: 600, label: 'Quality analysis & contrast check passed' },
      { delay: 1200, label: 'OCR reading text layout & structured pages' },
      { delay: 1800, label: 'Clinical entity extraction (meds, diet, follow-ups)' },
      { delay: 2400, label: 'Schema validation & RxNorm verification' },
      { delay: 3000, label: 'Ready for patient verification' },
    ];

    stages.forEach((stage, idx) => {
      setTimeout(() => {
        set({ processingStage: idx + 2, processingStageLabel: stage.label });
        if (idx === stages.length - 1) {
          set({ isProcessingDoc: false });
          get().saveOfflineSnapshot();
          onComplete();
        }
      }, stage.delay);
    });
  },

  setSelectedExtractionId: (id) => set({ selectedExtractionId: id }),

  setExtractions: (extractions: ExtractionField[], planId?: string) => {
    set((state) => ({
      plan: {
        ...state.plan,
        ...(planId ? { id: planId } : {}),
        extractions,
      },
      selectedExtractionId: extractions.length > 0 ? extractions[0].id : state.selectedExtractionId,
    }));
    get().saveOfflineSnapshot();
  },

  updateExtractionField: async (id, updates) => {
    // 1. Optimistic UI update
    set((state) => ({
      plan: {
        ...state.plan,
        extractions: state.plan.extractions.map((item) =>
          item.id === id ? { ...item, ...updates, manuallyEdited: true } : item
        ),
      },
    }));

    // 2. Persist to backend if extraction ID is available
    try {
      const plan = get().plan;
      if (updates.value) {
        await extractionApi.updateField(plan.id, id, updates.value, updates.notes);
      }
    } catch (err) {
      console.warn('Backend extraction field update failed, kept locally:', err);
    }

    get().saveOfflineSnapshot();
  },

  confirmAllExtractions: async () => {
    set((state) => ({
      plan: {
        ...state.plan,
        extractions: state.plan.extractions.map((item) => ({
          ...item,
          status: 'confirmed',
        })),
      },
    }));

    try {
      await extractionApi.confirm(get().plan.id);
    } catch (err) {
      console.warn('Backend extraction confirm skipped or offline:', err);
    }

    get().saveOfflineSnapshot();
  },

  confirmAndActivatePlan: async (planId?: string) => {
    const targetPlanId = planId || get().plan.id;
    set((state) => ({
      plan: {
        ...state.plan,
        ...(targetPlanId ? { id: targetPlanId } : {}),
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
      },
    }));

    try {
      if (targetPlanId) {
        await plansApi.confirm(targetPlanId);
      }
    } catch (err) {
      console.warn('Backend plan confirm skipped or offline:', err);
    }

    get().saveOfflineSnapshot();
  },

  setActiveTimelineDay: (day) => set({ activeTimelineDay: day }),

  toggleTaskStatus: async (taskId) => {
    let newStatus: 'completed' | 'pending' = 'completed';
    set((state) => ({
      plan: {
        ...state.plan,
        tasks: state.plan.tasks.map((t) => {
          if (t.id === taskId) {
            newStatus = t.status === 'completed' ? 'pending' : 'completed';
            return { ...t, status: newStatus };
          }
          return t;
        }),
      },
    }));

    try {
      await plansApi.updateTask(taskId, newStatus);
    } catch (err) {
      console.warn('Backend updateTask offline or failed, queuing to offlineStorage outbox:', err);
      try {
        await offlineStorage.queueMutation({
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          entity: 'task_event',
          action: 'UPDATE',
          payload: { taskId, status: newStatus },
          clientTimestamp: new Date().toISOString(),
        });
      } catch (storageErr) {
        console.error('Failed to queue offline task mutation:', storageErr);
      }
    }

    get().saveOfflineSnapshot();
  },

  recordMedicationAction: async (medId, status, notes) => {
    const now = new Date().toISOString();

    // 1. Optimistic update
    set((state) => ({
      plan: {
        ...state.plan,
        medications: state.plan.medications.map((m) => {
          if (m.id === medId || (m as any).schedules?.some((s: any) => s.id === medId)) {
            return {
              ...m,
              todayStatus: status,
              history: [{ timestamp: now, status, notes }, ...m.history],
            };
          }
          return m;
        }),
      },
    }));

    // Find the target medication and resolve a valid schedule ID
    const med = get().plan.medications.find(
      (m) => m.id === medId || (m as any).schedules?.some((s: any) => s.id === medId)
    );
    const scheduleId = (med as any)?.schedules?.find((s: any) => s.id === medId)?.id
      || (med as any)?.schedules?.[0]?.id
      || (medId.startsWith('sched-') ? medId : null);

    // 2. Call backend medication event endpoint if schedule ID is available
    if (scheduleId) {
      try {
        await medicationsApi.logEvent(scheduleId, {
          status: status === 'taken' ? 'TAKEN' : 'SKIPPED',
          notes,
        });
      } catch (err) {
        console.warn('Backend medication event log skipped or offline:', err);
        try {
          await offlineStorage.queueMutation({
            id: `med-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            entity: 'medication_log',
            action: 'CREATE',
            payload: { medicationId: med?.id || medId, scheduleId, status, notes, actedAt: now },
            clientTimestamp: now,
          });
        } catch (e) {
          console.warn('Failed to queue offline medication mutation:', e);
        }
      }
    } else {
      // Offline or client-generated plan without server schedule IDs
      try {
        await offlineStorage.queueMutation({
          id: `med-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          entity: 'medication_log',
          action: 'CREATE',
          payload: { medicationId: med?.id || medId, status, notes, actedAt: now },
          clientTimestamp: now,
        });
      } catch (e) {
        console.warn('Failed to queue offline medication mutation:', e);
      }
    }

    get().saveOfflineSnapshot();
  },

  addDoctorQuestion: async (questionText, reason = 'Patient added during recovery') => {
    const newQ: DoctorQuestion = {
      id: `dq-${Date.now()}`,
      question: questionText,
      sourceReason: reason,
      category: 'custom',
      isAnswered: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      plan: {
        ...state.plan,
        doctorQuestions: [newQ, ...state.plan.doctorQuestions],
      },
    }));

    get().saveOfflineSnapshot();
  },

  toggleDoctorQuestionAnswered: async (id) => {
    set((state) => ({
      plan: {
        ...state.plan,
        doctorQuestions: state.plan.doctorQuestions.map((q) =>
          q.id === id ? { ...q, isAnswered: !q.isAnswered } : q
        ),
      },
    }));

    try {
      await questionsApi.resolve(id, 'Patient marked answered');
    } catch (err) {
      console.warn('Backend question resolve skipped or offline:', err);
    }

    get().saveOfflineSnapshot();
  },

  fetchRemotePlan: async (planId) => {
    set({ isSyncing: true, syncError: null });
    try {
      let remotePlan: any = null;

      if (planId) {
        remotePlan = await plansApi.getById(planId);
      } else {
        const userPlans = await plansApi.listUserPlans();
        if (Array.isArray(userPlans) && userPlans.length > 0) {
          // Get the most recent ACTIVE plan, or first DRAFT
          remotePlan = userPlans.find((p: any) => p.status === 'ACTIVE') || userPlans[0];
        }
      }

      if (remotePlan) {
        // Calculate currentDay from discharge date
        const dischargeDate = remotePlan.dischargeDate || remotePlan.surgeryDate;
        let currentDay = 1;
        if (dischargeDate) {
          const discharge = new Date(dischargeDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          discharge.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today.getTime() - discharge.getTime()) / (1000 * 60 * 60 * 24));
          currentDay = Math.max(1, Math.min(15, diffDays + 1));
        }

        // Map backend medications to frontend MedicationItem shape
        const medications = (remotePlan.medications || []).map((med: any) => ({
          id: med.id,
          name: med.name,
          dose: med.dose || '',
          unit: med.doseUnit || '',
          frequency: med.frequency || '',
          timing: med.timing || '',
          duration: med.durationDays ? `${med.durationDays} days` : '',
          startDate: med.startDate || dischargeDate || '',
          endDate: med.endDate || '',
          durationDays: med.durationDays,
          sourceText: med.sourceText || '',
          confidence: (med.validationStatus === 'CONFIRMED' ? 'high' : 'medium') as any,
          todayStatus: 'pending' as const,
          history: [],
          instructions: med.instructions || '',
          schedules: med.schedules || [],
        }));

        // Map backend tasks to frontend RecoveryTask shape
        const tasks = (remotePlan.tasks || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          dayNumber: (task.dayOffset ?? 0) + 1, // dayOffset is 0-based
          category: 'activity' as const,
          scheduledTime: task.scheduledDate,
          status: task.status === 'COMPLETED' ? 'completed' : task.status === 'SKIPPED' ? 'skipped' : 'pending',
          sourceReference: task.sourceText || '',
        }));

        // Map follow-ups
        const followUps = (remotePlan.followUps || []).map((fu: any) => ({
          id: fu.id,
          date: fu.scheduledDate ? fu.scheduledDate.split('T')[0] : '',
          time: fu.scheduledDate ? fu.scheduledDate.split('T')[1]?.substring(0, 5) : '',
          clinician: fu.clinicianName || '',
          specialty: fu.clinicianRole || fu.appointmentType || '',
          location: '',
          purpose: fu.purpose || '',
          tests: [],
          preparation: '',
          sourceReference: fu.sourceText || '',
          reminderStatus: 'scheduled' as const,
        }));

        // Build the full updated plan
        const updatedPlan: any = {
          ...get().plan,
          id: remotePlan.id,
          isConfirmed: remotePlan.status === 'ACTIVE',
          confirmedAt: remotePlan.confirmedAt || undefined,
          currentDay,
          totalDays: 15, // PRD v3.0: always 15 days
          patientProfile: {
            ...get().plan.patientProfile,
            surgeryDate: remotePlan.surgeryDate || '',
            dischargeDate: remotePlan.dischargeDate || '',
            surgeryType: remotePlan.surgeryType || '',
            hospitalName: remotePlan.hospitalName || '',
            surgeonName: remotePlan.clinicianName || '',
            pathway: remotePlan.template?.identifier || '',
          },
          medications: medications.length > 0 ? medications : get().plan.medications,
          tasks: tasks.length > 0 ? tasks : get().plan.tasks,
          followUps: followUps.length > 0 ? followUps : get().plan.followUps,
        };

        set({
          plan: updatedPlan,
          activeTimelineDay: currentDay,
          isSyncing: false,
        });
        get().saveOfflineSnapshot();
        return true;
      }
    } catch (err: any) {
      console.warn('fetchRemotePlan falling back to cached state:', err);
      set({ isSyncing: false, syncError: err?.message || 'Sync failed' });
    }
    return false;
  },

  saveOfflineSnapshot: () => {
    try {
      const snapshot = {
        plan: get().plan,
        activeTimelineDay: get().activeTimelineDay,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // LocalStorage quota or disabled
    }
    offlineStorage.savePlanSnapshot(get().plan).catch(() => {});
  },

  loadOfflineSnapshot: () => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.plan) {
          if (!DEMO_MODE && (
            parsed.plan.id?.includes('chole') ||
            parsed.plan.id?.includes('demo') ||
            parsed.plan.id?.includes('mock') ||
            parsed.plan.patientProfile?.name?.includes('Maria')
          )) {
            localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
            return false;
          }
          set({
            plan: parsed.plan,
            activeTimelineDay: parsed.activeTimelineDay || 1,
          });
          return true;
        }
      }
    } catch (e) {
      // ignore
    }
    return false;
  },

  loadDemoPatient: () => {
    set({
      plan: JSON.parse(JSON.stringify(MOCK_INITIAL_PLAN)),
      activeTimelineDay: 1,
      selectedExtractionId: 'ext-med-1',
      uploadedFile: {
        name: 'Discharge_Summary_Laparoscopy_90284.pdf',
        size: '1.4 MB',
        type: 'application/pdf',
      },
    });
    get().saveOfflineSnapshot();
  },

  resetAll: () => {
    set({
      plan: DEMO_MODE
        ? { ...MOCK_INITIAL_PLAN, isConfirmed: false }
        : { ...EMPTY_PLAN },
      activeTimelineDay: 1,
      selectedExtractionId: null,
      uploadedFile: null,
      uploadedDocumentId: null,
    });
    get().saveOfflineSnapshot();
  },
}));
