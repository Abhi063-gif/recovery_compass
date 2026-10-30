export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ItemStatus = 'pending_verification' | 'confirmed' | 'unclear' | 'conditional';
export type SafetySeverity = 'NORMAL' | 'MONITOR' | 'EMERGENCY';
export type ItemCategory = 
  | 'medication' 
  | 'task' 
  | 'restriction' 
  | 'diet_hydration' 
  | 'test' 
  | 'follow_up' 
  | 'red_flag';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractionField {
  id: string;
  category: ItemCategory;
  fieldName: string;
  value: string;
  sourceText: string;
  page: number;
  boundingBox?: BoundingBox;
  confidence: ConfidenceLevel;
  validationStatus: 'valid' | 'warning' | 'unclear' | 'conditional';
  manuallyEdited: boolean;
  condition?: string; // e.g. "Pending physical therapist approval"
  status: ItemStatus;
  notes?: string;
}

export interface MedicationEvent {
  timestamp: string;
  status: 'taken' | 'skipped';
  notes?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  timing: string; // e.g., "Morning with food", "Night at bedtime"
  duration: string;
  startDate: string;
  endDate?: string;
  sourceText: string;
  confidence: ConfidenceLevel;
  todayStatus?: 'taken' | 'skipped' | 'pending';
  history: MedicationEvent[];
  condition?: string;
  durationDays?: number;
  schedules?: any[];
}

export interface RecoveryTask {
  id: string;
  title: string;
  description: string;
  dayNumber: number; // e.g. Day 1, Day 2...
  category: 'activity' | 'wound_care' | 'diet' | 'breathing' | 'hydration';
  scheduledTime?: string;
  status: 'pending' | 'completed' | 'skipped';
  condition?: string;
  sourceReference: string;
}

export interface SymptomLog {
  id: string;
  timestamp: string;
  painScore: number; // 0-10
  selectedSymptoms: string[];
  customSymptom?: string;
  temperature?: number;
  notes?: string;
}

export interface RedFlagRule {
  id: string;
  trigger: string;
  severity: SafetySeverity;
  action: string;
  sourceReference: string;
}

export interface SafetyAlert {
  id: string;
  triggerSymptom: string;
  severity: SafetySeverity;
  actionRequired: string;
  sourceReference: string;
  timestamp: string;
  emergencyPhone?: string;
  doctorPhone?: string;
}

export interface FollowUpAppointment {
  id: string;
  date: string;
  time: string;
  clinician: string;
  specialty: string;
  location: string;
  purpose: string;
  tests?: string[];
  preparation?: string;
  sourceReference: string;
  reminderStatus: 'scheduled' | 'sent' | 'dismissed';
}

export interface DoctorQuestion {
  id: string;
  question: string;
  sourceReason: string;
  category: 'unclear_extraction' | 'symptom_trend' | 'missed_med' | 'conditional_rule' | 'custom';
  isAnswered: boolean;
  createdAt: string;
}

export interface FamilyMemberPermissions {
  viewPlan: boolean;
  receiveAlerts: boolean;
  logSymptoms: boolean;
  markMedicines: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'revoked';
  permissions: FamilyMemberPermissions;
  invitedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'medication' | 'task' | 'safety' | 'followup' | 'family';
  timestamp: string;
  isRead: boolean;
  isUrgent?: boolean;
}

export interface UserProfile {
  name: string;
  role: 'patient' | 'caregiver' | 'asha' | 'anm' | 'vhv' | 'phc_medical_officer' | 'admin';
  language: string;
  surgeryType?: string;
  surgeryDate: string;
  dischargeDate: string;
  pathway: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  hospitalName: string;
  surgeonName: string;
  clinicPhone: string;
}

export interface RecoveryPlan {
  id: string;
  patientProfile: UserProfile;
  currentDay: number;
  totalDays: number;
  isConfirmed: boolean;
  confirmedAt?: string;
  extractions: ExtractionField[];
  medications: MedicationItem[];
  tasks: RecoveryTask[];
  restrictions: string[];
  redFlags: RedFlagRule[];
  followUps: FollowUpAppointment[];
  doctorQuestions: DoctorQuestion[];
}
