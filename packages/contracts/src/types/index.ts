// Recovery Compass — Shared Type Definitions

export type UserRole = 'PATIENT' | 'CAREGIVER' | 'ADMIN';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN';

export type ValidationStatus =
  | 'VALID'
  | 'NEEDS_REVIEW'
  | 'CONFLICT'
  | 'SUSPECTED_EXTRACTION_ERROR'
  | 'CONFIRMED'
  | 'UNCLEAR';

export type ExtractionCategory =
  | 'MEDICINES'
  | 'FOLLOW_UPS'
  | 'TESTS'
  | 'RESTRICTIONS'
  | 'DIET'
  | 'HYDRATION'
  | 'TASKS'
  | 'SYMPTOMS'
  | 'RED_FLAGS'
  | 'CONDITIONAL_INSTRUCTIONS';

export type PlanStatus =
  | 'DRAFT'
  | 'AWAITING_CONFIRMATION'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type TaskStatus = 'SCHEDULED' | 'COMPLETED' | 'SKIPPED' | 'MISSED';

export type MedicationEventStatus = 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED';

export type RedFlagSeverity = 'INFORMATIONAL' | 'WARNING' | 'URGENT' | 'EMERGENCY';

export type RedFlagAction = 'MONITOR' | 'CONTACT_CLINICIAN' | 'SEEK_EMERGENCY_HELP';

export type CaregiverPermission =
  | 'VIEW_PLAN'
  | 'RECEIVE_ALERTS'
  | 'LOG_SYMPTOMS'
  | 'MARK_MEDICATIONS';

export type NotificationType =
  | 'MEDICATION_REMINDER'
  | 'TASK_REMINDER'
  | 'FOLLOW_UP_REMINDER'
  | 'CAREGIVER_ALERT'
  | 'SAFETY_ALERT'
  | 'SYSTEM';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  patientProfileId?: string;
  caregiverProfileId?: string;
}

export interface ExtractionFieldDto {
  id: string;
  extractionId: string;
  category: ExtractionCategory;
  fieldKey: string;
  value: string | null;
  rawValue?: string | null;
  sourceText?: string | null;
  page?: number | null;
  boundingBox?: BoundingBox | null;
  confidence?: number | null;
  confidenceLevel?: ConfidenceLevel | null;
  validationStatus: ValidationStatus;
  isUnclear: boolean;
  conflictInfo?: any;
  editedValue?: string | null;
  editedAt?: string | null;
  editedBy?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  notes?: string | null;
}

export interface ExtractionDto {
  id: string;
  documentId: string;
  status: string;
  schemaVersion: string;
  fields: ExtractionFieldDto[];
  confirmedAt?: string | null;
  confirmedBy?: string | null;
}

export interface RecoveryTaskDto {
  id: string;
  planId: string;
  title: string;
  description?: string | null;
  dayOffset: number;
  scheduledDate?: string | null;
  status: TaskStatus;
  conditionalStatus?: string | null;
  condition?: string | null;
  isConditional: boolean;
  sourceText?: string | null;
  sourcePage?: number | null;
  sourceBoundingBox?: BoundingBox | null;
}

export interface MedicationScheduleDto {
  id: string;
  medicationId: string;
  scheduledAt: string;
  timeLabel?: string | null;
  events?: {
    id: string;
    status: MedicationEventStatus;
    actedAt: string;
    notes?: string | null;
  }[];
}

export interface MedicationDto {
  id: string;
  planId: string;
  name: string;
  dose: string;
  doseUnit: string;
  frequency: string;
  frequencyCode?: string | null;
  instructions?: string | null;
  startDate?: string | null;
  durationDays?: number | null;
  isAsNeeded: boolean;
  sourceText?: string | null;
  sourcePage?: number | null;
  sourceBoundingBox?: BoundingBox | null;
  validationStatus: ValidationStatus;
  schedules?: MedicationScheduleDto[];
}

export interface SymptomLogDto {
  id: string;
  planId: string;
  painScore?: number | null;
  temperature?: number | null;
  customSymptom?: string | null;
  symptomDefinitionId?: string | null;
  notes?: string | null;
  recordedAt: string;
  loggedBy: string;
}

export interface FollowUpDto {
  id: string;
  planId: string;
  appointmentType: string;
  clinicianName?: string | null;
  clinicianRole?: string | null;
  purpose?: string | null;
  scheduledDate?: string | null;
  relativeDuration?: number | null;
  sourceText?: string | null;
  sourcePage?: number | null;
  isConfirmed: boolean;
}

export interface DoctorQuestionDto {
  id: string;
  planId: string;
  questionText: string;
  context?: string | null;
  sourceType: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedNote?: string | null;
  createdAt: string;
}

export interface FamilyMemberDto {
  id: string;
  patientProfileId: string;
  caregiverProfileId: string;
  caregiverName: string;
  email: string;
  relationship?: string | null;
  permissions: CaregiverPermission[];
  isActive: boolean;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  channel: string;
  status: string;
  subject?: string | null;
  body: string;
  scheduledFor?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
}

export interface SafetyCheckResult {
  triggered: boolean;
  event?: {
    id: string;
    severity: RedFlagSeverity;
    action: RedFlagAction;
    ruleCode: string;
    ruleName: string;
    message: string;
    emergencyMessage?: string;
  };
  details?: string;
}

export interface PlanProgressDto {
  taskCompletion: number;
  medAdherence: number;
  followUpCompletion: number;
  painTrend: { date: string; score: number | null }[];
}

export interface RecoveryPlanDto {
  id: string;
  patientProfileId: string;
  planVersion: number;
  status: PlanStatus;
  surgeryDate?: string | null;
  dischargeDate?: string | null;
  surgeryType?: string | null;
  clinicianName?: string | null;
  hospitalName?: string | null;
  confirmedAt?: string | null;
  tasks: RecoveryTaskDto[];
  medications: MedicationDto[];
  followUps: FollowUpDto[];
  doctorQuestions?: DoctorQuestionDto[];
  symptomLogs?: SymptomLogDto[];
}
