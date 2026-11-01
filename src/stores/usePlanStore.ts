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
import { offlineStorage, sanitizePlanForOfflineStorage } from '@/services/offlineSync';

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
  applyLiveMedicationUpdate: (
    scheduleOrMedId: string,
    status: 'taken' | 'skipped' | 'pending' | 'scheduled',
    notes?: string,
    recordedAt?: string,
  ) => void;

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
    set({
      isProcessingDoc: true,
      processingStage: 1,
      processingStageLabel: 'Uploading document and initiating security checks',
    });

    let targetDocId = get().uploadedDocumentId;
    const currentFile = get().uploadedFile?.fileObj;

    if (currentFile && !targetDocId) {
      try {
        const uploadRes = await documentsApi.upload(currentFile);
        targetDocId = uploadRes?.documentId || uploadRes?.id || null;
        if (targetDocId) {
          set({ uploadedDocumentId: targetDocId });
          await documentsApi.triggerProcessing(targetDocId);
        }
      } catch (err) {
        console.warn('Backend document upload skipped or offline:', err);
      }
    } else if (targetDocId) {
      try {
        await documentsApi.triggerProcessing(targetDocId);
      } catch (err) {
        console.warn('Backend document triggerProcessing skipped or offline:', err);
      }
    }

    if (!targetDocId) {
      // Offline fallback: set stage and complete after brief fallback
      set({
        isProcessingDoc: false,
        processingStage: 6,
        processingStageLabel: 'Ready for patient verification',
      });
      get().saveOfflineSnapshot();
      onComplete();
      return;
    }

    // Poll documentsApi.getStatus(targetDocId) at 2s intervals until status reaches NEEDS_REVIEW or CONFIRMED
    const STAGE_STATUS_MAP: Record<string, { stage: number; label: string }> = {
      PENDING: { stage: 1, label: 'Document queued for processing' },
      QUALITY_ANALYSIS: { stage: 2, label: 'Checking document quality & resolution' },
      QUALITY_FAILED: { stage: 2, label: 'Document quality check failed' },
      OCR_PROCESSING: { stage: 3, label: 'Reading document text (OCR)' },
      OCR_DONE: { stage: 4, label: 'OCR reading complete' },
      EXTRACTING: { stage: 4, label: 'Extracting clinical instructions (AI)' },
      EXTRACTION_DONE: { stage: 5, label: 'Validating against medical schema' },
      NEEDS_REVIEW: { stage: 6, label: 'Ready for patient verification' },
      CONFIRMED: { stage: 6, label: 'Ready for patient verification' },
    };

    const pollIntervalMs = 2000;
    const maxAttempts = 60; // 120s timeout
    let attempts = 0;

    const poll = async (): Promise<void> => {
      attempts++;
      try {
        const doc = await documentsApi.getStatus(targetDocId!);
        const currentStatus = doc?.status;
        const stageInfo = currentStatus ? STAGE_STATUS_MAP[currentStatus] : null;

        if (stageInfo) {
          set({ processingStage: stageInfo.stage, processingStageLabel: stageInfo.label });
        }

        if (currentStatus === 'NEEDS_REVIEW' || currentStatus === 'CONFIRMED') {
          set({
            isProcessingDoc: false,
            processingStage: 6,
            processingStageLabel: 'Ready for patient verification',
          });
          get().saveOfflineSnapshot();
          onComplete();
          return;
        }

        if (currentStatus === 'QUALITY_FAILED') {
          set({
            isProcessingDoc: false,
            processingStage: 2,
            processingStageLabel: 'Document quality check failed',
          });
          return;
        }
      } catch (pollErr) {
        console.warn('Error polling document status:', pollErr);
      }

      if (attempts >= maxAttempts) {
        console.warn('Polling document status timed out after 120s');
        set({
          isProcessingDoc: false,
          processingStage: 6,
          processingStageLabel: 'Ready for patient verification',
        });
        get().saveOfflineSnapshot();
        onComplete();
        return;
      }

      setTimeout(poll, pollIntervalMs);
    };

    // Initiate first poll after 2s interval
    setTimeout(poll, pollIntervalMs);
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

  applyLiveMedicationUpdate: (scheduleOrMedId, status, notes, recordedAt) => {
    const timestamp = recordedAt || new Date().toISOString();
    const normalizedStatus: 'taken' | 'skipped' | 'pending' =
      status === 'taken' ? 'taken' : status === 'skipped' ? 'skipped' : 'pending';

    set((state) => ({
      plan: {
        ...state.plan,
        medications: state.plan.medications.map((m) => {
          const isMatch =
            m.id === scheduleOrMedId ||
            (m as any).scheduleId === scheduleOrMedId ||
            (m as any).schedules?.some((s: any) => s.id === scheduleOrMedId) ||
            m.name.toLowerCase() === scheduleOrMedId.toLowerCase();

          if (isMatch) {
            return {
              ...m,
              todayStatus: normalizedStatus,
              history: [
                {
                  timestamp,
                  status: normalizedStatus === 'taken' ? 'taken' : 'skipped',
                  notes: notes || 'Live dose update',
                },
                ...(m.history || []).filter(
                  (h) => Math.abs(new Date(h.timestamp).getTime() - new Date(timestamp).getTime()) > 1000
                ),
              ],
            };
          }
          return m;
        }),
      },
    }));

    get().saveOfflineSnapshot();
  },

  recordMedicationAction: async (medId, status, notes) => {
    const now = new Date().toISOString();

    // 1. Immediate optimistic update across the session
    get().applyLiveMedicationUpdate(medId, status, notes, now);

    // 2. Broadcast cross-session and cross-tab via CustomEvent and Storage
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('rc:medication-updated', {
            detail: { medId, status, notes, timestamp: now },
          })
        );
        localStorage.setItem(
          'rc_live_dose_sync',
          JSON.stringify({ medId, status, notes, timestamp: now })
        );
      } catch {
        // Fallback in storage-restricted environments
      }
    }

    // 3. Optimistic state already set via applyLiveMedicationUpdate above

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
      const cleanPlan = sanitizePlanForOfflineStorage(get().plan);
      const snapshot = {
        plan: cleanPlan,
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


// Cross-tab / cross-window live dose synchronization listener
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "rc_live_dose_sync" && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.medId && payload.status) {
          usePlanStore.getState().applyLiveMedicationUpdate(
            payload.medId,
            payload.status,
            payload.notes,
            payload.timestamp
          );
        }
      } catch {
        // ignore json parsing errors
      }
    }

    if (event.key === "rc_family_revocation" && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        window.dispatchEvent(new CustomEvent("rc:caregiver-revoked", { detail: payload }));
      } catch {
        // ignore
      }
    }
  });

  window.addEventListener("rc:medication-updated", ((event: CustomEvent) => {
    const detail = event.detail;
    if (detail && detail.medId && detail.status) {
      usePlanStore.getState().applyLiveMedicationUpdate(
        detail.medId,
        detail.status,
        detail.notes,
        detail.timestamp
      );
    }
  }) as EventListener);
}
