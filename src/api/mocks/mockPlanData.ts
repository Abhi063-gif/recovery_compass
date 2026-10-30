import { ExtractionField, MedicationItem, RecoveryPlan, RecoveryTask, RedFlagRule, FollowUpAppointment, DoctorQuestion, FamilyMember, SymptomLog } from '@/types';

export const SYNTHETIC_DISCHARGE_TEXT = `
ST. JUDE MEMORIAL HOSPITAL — SURGICAL DISCHARGE SUMMARY
Patient: Eleanor Vance | DOB: 14-Aug-1958 | MRN: 90284-A
Attending Surgeon: Dr. Sarah Jenkins, MD, FACS | Department: General Surgery
Procedure: Laparoscopic Cholecystectomy & Adhesiolysis
Surgery Date: 26-Sep-2026 | Discharge Date: 28-Sep-2026

1. DISCHARGE MEDICATIONS:
- Cefuroxime (Zinacef) 500 mg oral tablet, 1 tab twice daily with meals for 5 days. [Finish entire course]
- Paracetamol (Acetaminophen) 650 mg oral tablet, 1 tab every 6 hours as needed for mild-to-moderate pain. Max 3000 mg/day.
- Tramadol 50 mg oral tablet, 1 tab every 8 hours PRN for severe breakthrough pain only. Do not drive.
- Polyethylene Glycol (MiraLAX) 17g dissolved in 8oz water once daily in the morning to prevent constipation.

2. ACTIVITY & WOUND CARE RESTRICTIONS:
- No heavy lifting greater than 10 lbs (4.5 kg) for 4 weeks.
- Keep laparoscopic portal dressings clean and dry. May shower after 48 hours; pat dry gently. Do NOT submerge in bathtub or swimming pool.
- Incentive spirometry: 10 deep breaths every hour while awake for first 4 days to prevent atelectasis.
- Light ambulation: Walk 5-10 minutes indoors 3 times daily.
- Progressive walking: Advance to 20-minute gentle outdoor walking after Day 5 IF approved by surgeon during follow-up call.

3. DIET & HYDRATION:
- Low-fat, bland diet for first 2 weeks. Avoid greasy, spicy, or high-dairy meals.
- Maintain hydration: at least 2.0 to 2.5 Liters of water daily unless restricted.

4. RED-FLAG WARNING SIGNS (CONTACT CLINICIAN OR EMERGENCY):
- Persistent fever > 101.0°F (38.3°C) or shaking chills.
- Incision site redness expanding > 2cm, worsening swelling, or foul-smelling purulent discharge.
- Intractable nausea/vomiting unable to keep liquids down for > 12 hours.
- Sudden shortness of breath, chest pain, or sudden severe calf pain/swelling (Seek immediate Emergency Room care).

5. FOLLOW-UP SCHEDULE:
- Post-op Wound & Pathology Check: With Dr. Sarah Jenkins on 08-Oct-2026 at 10:30 AM (Suite 410, Surgical Pavilion).
- Required prior test: Complete Blood Count (CBC) & LFTs 2 days prior (06-Oct-2026 at hospital outpatient lab).
`;

export const MOCK_EXTRACTIONS: ExtractionField[] = [
  {
    id: 'ext-med-1',
    category: 'medication',
    fieldName: 'Antibiotic (Cefuroxime)',
    value: 'Cefuroxime 500mg, 1 tablet twice daily with meals for 5 days',
    sourceText: 'Cefuroxime (Zinacef) 500 mg oral tablet, 1 tab twice daily with meals for 5 days. [Finish entire course]',
    page: 1,
    boundingBox: { x: 45, y: 160, width: 490, height: 28 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-med-2',
    category: 'medication',
    fieldName: 'Pain Relief (Paracetamol)',
    value: 'Paracetamol 650mg, 1 tablet every 6 hours as needed',
    sourceText: 'Paracetamol (Acetaminophen) 650 mg oral tablet, 1 tab every 6 hours as needed for mild-to-moderate pain. Max 3000 mg/day.',
    page: 1,
    boundingBox: { x: 45, y: 192, width: 490, height: 32 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-med-3',
    category: 'medication',
    fieldName: 'Severe Pain (Tramadol)',
    value: 'Tramadol 50mg, 1 tablet every 8 hours PRN (Severe pain only)',
    sourceText: 'Tramadol 50 mg oral tablet, 1 tab every 8 hours PRN for severe breakthrough pain only. Do not drive.',
    page: 1,
    boundingBox: { x: 45, y: 228, width: 490, height: 28 },
    confidence: 'medium',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
    notes: 'Restricted to severe breakthrough pain. Avoid driving.',
  },
  {
    id: 'ext-med-4',
    category: 'medication',
    fieldName: 'Stool Softener (MiraLAX)',
    value: 'MiraLAX 17g in 8oz water once daily morning',
    sourceText: 'Polyethylene Glycol (MiraLAX) 17g dissolved in 8oz water once daily in the morning to prevent constipation.',
    page: 1,
    boundingBox: { x: 45, y: 260, width: 490, height: 30 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-task-1',
    category: 'task',
    fieldName: 'Incentive Spirometry Breathing',
    value: '10 deep breaths every hour while awake (First 4 days)',
    sourceText: 'Incentive spirometry: 10 deep breaths every hour while awake for first 4 days to prevent atelectasis.',
    page: 1,
    boundingBox: { x: 45, y: 350, width: 490, height: 26 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-task-2',
    category: 'task',
    fieldName: 'Indoor Walking',
    value: 'Walk 5-10 minutes indoors 3 times daily',
    sourceText: 'Light ambulation: Walk 5-10 minutes indoors 3 times daily.',
    page: 1,
    boundingBox: { x: 45, y: 380, width: 490, height: 24 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-task-3',
    category: 'task',
    fieldName: 'Progressive Outdoor Walk (Conditional)',
    value: '20-minute gentle outdoor walk after Day 5',
    sourceText: 'Progressive walking: Advance to 20-minute gentle outdoor walking after Day 5 IF approved by surgeon during follow-up call.',
    page: 1,
    boundingBox: { x: 45, y: 408, width: 490, height: 30 },
    confidence: 'medium',
    validationStatus: 'conditional',
    manuallyEdited: false,
    condition: 'Pending surgeon approval during follow-up check',
    status: 'conditional',
  },
  {
    id: 'ext-rest-1',
    category: 'restriction',
    fieldName: 'Lifting Restriction',
    value: 'No heavy lifting > 10 lbs (4.5 kg) for 4 weeks',
    sourceText: 'No heavy lifting greater than 10 lbs (4.5 kg) for 4 weeks.',
    page: 1,
    boundingBox: { x: 45, y: 310, width: 490, height: 20 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-rest-2',
    category: 'restriction',
    fieldName: 'Bathing / Incision Care',
    value: 'Shower after 48h (pat dry). No bathtub or swimming pool submersion.',
    sourceText: 'Keep laparoscopic portal dressings clean and dry. May shower after 48 hours; pat dry gently. Do NOT submerge in bathtub or swimming pool.',
    page: 1,
    boundingBox: { x: 45, y: 326, width: 490, height: 32 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-diet-1',
    category: 'diet_hydration',
    fieldName: 'Dietary Guidance',
    value: 'Low-fat, bland diet for 2 weeks. Avoid greasy/spicy foods. Drink 2.0-2.5L water daily.',
    sourceText: 'Low-fat, bland diet for first 2 weeks. Avoid greasy, spicy, or high-dairy meals. Maintain hydration: at least 2.0 to 2.5 Liters of water daily unless restricted.',
    page: 1,
    boundingBox: { x: 45, y: 460, width: 490, height: 38 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-rf-1',
    category: 'red_flag',
    fieldName: 'Fever Threshold',
    value: 'Fever > 101.0°F (38.3°C) or shaking chills',
    sourceText: 'Persistent fever > 101.0°F (38.3°C) or shaking chills.',
    page: 1,
    boundingBox: { x: 45, y: 520, width: 490, height: 20 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-rf-2',
    category: 'red_flag',
    fieldName: 'Incision Infection Warning',
    value: 'Redness expanding > 2cm, worsening swelling, or purulent drainage',
    sourceText: 'Incision site redness expanding > 2cm, worsening swelling, or foul-smelling purulent discharge.',
    page: 1,
    boundingBox: { x: 45, y: 544, width: 490, height: 28 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-rf-3',
    category: 'red_flag',
    fieldName: 'Emergency Cardiorespiratory Signs',
    value: 'Sudden shortness of breath, chest pain, or acute calf swelling',
    sourceText: 'Sudden shortness of breath, chest pain, or sudden severe calf pain/swelling (Seek immediate Emergency Room care).',
    page: 1,
    boundingBox: { x: 45, y: 596, width: 490, height: 30 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-fu-1',
    category: 'follow_up',
    fieldName: 'Surgeon Post-Op Check',
    value: '08-Oct-2026 at 10:30 AM with Dr. Sarah Jenkins (Suite 410)',
    sourceText: 'Post-op Wound & Pathology Check: With Dr. Sarah Jenkins on 08-Oct-2026 at 10:30 AM (Suite 410, Surgical Pavilion).',
    page: 1,
    boundingBox: { x: 45, y: 645, width: 490, height: 30 },
    confidence: 'high',
    validationStatus: 'valid',
    manuallyEdited: false,
    status: 'confirmed',
  },
  {
    id: 'ext-test-1',
    category: 'test',
    fieldName: 'Pre-visit Blood Tests (Low Confidence Extraction)',
    value: 'CBC & Liver Function Tests on 06-Oct-2026',
    sourceText: 'Required prior test: Complete Blood Count (CBC) & LFTs 2 days prior (06-Oct-2026 at hospital outpatient lab).',
    page: 1,
    boundingBox: { x: 45, y: 680, width: 490, height: 28 },
    confidence: 'low',
    validationStatus: 'unclear',
    manuallyEdited: false,
    status: 'unclear',
    notes: 'Could not read clinic lab order code reliably. Please verify appointment with hospital lab.',
  },
];

export const MOCK_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Cefuroxime (Zinacef)',
    dose: '500',
    unit: 'mg',
    frequency: 'Twice daily (Every 12h)',
    timing: 'Morning (08:00) & Evening (20:00) with meals',
    duration: '5 days',
    startDate: '2026-09-28',
    endDate: '2026-10-03',
    sourceText: 'Cefuroxime 500 mg oral tablet, 1 tab twice daily with meals for 5 days.',
    confidence: 'high',
    todayStatus: 'pending',
    history: []
  },
  {
    id: 'med-2',
    name: 'Paracetamol (Acetaminophen)',
    dose: '650',
    unit: 'mg',
    frequency: 'Every 6 hours as needed',
    timing: '08:00, 14:00, 20:00 (PRN)',
    duration: '7–10 days as needed',
    startDate: '2026-09-28',
    sourceText: 'Paracetamol 650 mg oral tablet, 1 tab every 6 hours as needed for mild-to-moderate pain. Max 3000 mg/day.',
    confidence: 'high',
    todayStatus: 'pending',
    history: []
  },
  {
    id: 'med-3',
    name: 'Tramadol',
    dose: '50',
    unit: 'mg',
    frequency: 'Every 8 hours PRN (Severe pain only)',
    timing: 'As needed for breakthrough pain',
    duration: 'First 3–4 days only',
    startDate: '2026-09-28',
    sourceText: 'Tramadol 50 mg oral tablet, 1 tab every 8 hours PRN for severe breakthrough pain only.',
    confidence: 'medium',
    todayStatus: 'pending',
    history: []
  },
  {
    id: 'med-4',
    name: 'MiraLAX (Polyethylene Glycol)',
    dose: '17',
    unit: 'g',
    frequency: 'Once daily',
    timing: 'Morning (09:00) with 8oz water',
    duration: 'Until normal bowel movements resume',
    startDate: '2026-09-28',
    sourceText: 'Polyethylene Glycol (MiraLAX) 17g dissolved in 8oz water once daily in morning.',
    confidence: 'high',
    todayStatus: 'pending',
    history: []
  }
];

export const MOCK_TASKS: RecoveryTask[] = [
  {
    id: 'task-1',
    title: 'Incentive Spirometry (Breathing)',
    description: '10 deep slow breaths using spirometer. Hold breath 3 seconds at peak.',
    dayNumber: 1,
    category: 'breathing',
    scheduledTime: '10:00 AM & 03:00 PM',
    status: 'pending',
    sourceReference: 'Incentive spirometry: 10 deep breaths every hour while awake',
  },
  {
    id: 'task-2',
    title: 'Hallway / Room Ambulation',
    description: 'Walk gently for 5 to 10 minutes around the house.',
    dayNumber: 1,
    category: 'activity',
    scheduledTime: '11:30 AM',
    status: 'pending',
    sourceReference: 'Light ambulation: Walk 5-10 minutes indoors 3 times daily.',
  },
  {
    id: 'task-3',
    title: 'Daily Hydration Check (2.0L Target)',
    description: 'Track at least 8 cups (2 Liters) of water today.',
    dayNumber: 1,
    category: 'hydration',
    scheduledTime: 'All day',
    status: 'pending',
    sourceReference: 'Maintain hydration: at least 2.0 to 2.5 Liters of water daily.',
  },
  {
    id: 'task-4',
    title: 'Wound Dressing Inspection',
    description: 'Check small portal bandages. Ensure they are dry with no leaking fluid.',
    dayNumber: 1,
    category: 'wound_care',
    scheduledTime: '06:00 PM',
    status: 'pending',
    sourceReference: 'Keep laparoscopic portal dressings clean and dry.',
  },
  {
    id: 'task-5',
    title: 'Outdoor Walking (Conditional)',
    description: '20-minute gentle outdoor walking.',
    dayNumber: 5,
    category: 'activity',
    scheduledTime: 'Day 5 Morning',
    status: 'pending',
    condition: 'Pending surgeon approval during follow-up call',
    sourceReference: 'Advance to 20-minute outdoor walking after Day 5 IF approved by surgeon.',
  },
];

export const MOCK_RED_FLAGS: RedFlagRule[] = [
  {
    id: 'rf-1',
    trigger: 'Fever > 101.0°F (38.3°C) or shaking chills',
    severity: 'MONITOR',
    action: 'Contact surgical clinic coordinator immediately at (555) 382-9010.',
    sourceReference: 'Persistent fever > 101.0°F (38.3°C) or shaking chills.',
  },
  {
    id: 'rf-2',
    trigger: 'Expanding incision redness (> 2cm), heat, or foul-smelling drainage',
    severity: 'MONITOR',
    action: 'Contact surgical clinic. Do not apply non-prescribed ointments.',
    sourceReference: 'Incision site redness expanding > 2cm, worsening swelling, or foul drainage.',
  },
  {
    id: 'rf-3',
    trigger: 'Sudden chest pain, acute shortness of breath, or sudden calf swelling',
    severity: 'EMERGENCY',
    action: 'Call 911 or proceed immediately to the nearest Emergency Department.',
    sourceReference: 'Sudden shortness of breath, chest pain, or sudden severe calf pain/swelling.',
  },
  {
    id: 'rf-4',
    trigger: 'Severe abdominal pain not relieved by prescribed medication',
    severity: 'MONITOR',
    action: 'Contact Dr. Sarah Jenkins on-call service at (555) 382-9010.',
    sourceReference: 'Severe unremitting pain or intractable nausea > 12h.',
  }
];

export const MOCK_FOLLOW_UPS: FollowUpAppointment[] = [
  {
    id: 'fu-1',
    date: '2026-10-08',
    time: '10:30 AM',
    clinician: 'Dr. Sarah Jenkins, MD',
    specialty: 'General Surgery & Laparoscopy',
    location: 'Surgical Pavilion, Suite 410, St. Jude Memorial Hospital',
    purpose: 'Post-operative incision check, suture evaluation, and pathology review',
    tests: ['Complete Blood Count (CBC)', 'Liver Function Panel (LFTs)'],
    preparation: 'Complete pre-visit blood tests 48 hours prior at outpatient lab. Bring medicine list.',
    sourceReference: 'Post-op Wound & Pathology Check: With Dr. Sarah Jenkins on 08-Oct-2026 at 10:30 AM.',
    reminderStatus: 'scheduled'
  }
];

export const MOCK_DOCTOR_QUESTIONS: DoctorQuestion[] = [
  {
    id: 'dq-1',
    question: 'When is the exact cut-off date to stop taking Cefuroxime antibiotic?',
    sourceReason: 'Extracted 5-day course finishing on Day 5 (03-Oct-2026)',
    category: 'missed_med',
    isAnswered: false,
    createdAt: '2026-09-28T14:00:00Z',
  },
  {
    id: 'dq-2',
    question: 'Can I be cleared for the 20-minute outdoor walk scheduled for Day 5?',
    sourceReason: 'Discharge document marked outdoor walking as conditional on clinician approval',
    category: 'conditional_rule',
    isAnswered: false,
    createdAt: '2026-09-29T10:00:00Z',
  },
  {
    id: 'dq-3',
    question: 'Please confirm lab order details for CBC and LFTs prior to the Oct 8th visit.',
    sourceReason: 'Extraction confidence was low on the lab requisition code',
    category: 'unclear_extraction',
    isAnswered: false,
    createdAt: '2026-09-28T16:30:00Z',
  }
];

export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'David Vance',
    relationship: 'Spouse / Primary Caregiver',
    email: 'david.vance@example.com',
    phone: '+1 (555) 839-2041',
    status: 'active',
    permissions: {
      viewPlan: true,
      receiveAlerts: true,
      logSymptoms: true,
      markMedicines: true
    },
    invitedAt: '2026-09-28T12:00:00Z'
  },
  {
    id: 'fam-2',
    name: 'Clara Vance',
    relationship: 'Daughter',
    email: 'clara.vance@example.com',
    status: 'active',
    permissions: {
      viewPlan: true,
      receiveAlerts: true,
      logSymptoms: false,
      markMedicines: false
    },
    invitedAt: '2026-09-29T09:30:00Z'
  }
];

export const MOCK_SYMPTOM_HISTORY: SymptomLog[] = [
  {
    id: 'sym-1',
    timestamp: '2026-09-28T18:00:00Z',
    painScore: 6,
    selectedSymptoms: ['Surgical site soreness', 'Mild nausea'],
    temperature: 98.6,
    notes: 'First evening home. Soreness around navel port.'
  },
  {
    id: 'sym-2',
    timestamp: '2026-09-29T09:00:00Z',
    painScore: 5,
    selectedSymptoms: ['Surgical site soreness', 'Bloating / gas'],
    temperature: 99.1,
    notes: 'Shoulder tip gas discomfort from laparoscopy.'
  },
  {
    id: 'sym-3',
    timestamp: '2026-09-29T21:00:00Z',
    painScore: 4,
    selectedSymptoms: ['Mild soreness'],
    temperature: 98.8,
    notes: 'Walked in hallway, feeling slightly easier.'
  },
  {
    id: 'sym-4',
    timestamp: '2026-09-30T08:00:00Z',
    painScore: 3,
    selectedSymptoms: ['Mild tenderness'],
    temperature: 98.6,
    notes: 'Slept well. Pain well controlled with Paracetamol.'
  }
];

export const MOCK_INITIAL_PLAN: RecoveryPlan = {
  id: 'plan-chole-90284',
  patientProfile: {
    name: 'Eleanor Vance',
    role: 'patient',
    language: 'en',
    surgeryDate: '2026-09-26',
    dischargeDate: '2026-09-28',
    pathway: 'Post-surgery recovery — Laparoscopic Cholecystectomy',
    emergencyContact: {
      name: 'David Vance',
      phone: '+1 (555) 839-2041',
      relationship: 'Spouse'
    },
    hospitalName: 'St. Jude Memorial Hospital',
    surgeonName: 'Dr. Sarah Jenkins, MD, FACS',
    clinicPhone: '+1 (555) 382-9010'
  },
  currentDay: 1,
  totalDays: 14,
  isConfirmed: true,
  confirmedAt: '2026-09-28T15:00:00Z',
  extractions: MOCK_EXTRACTIONS,
  medications: MOCK_MEDICATIONS,
  tasks: MOCK_TASKS,
  restrictions: [
    'No lifting heavier than 10 lbs (4.5 kg) for 4 weeks.',
    'No baths, hot tubs, or pool immersion until incisions are fully sealed.',
    'Low-fat diet: avoid fried foods, whole milk dairy, and heavy oils for 2 weeks.',
    'Do not drive while taking Tramadol or experiencing abdominal stiffness.'
  ],
  redFlags: MOCK_RED_FLAGS,
  followUps: MOCK_FOLLOW_UPS,
  doctorQuestions: MOCK_DOCTOR_QUESTIONS,
};
