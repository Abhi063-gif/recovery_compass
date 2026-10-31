/**
 * Recovery Compass — Multilingual & Voice Accessibility Service
 *
 * Implements PRD v3.0 Languages:
 * - English (en) [Default across all pages]
 * - Hindi (hi)
 * - Punjabi (pa) [First-class Gurmukhi localization for Punjab public health]
 * - Marathi (mr)
 * - Bengali (bn)
 * - Tamil (ta)
 *
 * Includes text-to-speech (TTS) voice guidance for low-literacy rural patients.
 */

import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';

export type LanguageCode = 'en' | 'hi' | 'pa' | 'mr' | 'bn' | 'ta';

export interface Translations {
  today: string;
  timeline: string;
  medications: string;
  symptoms: string;
  safety: string;
  schemes: string;
  facilities: string;
  ashaCaseload: string;
  anmReview: string;
  family: string;
  verification: string;
  day: string;
  takeMedicine: string;
  completed: string;
  pending: string;
  emergencyTitle: string;
  emergencySubtitle: string;
  emergencyHelp: string;
  callAmbulance: string;
  call108: string;
  verifiedPlan: string;
  verified: string;
  savedOffline: string;
  syncNow: string;
  synced: string;
  readAloud: string;
  tapToListen: string;
  uploadDischarge: string;
  verificationBadge: string;
  restrictions: string;
  followUp: string;
  doctorQuestions: string;
  familyCircle: string;
  ashaVisit: string;
  riskTierHigh: string;
  riskTierMedium: string;
  riskTierLow: string;
  todaysProgress: string;
  todaysTasks: string;
  medicines: string;
  tasks: string;
  appointments: string;
  previousDay: string;
  nextDay: string;

  // Hero & Landing
  heroTitle: string;
  heroSubtitle: string;
  startRecovery: string;
  tryDemo: string;
  howItWorks: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  punjabCoverageBadge: string;

  // ASHA Portal
  ashaTitle: string;
  ashaSubtitle: string;
  searchPatients: string;
  allRisks: string;
  highRisk: string;
  moderateRisk: string;
  stable: string;
  visitedToday: string;
  logHomeVisit: string;
  escalateToAnm: string;
  pillCount: string;
  blisterCheck: string;
  temperature: string;
  bloodPressure: string;
  bloodSugar: string;
  visitNotes: string;
  saveVisit: string;
  emptyCaseloadTitle: string;
  emptyCaseloadDesc: string;
  loadDemoCaseload: string;
  activeFilters: string;
  adherenceRate: string;
  missedDoses: string;
  riskFactors: string;
  village: string;

  // ANM Portal
  anmTitle: string;
  anmSubtitle: string;
  allEscalations: string;
  raised: string;
  acknowledged: string;
  visited: string;
  referred: string;
  resolved: string;
  severityEmergency: string;
  severityUrgent: string;
  severityWarning: string;
  takeSupervisoryAction: string;
  supervisoryNotes: string;
  referralFacility: string;
  closeEscalation: string;
  emptyEscalationsTitle: string;
  emptyEscalationsDesc: string;
  loadDemoEscalations: string;
  referToChc: string;

  // Facilities
  facilitiesTitle: string;
  facilitiesSubtitle: string;
  filterAll: string;
  filterHospitals: string;
  filterChc: string;
  filterPhc: string;
  filterAac: string;
  emergencyHelplines: string;
  callNow: string;
  getDirections: string;
  open247: string;

  // Schemes
  schemesTitle: string;
  schemesSubtitle: string;
  searchSchemesPlaceholder: string;
  applyForScheme: string;
  coverageLimit: string;
  beneficiaryGroup: string;
  keyBenefits: string;
  requiredDocuments: string;

  // Medications Page
  medicationReminders: string;
  medicationSubtitle: string;
  upcoming: string;
  calendars: string;
  noMedsPrescribed: string;
  noMedsDesc: string;
  skip: string;
  taken: string;
  markTaken: string;
  adherenceSummary: string;
  exportCalendar: string;
  duration: string;

  // Symptoms Page
  symptomTracking: string;
  symptomSubtitle: string;
  painLevel: string;
  temperatureLabel: string;
  selectSymptoms: string;
  additionalNotes: string;
  saveLog: string;
  savedSuccess: string;

  // Safety & Red Flags
  urgentAttention: string;
  urgentSubtitle: string;
  warningSign: string;
  recommendedAction: string;
  callClinician: string;
  viewSource: string;
  emergencyDisclaimer: string;

  // Verification Page
  verificationTitle: string;
  verificationSubtitle: string;
  dischargeDocument: string;
  extractedInstructions: string;
  confirmAll: string;
  confirmItem: string;
  reconfirm: string;
  edit: string;
  save: string;
  cancel: string;
  noReadableText: string;
  noReadableTextDesc: string;
  reuploadDoc: string;
  noItemsExtracted: string;
  noItemsExtractedDesc: string;
  nextConfirmPlan: string;

  // Dashboard & Timeline
  greetingMorning: string;
  activeTimeline: string;
  noPlanYet: string;
  uploadDischargeDesc: string;
  nextFollowUp: string;
  calendarView: string;
  symptomTracker: string;
  painScore: string;
  saveSymptomLog: string;
  redFlagSafety: string;
  viewAll: string;
  noAppointments: string;
  fifteenDayCalendar: string;
  weeklyTrend: string;
  noDosesScheduled: string;
  noTasksToday: string;
  of: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    today: 'Today',
    timeline: '15-Day Plan',
    medications: 'Medications',
    symptoms: 'Symptoms',
    safety: 'Red Flags & Safety',
    schemes: 'Govt Schemes',
    facilities: 'Nearby PHCs & Hospitals',
    ashaCaseload: 'ASHA Caseload',
    anmReview: 'ANM Review',
    family: 'Family',
    verification: 'Verification',
    day: 'Day',
    takeMedicine: 'Take Medicine',
    completed: 'Completed',
    pending: 'Pending',
    emergencyTitle: 'Medical Emergency?',
    emergencySubtitle: 'If you have heavy bleeding, severe breathlessness or chest pain:',
    emergencyHelp: 'Emergency / Urgent Help',
    callAmbulance: 'Call 108 Ambulance',
    call108: 'Call 108 Ambulance',
    verifiedPlan: 'Verified Recovery Plan',
    verified: 'Verified',
    savedOffline: 'Saved on phone (Offline ready)',
    syncNow: 'Sync Now',
    synced: 'Fully Synced',
    readAloud: 'Read aloud',
    tapToListen: 'Tap to listen',
    uploadDischarge: 'Upload Discharge Summary',
    verificationBadge: 'Clinician Verified',
    restrictions: 'Restrictions',
    followUp: 'Next Follow-up',
    doctorQuestions: 'Questions for Doctor',
    familyCircle: 'Family Circle',
    ashaVisit: 'ASHA Home Visit',
    riskTierHigh: 'High Risk (Red)',
    riskTierMedium: 'Moderate Risk (Amber)',
    riskTierLow: 'Stable (Green)',
    todaysProgress: "Today's Progress",
    todaysTasks: "Today's Tasks",
    medicines: 'Medicines',
    tasks: 'Tasks',
    appointments: 'Appointments',
    previousDay: 'Previous Day',
    nextDay: 'Next Day',

    heroTitle: 'Hospital Recovery, Clear & Guided at Home',
    heroSubtitle: 'Turn complex discharge summaries into clear daily recovery plans with scheduled medication alarms, danger sign detection, and offline frontline ASHA support across Punjab.',
    startRecovery: 'Upload Discharge Summary',
    tryDemo: 'Try Live Demo',
    howItWorks: 'How RecoveryCompass Works',
    step1Title: '1. Upload Discharge Slip',
    step1Desc: 'Snap a photo of your hospital discharge paper. AI extracts medications, wound care, and follow-up schedules.',
    step2Title: '2. Verify with Clinician',
    step2Desc: 'Review every extracted dose with high safety confidence before plan activation.',
    step3Title: '3. Recover with ASHA Care',
    step3Desc: 'Daily schedules, voice guidance, and frontline ASHA worker home visits keep you protected at home.',
    punjabCoverageBadge: 'Serving Public Health Facilities across Punjab: Ludhiana, Jalandhar, SAS Nagar',

    ashaTitle: 'ASHA Worker Caseload & Field Monitoring',
    ashaSubtitle: 'Track recovering post-discharge patients across your assigned village beat, log home visits, and escalate clinical warning signs to the ANM supervisor.',
    searchPatients: 'Search by patient name, village, or condition...',
    allRisks: 'All Patients',
    highRisk: 'High Risk (Red)',
    moderateRisk: 'Moderate Risk (Amber)',
    stable: 'Stable (Green)',
    visitedToday: 'Visited Today',
    logHomeVisit: 'Log Home Visit',
    escalateToAnm: 'Escalate to ANM',
    pillCount: 'Pill Count / Blister Check',
    blisterCheck: 'Medicines present in blister packaging',
    temperature: 'Body Temperature (°F)',
    bloodPressure: 'Blood Pressure (mmHg)',
    bloodSugar: 'Blood Sugar (mg/dL)',
    visitNotes: 'Observation & Clinical Notes',
    saveVisit: 'Save Visit Record',
    emptyCaseloadTitle: 'No Patients in Caseload',
    emptyCaseloadDesc: 'There are currently no active post-discharge patients assigned to this village beat.',
    loadDemoCaseload: 'Load Punjab Demo Caseload',
    activeFilters: 'Active Filter',
    adherenceRate: 'Adherence Rate',
    missedDoses: 'Missed Doses',
    riskFactors: 'Clinical Risk Factors',
    village: 'Village / Sector',

    anmTitle: 'ANM Clinical Supervisory & Escalation Triage',
    anmSubtitle: 'Review clinical escalations raised by village ASHA workers, assess patient danger signs, issue clinical decisions, and coordinate hospital referrals across the PHC sector.',
    allEscalations: 'All Escalations',
    raised: 'Raised (Action Needed)',
    acknowledged: 'Acknowledged',
    visited: 'ANM Visited',
    referred: 'Referred to Hospital',
    resolved: 'Resolved',
    severityEmergency: 'Emergency Alert',
    severityUrgent: 'Urgent Clinical Review',
    severityWarning: 'Warning / Observation',
    takeSupervisoryAction: 'Review & Take Action',
    supervisoryNotes: 'Supervisory Clinical Notes & Instructions',
    referralFacility: 'Referral Health Facility',
    closeEscalation: 'Confirm Supervisory Decision',
    emptyEscalationsTitle: 'No Pending Escalations',
    emptyEscalationsDesc: 'All patients across your sub-centre sector are currently stable with no unresolved escalations.',
    loadDemoEscalations: 'Load Punjab Demo Escalations',
    referToChc: 'Refer to CHC / Civil Hospital',

    facilitiesTitle: 'Nearby Public Healthcare Facilities',
    facilitiesSubtitle: 'Verified government health facilities across Punjab offering 24/7 emergency care, free medicines under Aam Aadmi Clinics, and surgical follow-ups.',
    filterAll: 'All Facilities',
    filterHospitals: 'District / Sub-Divisional Hospitals',
    filterChc: 'Community Health Centres (CHC)',
    filterPhc: 'Primary Health Centres (PHC)',
    filterAac: 'Aam Aadmi Clinics (AAC)',
    emergencyHelplines: 'Punjab Emergency Helplines',
    callNow: 'Call Facility',
    getDirections: 'Get Directions',
    open247: 'Open 24/7 Emergency',

    schemesTitle: 'National & Punjab Government Health Schemes',
    schemesSubtitle: 'Entitlements, free medicines, cash incentives, and cashless treatment programs available to citizens in Punjab.',
    searchSchemesPlaceholder: 'Search health schemes by name, keyword, or treatment...',
    applyForScheme: 'How to Avail Scheme',
    coverageLimit: 'Coverage / Benefit Limit',
    beneficiaryGroup: 'Target Beneficiaries',
    keyBenefits: 'Key Scheme Benefits',
    requiredDocuments: 'Documents Required',

    // Medications Page
    medicationReminders: 'Medication Reminders',
    medicationSubtitle: 'Prescribed schedule extracted from your discharge instructions.',
    upcoming: 'Upcoming',
    calendars: 'Calendars',
    noMedsPrescribed: 'No Medications Prescribed',
    noMedsDesc: 'Your recovery plan currently has no active medications.',
    skip: 'Skip',
    taken: 'Taken',
    markTaken: 'Take Medicine',
    adherenceSummary: 'Adherence Rate',
    exportCalendar: 'Export Calendar (.ics)',
    duration: 'Duration',

    // Symptoms Page
    symptomTracking: 'Daily Symptom & Vitals Log',
    symptomSubtitle: 'Log your daily recovery progress and detect complications early.',
    painLevel: 'Pain Level (1–10)',
    temperatureLabel: 'Body Temperature (°F)',
    selectSymptoms: 'Select Any Symptoms You Feel Today',
    additionalNotes: 'Additional Observations & Notes',
    saveLog: 'Submit Daily Vitals Log',
    savedSuccess: 'Vitals Recorded Successfully!',

    // Safety & Red Flags
    urgentAttention: 'Urgent Attention Required',
    urgentSubtitle: 'Your logged symptom matches a warning sign in your recovery instructions.',
    warningSign: 'Warning Sign',
    recommendedAction: 'Recommended Action',
    callClinician: 'Call Your Clinician',
    viewSource: 'View Source Instructions',
    emergencyDisclaimer: 'If you feel this is a medical emergency, seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline).',

    // Verification Page
    verificationTitle: 'Discharge Summary Verification',
    verificationSubtitle: 'Review and confirm extracted medical instructions before activating your recovery plan.',
    dischargeDocument: 'Hospital Discharge Document',
    extractedInstructions: 'Extracted Clinical Items',
    confirmAll: 'Confirm All Items',
    confirmItem: 'Confirm Item',
    reconfirm: 'Re-confirm',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    noReadableText: 'No Readable Text Extracted',
    noReadableTextDesc: 'The uploaded document contained no detectable text, legible handwriting, or structured clinical discharge instructions.',
    reuploadDoc: 'Re-upload Clear Document',
    noItemsExtracted: 'No Clinical Instructions Extracted',
    noItemsExtractedDesc: "We couldn't extract any medications, tasks, or follow-ups from this document. Please verify that you uploaded a valid, legible discharge summary.",
    nextConfirmPlan: 'Proceed to Plan Confirmation',

    // Dashboard & Timeline
    greetingMorning: 'Good Morning',
    activeTimeline: 'Active Recovery Timeline',
    noPlanYet: 'No Recovery Plan Yet',
    uploadDischargeDesc: 'Upload your discharge summary to generate your personalised 15-day recovery timeline.',
    nextFollowUp: 'Next Upcoming Follow-up',
    calendarView: 'Calendar View',
    symptomTracker: 'Daily Symptom & Vitals Log',
    painScore: 'Pain Level (1–10)',
    saveSymptomLog: 'Save Daily Check-in',
    redFlagSafety: 'Red Flags & Safety',
    viewAll: 'View All',
    noAppointments: 'No upcoming appointments',
    fifteenDayCalendar: '15-Day Medication Schedule Calendar',
    weeklyTrend: 'Weekly dose completion trend',
    noDosesScheduled: 'No doses scheduled',
    noTasksToday: 'No tasks scheduled for today.',
    of: 'of',
  },

  pa: {
    today: 'ਅੱਜ',
    timeline: '15-ਦਿਨਾਂ ਯੋਜਨਾ',
    medications: 'ਦਵਾਈਆਂ',
    symptoms: 'ਲੱਛਣ',
    safety: 'ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ',
    schemes: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
    facilities: 'ਨੇੜਲੇ ਹਸਪਤਾਲ',
    ashaCaseload: 'ਆਸ਼ਾ ਵਰਕਰ ਸੂਚੀ',
    anmReview: 'ਏ.ਐਨ.ਐਮ ਸਮੀਖਿਆ',
    family: 'ਪਰਿਵਾਰ',
    verification: 'ਤਸਦੀਕ',
    day: 'ਦਿਨ',
    takeMedicine: 'ਦਵਾਈ ਲਓ',
    completed: 'ਪੂਰਾ ਹੋਇਆ',
    pending: 'ਬਾਕੀ',
    emergencyTitle: 'ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਚਾਹੀਦੀ ਹੈ?',
    emergencySubtitle: 'ਜੇਕਰ ਜ਼ਿਆਦਾ ਖੂਨ ਵਹਿ ਰਿਹਾ ਹੋਵੇ, ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਹੋਵੇ:',
    emergencyHelp: 'ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ',
    callAmbulance: '108 ਐਂਬੂਲੈਂਸ ਨੂੰ ਕਾਲ ਕਰੋ',
    call108: '108 ਐਂਬੂਲੈਂਸ ਨੂੰ ਕਾਲ ਕਰੋ',
    verifiedPlan: 'ਤਸਦੀਕਸ਼ੁਦਾ ਯੋਜਨਾ',
    verified: 'ਤਸਦੀਕਸ਼ੁਦਾ',
    savedOffline: 'ਫ਼ੋਨ ਤੇ ਸੁਰੱਖਿਅਤ',
    syncNow: 'ਹੁਣੇ ਸਿੰਕ ਕਰੋ',
    synced: 'ਸਿੰਕ ਹੋ ਗਿਆ',
    readAloud: 'ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣੋ',
    tapToListen: 'ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣੋ',
    uploadDischarge: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ',
    verificationBadge: 'ਡਾਕਟਰ ਵੱਲੋਂ ਤਸਦੀਕਸ਼ੁਦਾ',
    restrictions: 'ਪ੍ਰਹੇਜ਼ ਤੇ ਸਾਵਧਾਨੀਆਂ',
    followUp: 'ਅਗਲੀ ਜਾਂਚ',
    doctorQuestions: 'ਡਾਕਟਰ ਨੂੰ ਪੁੱਛਣ ਵਾਲੇ ਸਵਾਲ',
    familyCircle: 'ਪਰਿਵਾਰ ਮੈਂਬਰ',
    ashaVisit: 'ਆਸ਼ਾ ਵਰਕਰ ਫੇਰੀ',
    riskTierHigh: 'ਉੱਚ ਖ਼ਤਰਾ (ਲਾਲ)',
    riskTierMedium: 'ਦਰਮਿਆਨਾ ਖ਼ਤਰਾ (ਪੀਲਾ)',
    riskTierLow: 'ਸੁਰੱਖਿਅਤ (ਹਰਾ)',
    todaysProgress: 'ਅੱਜ ਦੀ ਤਰੱਕੀ',
    todaysTasks: 'ਅੱਜ ਦੇ ਕੰਮ',
    medicines: 'ਦਵਾਈਆਂ',
    tasks: 'ਕੰਮ',
    appointments: 'ਮੁਲਾਕਾਤਾਂ',
    previousDay: 'ਪਿਛਲਾ ਦਿਨ',
    nextDay: 'ਅਗਲਾ ਦਿਨ',

    heroTitle: 'ਹਸਪਤਾਲ ਤੋਂ ਛੁੱਟੀ ਮਗਰੋਂ ਘਰ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਸਿਹਤ ਸੰਭਾਲ',
    heroSubtitle: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਨੂੰ ਸੌਖੇ ਰੋਜ਼ਾਨਾ ਰਿਕਵਰੀ ਪਲਾਨ, ਦਵਾਈਆਂ ਦੇ ਰੀਮਾਈਂਡਰ, ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨਾਂ ਅਤੇ ਆਸ਼ਾ ਵਰਕਰ ਸਹਾਇਤਾ ਨਾਲ ਸਮਝੋ।',
    startRecovery: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ',
    tryDemo: 'ਲਾਈਵ ਡੈਮੋ ਵੇਖੋ',
    howItWorks: 'ਰਿਕਵਰੀ ਕੰਪਾਸ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    step1Title: '1. ਡਿਸਚਾਰਜ ਪਰਚੀ ਦੀ ਫੋਟੋ ਲਓ',
    step1Desc: 'ਹਸਪਤਾਲ ਦੀ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ। ਏ.ਆਈ. ਦਵਾਈਆਂ ਅਤੇ ਅਗਲੀ ਜਾਂਚ ਆਪਣੇ ਆਪ ਪੜ੍ਹ ਲਵੇਗਾ।',
    step2Title: '2. ਡਾਕਟਰ ਵੱਲੋਂ ਤਸਦੀਕ',
    step2Desc: 'ਹਰੇਕ ਦਵਾਈ ਦੀ ਖੁਰਾਕ ਅਤੇ ਸਮੇਂ ਦੀ ਪੁਸ਼ਟੀ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
    step3Title: '3. ਆਸ਼ਾ ਵਰਕਰ ਵੱਲੋਂ ਨਿਗਰਾਨੀ',
    step3Desc: 'ਰੋਜ਼ਾਨਾ ਦਵਾਈ ਦੇ ਸਮੇਂ, ਆਵਾਜ਼ ਵਿੱਚ ਹਦਾਇਤਾਂ ਅਤੇ ਆਸ਼ਾ ਵਰਕਰ ਦੀ ਫੇਰੀ ਨਾਲ ਪੂਰੀ ਸੁਰੱਖਿਆ।',
    punjabCoverageBadge: 'ਪੰਜਾਬ ਦੇ ਸਰਕਾਰੀ ਹਸਪਤਾਲਾਂ ਲਈ ਸਮਰਪਿਤ: ਲੁਧਿਆਣਾ, ਜਲੰਧਰ, ਐਸ.ਏ.ਐਸ ਨਗਰ ਮੋਹਾਲੀ',

    ashaTitle: 'ਆਸ਼ਾ ਵਰਕਰ ਕੇਸਲੋਡ ਤੇ ਨਿਗਰਾਨੀ ਪੋਰਟਲ',
    ashaSubtitle: 'ਆਪਣੇ ਪਿੰਡ ਦੇ ਮਰੀਜ਼ਾਂ ਦੀ ਸਿਹਤ ਨਿਗਰਾਨੀ ਕਰੋ, ਘਰ ਦੀ ਫੇਰੀ ਦਰਜ ਕਰੋ ਅਤੇ ਖ਼ਤਰੇ ਦੀ ਹਾਲਤ ਵਿੱਚ ਏ.ਐਨ.ਐਮ ਨੂੰ ਸੂਚਿਤ ਕਰੋ।',
    searchPatients: 'ਮਰੀਜ਼ ਦਾ ਨਾਮ, ਪਿੰਡ ਜਾਂ ਬਿਮਾਰੀ ਖੋਜੋ...',
    allRisks: 'ਸਾਰੇ ਮਰੀਜ਼',
    highRisk: 'ਉੱਚ ਖ਼ਤਰਾ (ਲਾਲ)',
    moderateRisk: 'ਦਰਮਿਆਨਾ ਖ਼ਤਰਾ (ਪੀਲਾ)',
    stable: 'ਸੁਰੱਖਿਅਤ (ਹਰਾ)',
    visitedToday: 'ਅੱਜ ਮੁਲਾਕਾਤ ਹੋਈ',
    logHomeVisit: 'ਘਰ ਦੀ ਫੇਰੀ ਦਰਜ ਕਰੋ',
    escalateToAnm: 'ਏ.ਐਨ.ਐਮ ਨੂੰ ਸੂਚਿਤ ਕਰੋ',
    pillCount: 'ਗੋਲੀਆਂ ਦੀ ਗਿਣਤੀ / ਪੱਤੇ ਦੀ ਜਾਂਚ',
    blisterCheck: 'ਦਵਾਈ ਅਸਲ ਪੈਕਿੰਗ ਵਿੱਚ ਮੌਜੂਦ ਹੈ',
    temperature: 'ਸਰੀਰ ਦਾ ਤਾਪਮਾਨ (°F)',
    bloodPressure: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP)',
    bloodSugar: 'ਸ਼ੂਗਰ ਦਾ ਪੱਧਰ (Sugar)',
    visitNotes: 'ਫੇਰੀ ਦੇ ਨੋਟ ਤੇ ਮੁਲਾਹਜ਼ਾ',
    saveVisit: 'ਫੇਰੀ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    emptyCaseloadTitle: 'ਕੋਈ ਮਰੀਜ਼ ਨਹੀਂ ਮਿਲਿਆ',
    emptyCaseloadDesc: 'ਇਸ ਵੇਲੇ ਤੁਹਾਡੇ ਪਿੰਡ ਦੇ ਹਲਕੇ ਵਿੱਚ ਕੋਈ ਨਵਾਂ ਮਰੀਜ਼ ਦਰਜ ਨਹੀਂ ਹੈ।',
    loadDemoCaseload: 'ਪੰਜਾਬ ਡੈਮੋ ਮਰੀਜ਼ਾਂ ਦੀ ਸੂਚੀ ਲੋਡ ਕਰੋ',
    activeFilters: 'ਮੌਜੂਦਾ ਫਿਲਟਰ',
    adherenceRate: 'ਦਵਾਈ ਲੈਣ ਦੀ ਦਰ',
    missedDoses: 'ਖੁੰਝੀਆਂ ਖੁਰਾਕਾਂ',
    riskFactors: 'ਮੁੱਖ ਖ਼ਤਰੇ ਦੇ ਲੱਛਣ',
    village: 'ਪਿੰਡ / ਹਲਕਾ',

    anmTitle: 'ਏ.ਐਨ.ਐਮ ਕਲੀਨਿਕਲ ਨਿਗਰਾਨੀ ਤੇ ਐਮਰਜੈਂਸੀ ਪੋਰਟਲ',
    anmSubtitle: 'ਆਸ਼ਾ ਵਰਕਰਾਂ ਵੱਲੋਂ ਭੇਜੇ ਗਏ ਗੰਭੀਰ ਮਰੀਜ਼ਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ, ਇਲਾਜ ਦੇ ਫੈਸਲੇ ਲਓ ਅਤੇ ਹਸਪਤਾਲ ਰੈਫਰ ਕਰੋ।',
    allEscalations: 'ਸਾਰੀਆਂ ਸ਼ਿਕਾਇਤਾਂ',
    raised: 'ਨਵੀਂ ਸ਼ਿਕਾਇਤ (ਧਿਆਨ ਮੰਗਦੀ ਹੈ)',
    acknowledged: 'ਸਵੀਕਾਰ ਕੀਤੀ',
    visited: 'ਏ.ਐਨ.ਐਮ ਵੱਲੋਂ ਜਾਂਚ ਮੁਕੰਮਲ',
    referred: 'ਹਸਪਤਾਲ ਰੈਫਰ ਕੀਤਾ',
    resolved: 'ਹੱਲ ਹੋ ਗਿਆ',
    severityEmergency: 'ਐਮਰਜੈਂਸੀ ਚੇਤਾਵਨੀ',
    severityUrgent: 'ਤੁਰੰਤ ਜਾਂਚ ਲੋੜੀਂਦੀ',
    severityWarning: 'ਨਿਗਰਾਨੀ ਹੇਠ',
    takeSupervisoryAction: 'ਸਮੀਖਿਆ ਕਰੋ ਤੇ ਕਾਰਵਾਈ ਕਰੋ',
    supervisoryNotes: 'ਨਿਗਰਾਨੀ ਨੋਟਸ ਅਤੇ ਹਦਾਇਤਾਂ',
    referralFacility: 'ਰੈਫਰ ਕਰਨ ਵਾਲਾ ਹਸਪਤਾਲ',
    closeEscalation: 'ਫੈਸਲਾ ਲਾਗੂ ਕਰੋ',
    emptyEscalationsTitle: 'ਕੋਈ ਗੰਭੀਰ ਕੇਸ ਪੈਂਡਿੰਗ ਨਹੀਂ ਹੈ',
    emptyEscalationsDesc: 'ਤੁਹਾਡੇ ਸਬ-ਸੈਂਟਰ ਅਧੀਨ ਸਾਰੇ ਮਰੀਜ਼ ਇਸ ਵੇਲੇ ਸੁਰੱਖਿਅਤ ਹਨ।',
    loadDemoEscalations: 'ਪੰਜਾਬ ਡੈਮੋ ਐਸਕੇਲੇਸ਼ਨ ਲੋਡ ਕਰੋ',
    referToChc: 'ਸੀ.ਐਚ.ਸੀ / ਸਿਵਲ ਹਸਪਤਾਲ ਰੈਫਰ ਕਰੋ',

    facilitiesTitle: 'ਨੇੜਲੇ ਸਰਕਾਰੀ ਸਿਹਤ ਕੇਂਦਰ ਤੇ ਹਸਪਤਾਲ',
    facilitiesSubtitle: 'ਪੰਜਾਬ ਸਰਕਾਰ ਦੇ ਤਸਦੀਕਸ਼ੁਦਾ ਹਸਪਤਾਲ, ਆਮ ਆਦਮੀ ਕਲੀਨਿਕ ਅਤੇ 24 ਘੰਟੇ ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ।',
    filterAll: 'ਸਾਰੇ ਸਿਹਤ ਕੇਂਦਰ',
    filterHospitals: 'ਜ਼ਿਲ੍ਹਾ / ਸਬ-ਡਿਵੀਜ਼ਨਲ ਹਸਪਤਾਲ',
    filterChc: 'ਕਮਿਊਨਿਟੀ ਹੈਲਥ ਸੈਂਟਰ (CHC)',
    filterPhc: 'ਪ੍ਰਾਇਮਰੀ ਹੈਲਥ ਸੈਂਟਰ (PHC)',
    filterAac: 'ਆਮ ਆਦਮੀ ਕਲੀਨਿਕ (AAC)',
    emergencyHelplines: 'ਪੰਜਾਬ ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨਾਂ',
    callNow: 'ਫੋਨ ਮਿਲਾਓ',
    getDirections: 'ਨਕਸ਼ਾ ਵੇਖੋ',
    open247: '24 ਘੰਟੇ ਐਮਰਜੈਂਸੀ ਖੁੱਲ੍ਹਾ',

    schemesTitle: 'ਕੌਮੀ ਅਤੇ ਪੰਜਾਬ ਸਰਕਾਰ ਦੀਆਂ ਸਿਹਤ ਸਕੀਮਾਂ',
    schemesSubtitle: 'ਮੁਫ਼ਤ ਇਲਾਜ, ਮੁਫ਼ਤ ਦਵਾਈਆਂ ਅਤੇ ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਸਰਬੱਤ ਸਿਹਤ ਬੀਮਾ ਯੋਜਨਾ ਦੀ ਪੂਰੀ ਜਾਣਕਾਰੀ।',
    searchSchemesPlaceholder: 'ਸਕੀਮ ਦਾ ਨਾਮ ਜਾਂ ਇਲਾਜ ਖੋਜੋ...',
    applyForScheme: 'ਸਕੀਮ ਦਾ ਲਾਭ ਕਿਵੇਂ ਲਈਏ',
    coverageLimit: 'ਕਵਰੇਜ / ਸਹਾਇਤਾ ਰਾਸ਼ੀ',
    beneficiaryGroup: 'ਲਾਭਪਾਤਰੀ ਵਰਗ',
    keyBenefits: 'ਮੁੱਖ ਫਾਇਦੇ',
    requiredDocuments: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼',

    // Medications Page
    medicationReminders: 'ਦਵਾਈਆਂ ਦੇ ਰੀਮਾਈਂਡਰ',
    medicationSubtitle: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਤੋਂ ਤਸਦੀਕ ਕੀਤੀਆਂ ਗਈਆਂ ਦਵਾਈਆਂ ਦਾ ਸਮਾਂ-ਸਾਰਣੀ।',
    upcoming: 'ਅਗਲੀਆਂ ਖੁਰਾਕਾਂ',
    calendars: 'ਕੈਲੰਡਰ',
    noMedsPrescribed: 'ਕੋਈ ਦਵਾਈ ਦਰਜ ਨਹੀਂ ਹੈ',
    noMedsDesc: 'ਤੁਹਾਡੇ ਰਿਕਵਰੀ ਪਲਾਨ ਵਿੱਚ ਇਸ ਵੇਲੇ ਕੋਈ ਸਰਗਰਮ ਦਵਾਈ ਨਹੀਂ ਹੈ।',
    skip: 'ਛੱਡੋ',
    taken: 'ਲੈ ਲਈ',
    markTaken: 'ਦਵਾਈ ਲਓ',
    adherenceSummary: 'ਦਵਾਈ ਲੈਣ ਦੀ ਦਰ',
    exportCalendar: 'ਕੈਲੰਡਰ ਡਾਊਨਲੋਡ ਕਰੋ (.ics)',
    duration: 'ਮਿਆਦ',

    // Symptoms Page
    symptomTracking: 'ਰੋਜ਼ਾਨਾ ਲੱਛਣ ਤੇ ਸਿਹਤ ਰਿਕਾਰਡ',
    symptomSubtitle: 'ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਸਿਹਤ ਦੀ ਜਾਂਚ ਦਰਜ ਕਰੋ ਅਤੇ ਖ਼ਤਰੇ ਦੇ ਲੱਛਣਾਂ ਦੀ ਪਛਾਣ ਕਰੋ।',
    painLevel: 'ਦਰਦ ਦਾ ਪੱਧਰ (1–10)',
    temperatureLabel: 'ਸਰੀਰ ਦਾ ਤਾਪਮਾਨ (°F)',
    selectSymptoms: 'ਜੋ ਲੱਛਣ ਤੁਸੀਂ ਅੱਜ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ, ਉਹ ਚੁਣੋ',
    additionalNotes: 'ਹੋਰ ਕੋਈ ਤਕਲੀਫ਼ ਜਾਂ ਜ਼ਰੂਰੀ ਨੋਟ',
    saveLog: 'ਸਿਹਤ ਰਿਕਾਰਡ ਦਰਜ ਕਰੋ',
    savedSuccess: 'ਤੁਹਾਡਾ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹੋ ਗਿਆ!',

    // Safety & Red Flags
    urgentAttention: 'ਤੁਰੰਤ ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੈ',
    urgentSubtitle: 'ਤੁਹਾਡੇ ਦਰਜ ਕੀਤੇ ਲੱਛਣ ਡਿਸਚਾਰਜ ਪਰਚੀ ਵਿਚਲੇ ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਨਾਲ ਮੇਲ ਖਾਂਦੇ ਹਨ।',
    warningSign: 'ਖ਼ਤਰੇ ਦਾ ਨਿਸ਼ਾਨ',
    recommendedAction: 'ਲੋੜੀਂਦੀ ਕਾਰਵਾਈ',
    callClinician: 'ਆਪਣੇ ਡਾਕਟਰ ਨੂੰ ਫ਼ੋਨ ਕਰੋ',
    viewSource: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਵੇਖੋ',
    emergencyDisclaimer: 'ਜੇਕਰ ਇਹ ਗੰਭੀਰ ਐਮਰਜੈਂਸੀ ਹੈ, ਤਾਂ ਤੁਰੰਤ 108 (ਐਂਬੂਲੈਂਸ) ਜਾਂ 104 (ਮੈਡੀਕਲ ਹੈਲਪਲਾਈਨ) ਤੇ ਕਾਲ ਕਰੋ।',

    // Verification Page
    verificationTitle: 'ਡਿਸਚਾਰਜ ਪਰਚੀ ਦੀ ਤਸਦੀਕ',
    verificationSubtitle: 'ਯੋਜਨਾ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਪਰਚੀ ਵਿੱਚੋਂ ਪੜ੍ਹੀਆਂ ਗਈਆਂ ਦਵਾਈਆਂ ਅਤੇ ਹਦਾਇਤਾਂ ਦੀ ਜਾਂਚ ਕਰੋ।',
    dischargeDocument: 'ਹਸਪਤਾਲ ਦੀ ਅਸਲ ਪਰਚੀ',
    extractedInstructions: 'ਪੜ੍ਹੀਆਂ ਗਈਆਂ ਡਾਕਟਰੀ ਹਦਾਇਤਾਂ',
    confirmAll: 'ਸਾਰੀਆਂ ਹਦਾਇਤਾਂ ਤਸਦੀਕ ਕਰੋ',
    confirmItem: 'ਤਸਦੀਕ ਕਰੋ',
    reconfirm: 'ਦੁਬਾਰਾ ਤਸਦੀਕ ਕਰੋ',
    edit: 'ਸੋਧ ਕਰੋ',
    save: 'ਸੁਰੱਖਿਅਤ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    noReadableText: 'ਕੋਈ ਲਿਖਤ ਨਹੀਂ ਪੜ੍ਹੀ ਜਾ ਸਕੀ',
    noReadableTextDesc: 'ਅਪਲੋਡ ਕੀਤੇ ਦਸਤਾਵੇਜ਼ ਵਿੱਚ ਕੋਈ ਸਾਫ਼ ਲਿਖਤ ਜਾਂ ਹਦਾਇਤਾਂ ਨਹੀਂ ਮਿਲੀਆਂ। ਕਿਰਪਾ ਕਰਕੇ ਸਾਫ਼ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।',
    reuploadDoc: 'ਸਾਫ਼ ਦਸਤਾਵੇਜ਼ ਦੁਬਾਰਾ ਅਪਲੋਡ ਕਰੋ',
    noItemsExtracted: 'ਕੋਈ ਡਾਕਟਰੀ ਹਦਾਇਤ ਨਹੀਂ ਮਿਲੀ',
    noItemsExtractedDesc: 'ਇਸ ਦਸਤਾਵੇਜ਼ ਵਿੱਚੋਂ ਕੋਈ ਦਵਾਈ ਜਾਂ ਜਾਂਚ ਸੂਚੀ ਨਹੀਂ ਪੜ੍ਹੀ ਜਾ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਡਿਸਚਾਰਜ ਸਮਰੀ ਅਪਲੋਡ ਕਰੋ।',
    nextConfirmPlan: 'ਯੋਜਨਾ ਤਸਦੀਕ ਵੱਲ ਵਧੋ',

    // Dashboard & Timeline
    greetingMorning: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    activeTimeline: 'ਸਰਗਰਮ ਰਿਕਵਰੀ ਸਮਾਂ-ਰੇਖਾ',
    noPlanYet: 'ਅਜੇ ਕੋਈ ਰਿਕਵਰੀ ਪਲਾਨ ਨਹੀਂ ਹੈ',
    uploadDischargeDesc: 'ਆਪਣੀ 15-ਦਿਨਾਂ ਰਿਕਵਰੀ ਯੋਜਨਾ ਤਿਆਰ ਕਰਨ ਲਈ ਡਿਸਚਾਰਜ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ।',
    nextFollowUp: 'ਅਗਲੀ ਡਾਕਟਰੀ ਜਾਂਚ',
    calendarView: 'ਕੈਲੰਡਰ ਦ੍ਰਿਸ਼',
    symptomTracker: 'ਰੋਜ਼ਾਨਾ ਲੱਛਣ ਤੇ ਸਿਹਤ ਰਿਕਾਰਡ',
    painScore: 'ਦਰਦ ਦਾ ਪੱਧਰ (1–10)',
    saveSymptomLog: 'ਸਿਹਤ ਰਿਕਾਰਡ ਦਰਜ ਕਰੋ',
    redFlagSafety: 'ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਤੇ ਸੁਰੱਖਿਆ',
    viewAll: 'ਸਾਰੇ ਵੇਖੋ',
    noAppointments: 'ਕੋਈ ਨਵੀਂ ਮੁਲਾਕਾਤ ਤੈਅ ਨਹੀਂ ਹੈ',
    fifteenDayCalendar: '15-ਦਿਨਾਂ ਦਵਾਈਆਂ ਦਾ ਕੈਲੰਡਰ',
    weeklyTrend: 'ਹਫ਼ਤਾਵਾਰੀ ਦਵਾਈ ਲੈਣ ਦੀ ਤਰੱਕੀ',
    noDosesScheduled: 'ਅੱਜ ਕੋਈ ਦਵਾਈ ਤੈਅ ਨਹੀਂ ਹੈ',
    noTasksToday: 'ਅੱਜ ਲਈ ਕੋਈ ਕੰਮ ਬਾਕੀ ਨਹੀਂ ਹੈ।',
    of: 'ਵਿੱਚੋਂ',
  },

  hi: {
    today: 'आज',
    timeline: '15-दिवसीय योजना',
    medications: 'दवाइयाँ',
    symptoms: 'लक्षण',
    safety: 'खतरे के संकेत (रेड फ्लैग)',
    schemes: 'सरकारी योजनाएँ',
    facilities: 'निकटतम स्वास्थ्य केंद्र',
    ashaCaseload: 'आशा कार्यकर्ता सूची',
    anmReview: 'एएनएम समीक्षा',
    family: 'परिवार',
    verification: 'सत्यापन',
    day: 'दिन',
    takeMedicine: 'दवा लें',
    completed: 'पूर्ण हुआ',
    pending: 'शेष',
    emergencyTitle: 'आपातकालीन स्थिति?',
    emergencySubtitle: 'यदि अत्यधिक रक्तस्राव, सांस फूलना या सीने में दर्द हो:',
    emergencyHelp: 'आपातकालीन / तात्कालिक सहायता',
    callAmbulance: '108 एम्बुलेंस को कॉल करें',
    call108: '108 एम्बुलेंस को कॉल करें',
    verifiedPlan: 'सत्यापित देखभाल योजना',
    verified: 'सत्यापित',
    savedOffline: 'फोन पर सुरक्षित (ऑफलाइन उपलब्ध)',
    syncNow: 'अभी सिंक करें',
    synced: 'सिंक हो गया',
    readAloud: 'आवाज़ में सुनें',
    tapToListen: 'आवाज़ में सुनें',
    uploadDischarge: 'डिस्चार्ज पर्ची अपलोड करें',
    verificationBadge: 'डॉक्टर द्वारा सत्यापित',
    restrictions: 'परहेज़ व सावधानियाँ',
    followUp: 'अगली अस्पताल जांच',
    doctorQuestions: 'डॉक्टर से पूछने वाले सवाल',
    familyCircle: 'परिवार मंडल',
    ashaVisit: 'आशा गृह भेंट',
    riskTierHigh: 'उच्च जोखिम (लाल)',
    riskTierMedium: 'मध्यम जोखिम (पीला)',
    riskTierLow: 'सामान्य (हरा)',
    todaysProgress: 'आज की प्रगति',
    todaysTasks: 'आज के कार्य',
    medicines: 'दवाइयाँ',
    tasks: 'कार्य',
    appointments: 'जांच व मुलाकात',
    previousDay: 'पिछला दिन',
    nextDay: 'अगला दिन',

    heroTitle: 'अस्पताल से छुट्टी के बाद घर पर सुरक्षित रिकवरी',
    heroSubtitle: 'डिस्चार्ज सारांश को स्पष्ट दैनिक देखभाल योजना, दवा अलार्म और आशा कार्यकर्ता सहायता में बदलें।',
    startRecovery: 'डिस्चार्ज पर्ची अपलोड करें',
    tryDemo: 'डेमो देखें',
    howItWorks: 'रिकवरी कंपास कैसे काम करता है',
    step1Title: '1. डिस्चार्ज पर्ची अपलोड करें',
    step1Desc: 'अस्पताल के पर्चे की फोटो खींचें। एआई दवाइयां और जांच कार्यक्रम निकाल लेगा।',
    step2Title: '2. डॉक्टर द्वारा सत्यापन',
    step2Desc: 'प्रत्येक दवा की खुराक और समय का सत्यापन किया जाता है।',
    step3Title: '3. आशा कार्यकर्ता की देखरेख',
    step3Desc: 'दवाइयों के अलार्म, बोलकर निर्देश और आशा कार्यकर्ता के गृह दौरे से सुरक्षित रहें।',
    punjabCoverageBadge: 'पंजाब के सरकारी स्वास्थ्य केंद्रों के लिए समर्पित',

    ashaTitle: 'आशा कार्यकर्ता कार्यसूची व निगरानी',
    ashaSubtitle: 'अपने गांव के मरीजों की देखरेख करें, गृह भेंट दर्ज करें और खतरे की स्थिति में एएनएम को सूचित करें।',
    searchPatients: 'मरीज का नाम, गांव या बीमारी खोजें...',
    allRisks: 'सभी मरीज',
    highRisk: 'उच्च जोखिम (लाल)',
    moderateRisk: 'मध्यम जोखिम (पीला)',
    stable: 'स्थिर (हरा)',
    visitedToday: 'आज की भेंट',
    logHomeVisit: 'गृह भेंट दर्ज करें',
    escalateToAnm: 'एएनएम को सूचित करें',
    pillCount: 'दवा की गिनती / स्ट्रिप जांच',
    blisterCheck: 'दवा मूल पैकेजिंग में उपलब्ध है',
    temperature: 'शरीर का तापमान (°F)',
    bloodPressure: 'रक्तचाप (BP)',
    bloodSugar: 'ब्लड शुगर (Sugar)',
    visitNotes: 'निरीक्षण व टिप्पणी',
    saveVisit: 'भेंट रिकॉर्ड सुरक्षित करें',
    emptyCaseloadTitle: 'सूची में कोई मरीज नहीं है',
    emptyCaseloadDesc: 'वर्तमान में आपके क्षेत्र में कोई सक्रिय मरीज दर्ज नहीं है।',
    loadDemoCaseload: 'पंजाब डेमो मरीज सूची लोड करें',
    activeFilters: 'सक्रिय फ़िल्टर',
    adherenceRate: 'दवा पालन दर',
    missedDoses: 'छूटी हुई खुराकें',
    riskFactors: 'जोखिम के लक्षण',
    village: 'गांव / क्षेत्र',

    anmTitle: 'एएनएम पर्यवेक्षण व आपातकालीन समीक्षा',
    anmSubtitle: 'आशा कार्यकर्ताओं द्वारा भेजे गए गंभीर मामलों की समीक्षा करें और अस्पताल रेफरल का प्रबंधन करें।',
    allEscalations: 'सभी मामले',
    raised: 'नए मामले (कार्रवाई आवश्यक)',
    acknowledged: 'स्वीकृत',
    visited: 'एएनएम जांच पूर्ण',
    referred: 'अस्पताल रेफर किया',
    resolved: 'समाधान हुआ',
    severityEmergency: 'आपातकालीन चेतावनी',
    severityUrgent: 'तात्कालिक समीक्षा',
    severityWarning: 'निगरानी अधीन',
    takeSupervisoryAction: 'समीक्षा करें और निर्णय लें',
    supervisoryNotes: 'पर्यवेक्षण निर्देश',
    referralFacility: 'रेफरल अस्पताल',
    closeEscalation: 'निर्णय लागू करें',
    emptyEscalationsTitle: 'कोई लंबित आपातकालीन मामला नहीं',
    emptyEscalationsDesc: 'आपके क्षेत्र के सभी मरीज वर्तमान में स्थिर हैं।',
    loadDemoEscalations: 'पंजाब डेमो मामले लोड करें',
    referToChc: 'सीएचसी / जिला अस्पताल रेफर करें',

    facilitiesTitle: 'निकटतम सरकारी स्वास्थ्य केंद्र व अस्पताल',
    facilitiesSubtitle: 'पंजाब सरकार के सत्यापित अस्पताल, आम आदमी क्लिनिक और 24 घंटे आपातकालीन सेवाएं।',
    filterAll: 'सभी स्वास्थ्य केंद्र',
    filterHospitals: 'जिला / उप-मंडल अस्पताल',
    filterChc: 'सामुदायिक स्वास्थ्य केंद्र (CHC)',
    filterPhc: 'प्राथमिक स्वास्थ्य केंद्र (PHC)',
    filterAac: 'आम आदमी क्लिनिक (AAC)',
    emergencyHelplines: 'पंजाब आपातकालीन हेल्पलाइन',
    callNow: 'कॉल करें',
    getDirections: 'दिशा-निर्देश प्राप्त करें',
    open247: '24 घंटे आपातकालीन सेवा',

    schemesTitle: 'राष्ट्रीय एवं पंजाब सरकार की स्वास्थ्य योजनाएँ',
    schemesSubtitle: 'मुफ्त इलाज, मुफ्त दवाइयां एवं आयुष्मान भारत योजना की संपूर्ण जानकारी।',
    searchSchemesPlaceholder: 'योजना का नाम या उपचार खोजें...',
    applyForScheme: 'योजना का लाभ कैसे लें',
    coverageLimit: 'कवरेज सीमा',
    beneficiaryGroup: 'पात्र लाभार्थी',
    keyBenefits: 'मुख्य लाभ',
    requiredDocuments: 'आवश्यक दस्तावेज',

    // Medications Page
    medicationReminders: 'दवाओं के रिमाइंडर',
    medicationSubtitle: 'डिस्चार्ज पर्ची से निकाली गई दवाओं का निर्धारित समय-सारणी।',
    upcoming: 'आगामी खुराकें',
    calendars: 'कैलेंडर',
    noMedsPrescribed: 'कोई दवा दर्ज नहीं है',
    noMedsDesc: 'आपकी रिकवरी योजना में वर्तमान में कोई सक्रिय दवा नहीं है।',
    skip: 'छोड़ें',
    taken: 'ले ली',
    markTaken: 'दवा लें',
    adherenceSummary: 'दवा पालन दर',
    exportCalendar: 'कैलेंडर डाउनलोड करें (.ics)',
    duration: 'अवधि',

    // Symptoms Page
    symptomTracking: 'दैनिक लक्षण व स्वास्थ्य रिकॉर्ड',
    symptomSubtitle: 'अपनी दैनिक रिकवरी प्रगति दर्ज करें और समय पर जटिलताओं को पहचानें।',
    painLevel: 'दर्द का स्तर (1–10)',
    temperatureLabel: 'शरीर का तापमान (°F)',
    selectSymptoms: 'आज आप जो लक्षण महसूस कर रहे हैं उन्हें चुनें',
    additionalNotes: 'अतिरिक्त लक्षण या आवश्यक टिप्पणी',
    saveLog: 'स्वास्थ्य रिकॉर्ड सबमिट करें',
    savedSuccess: 'आपका रिकॉर्ड सफलतापूर्वक सहेजा गया!',

    // Safety & Red Flags
    urgentAttention: 'तत्काल ध्यान देने की आवश्यकता है',
    urgentSubtitle: 'आपके द्वारा दर्ज लक्षण आपकी डिस्चार्ज पर्ची के चेतावनी संकेत से मेल खाते हैं।',
    warningSign: 'चेतावनी संकेत',
    recommendedAction: 'आवश्यक कार्रवाई',
    callClinician: 'अपने डॉक्टर को कॉल करें',
    viewSource: 'डिस्चार्ज पर्ची देखें',
    emergencyDisclaimer: 'यदि यह गंभीर आपातकालीन स्थिति है, तो तुरंत 108 (एम्बुलेंस) या 104 (स्वास्थ्य हेल्पलाइन) पर कॉल करें।',

    // Verification Page
    verificationTitle: 'डिस्चार्ज सारांश का सत्यापन',
    verificationSubtitle: 'अपनी रिकवरी योजना शुरू करने से पहले दवाओं और निर्देशों की जांच करें।',
    dischargeDocument: 'अस्पताल की मूल डिस्चार्ज पर्ची',
    extractedInstructions: 'निकाले गए चिकित्सीय निर्देश',
    confirmAll: 'सभी निर्देश सत्यापित करें',
    confirmItem: 'सत्यापित करें',
    reconfirm: 'पुनः सत्यापित करें',
    edit: 'संपादित करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    noReadableText: 'कोई स्पष्ट लिखावट नहीं मिली',
    noReadableTextDesc: 'अपलोड किए गए दस्तावेज़ में कोई स्पष्ट पाठ या निर्देश नहीं मिले। कृपया स्पष्ट प्रतिलिपि अपलोड करें।',
    reuploadDoc: 'स्पष्ट दस्तावेज़ पुनः अपलोड करें',
    noItemsExtracted: 'कोई निर्देश नहीं मिला',
    noItemsExtractedDesc: 'इस दस्तावेज़ से कोई दवा या जांच निर्देश नहीं निकाले जा सके। कृपया सही डिस्चार्ज पर्ची अपलोड करें।',
    nextConfirmPlan: 'योजना सत्यापन के लिए आगे बढ़ें',

    // Dashboard & Timeline
    greetingMorning: 'शुभ प्रभात',
    activeTimeline: 'सक्रिय रिकवरी समयरेखा',
    noPlanYet: 'अभी कोई रिकवरी योजना नहीं है',
    uploadDischargeDesc: 'अपनी 15-दिवसीय रिकवरी योजना बनाने के लिए डिस्चार्ज सारांश अपलोड करें।',
    nextFollowUp: 'अगली चिकित्सीय जांच',
    calendarView: 'कैलेंडर दृश्य',
    symptomTracker: 'दैनिक लक्षण व स्वास्थ्य रिकॉर्ड',
    painScore: 'दर्द का स्तर (1–10)',
    saveSymptomLog: 'स्वास्थ्य रिकॉर्ड सबमिट करें',
    redFlagSafety: 'खतरे के संकेत व सुरक्षा',
    viewAll: 'सभी देखें',
    noAppointments: 'कोई आगामी अपॉइंटमेंट नहीं है',
    fifteenDayCalendar: '15-दिवसीय दवा समय सारणी',
    weeklyTrend: 'साप्ताहिक दवा अनुपालन रुझान',
    noDosesScheduled: 'कोई खुराक निर्धारित नहीं है',
    noTasksToday: 'आज के लिए कोई कार्य निर्धारित नहीं है।',
    of: 'में से',
  },

  mr: {
    today: 'आज',
    timeline: '१५-दिवसीय आराखडा',
    medications: 'औषधे',
    symptoms: 'लक्षणे',
    safety: 'धोक्याचे संकेत',
    schemes: 'सरकारी योजना',
    facilities: 'आरोग्य केंद्र',
    ashaCaseload: 'आशा सेविका यादी',
    anmReview: 'एएनएम तपासणी',
    family: 'कुटुंब',
    verification: 'पडताळणी',
    day: 'दिवस',
    takeMedicine: 'औषध घ्या',
    completed: 'पूर्ण झाले',
    pending: 'बाकी',
    emergencyTitle: 'तात्काळ वैद्यकीय मदत?',
    emergencySubtitle: 'जास्त रक्तस्राव किंवा छातीत तीव्र वेदना असल्यास:',
    emergencyHelp: 'आणीबाणी मदत',
    callAmbulance: '१०८ रुग्णवाहिका',
    call108: '१०८ रुग्णवाहिका',
    verifiedPlan: 'तपासलेली उपचार योजना',
    verified: 'तपासलेले',
    savedOffline: 'ऑफलाईन उपलब्ध',
    syncNow: 'आता सिंक करा',
    synced: 'सिंक पूर्ण',
    readAloud: 'आवाजात ऐका',
    tapToListen: 'आवाजात ऐका',
    uploadDischarge: 'डिस्चार्ज कार्ड अपलोड करा',
    verificationBadge: 'वैद्यकीय तपासणी पूर्ण',
    restrictions: 'सावधगिरी व बंधने',
    followUp: 'पुढील तपासणी',
    doctorQuestions: 'डॉक्टरांना विचारायचे प्रश्न',
    familyCircle: 'कुटुंब सदस्य',
    ashaVisit: 'आशा भेट',
    riskTierHigh: 'उच्च धोका (लाल)',
    riskTierMedium: 'मध्यम धोका (पिवळा)',
    riskTierLow: 'सुरक्षित (हिरवा)',
    todaysProgress: 'आजची प्रगती',
    todaysTasks: 'आजची कामे',
    medicines: 'औषधे',
    tasks: 'कामे',
    appointments: 'तपासणी भेटी',
    previousDay: 'मागील दिवस',
    nextDay: 'पुढील दिवस',
    heroTitle: 'रुग्णालयातून घरी परतल्यावर सुरक्षित काळजी',
    heroSubtitle: 'डिस्चार्ज कार्डचे रूपांतर सोप्या दैनंदिन योजनेत करा.',
    startRecovery: 'डिस्चार्ज कार्ड अपलोड करा',
    tryDemo: 'डेमो पहा',
    howItWorks: 'कसे काम करते',
    step1Title: '१. डिस्चार्ज कार्ड फोटो',
    step1Desc: 'कार्ड अपलोड करा.',
    step2Title: '२. डॉक्टर पडताळणी',
    step2Desc: 'औषध पडताळणी केली जाते.',
    step3Title: '३. आशा सेविका देखरेख',
    step3Desc: 'गृहभेटी आणि मार्गदर्शनाने पूर्ण सुरक्षितता.',
    punjabCoverageBadge: 'आरोग्य केंद्र सेवा',
    ashaTitle: 'आशा सेविका यादी व देखरेख',
    ashaSubtitle: 'रुग्णांची तपासणी करा आणि नोंद ठेवा.',
    searchPatients: 'रुग्ण शोधा...',
    allRisks: 'सर्व रुग्ण',
    highRisk: 'उच्च धोका (लाल)',
    moderateRisk: 'मध्यम धोका (पिवळा)',
    stable: 'सुरक्षित (हिरवा)',
    visitedToday: 'आजची भेट',
    logHomeVisit: 'भेट नोंदवा',
    escalateToAnm: 'एएनएमला कळवा',
    pillCount: 'गोळ्यांची मोजणी',
    blisterCheck: 'औषध पाकीट तपासणी',
    temperature: 'तापमान (°F)',
    bloodPressure: 'रक्तदाब (BP)',
    bloodSugar: 'शुगर',
    visitNotes: 'नोंदी',
    saveVisit: 'जतन करा',
    emptyCaseloadTitle: 'रुग्ण यादी रिक्त आहे',
    emptyCaseloadDesc: 'सध्या कोणतेही रुग्ण नोंदणीकृत नाहीत.',
    loadDemoCaseload: 'डेमो रुग्ण लोड करा',
    activeFilters: 'सक्रिय फिल्टर',
    adherenceRate: 'औषध प्रमाण',
    missedDoses: 'चुकलेले डोस',
    riskFactors: 'धोक्याचे घटक',
    village: 'गाव / विभाग',
    anmTitle: 'एएनएम पर्यवेक्षण डॅशबोर्ड',
    anmSubtitle: 'आशा सेविकांनी पाठवलेल्या गंभीर प्रकरणांची तपासणी करा.',
    allEscalations: 'सर्व प्रकरणे',
    raised: 'नवीन प्रकरण',
    acknowledged: 'स्वीकारले',
    visited: 'भेट पूर्ण',
    referred: 'रेफर केले',
    resolved: 'सोडवले',
    severityEmergency: 'तात्काळ मदत',
    severityUrgent: 'तातडीचे',
    severityWarning: 'सावधगिरी',
    takeSupervisoryAction: 'निर्णय घ्या',
    supervisoryNotes: 'सूचना',
    referralFacility: 'रुग्णालय',
    closeEscalation: 'पूर्ण करा',
    emptyEscalationsTitle: 'प्रलंबित प्रकरणे नाहीत',
    emptyEscalationsDesc: 'सर्व रुग्ण सध्या सुरक्षित आहेत.',
    loadDemoEscalations: 'डेमो प्रकरणे लोड करा',
    referToChc: 'हॉस्पिटल रेफर करा',
    facilitiesTitle: 'जवळची आरोग्य केंद्रे',
    facilitiesSubtitle: 'शासकीय रुग्णालये व २४ तास सेवा.',
    filterAll: 'सर्व',
    filterHospitals: 'रुग्णालये',
    filterChc: 'सीएचसी',
    filterPhc: 'पीएचसी',
    filterAac: 'क्लिनिक',
    emergencyHelplines: 'हेल्पलाइन',
    callNow: 'फोन करा',
    getDirections: 'मार्ग पहा',
    open247: '२४ तास सेवा',
    schemesTitle: 'सरकारी आरोग्य योजना',
    schemesSubtitle: 'मोफत उपचार आणि योजनांची माहिती.',
    searchSchemesPlaceholder: 'योजना शोधा...',
    applyForScheme: 'कसा लाभ घ्यावा',
    coverageLimit: 'मर्यादा',
    beneficiaryGroup: 'पात्र लाभार्थी',
    keyBenefits: 'फायदे',
    requiredDocuments: 'कागदपत्रे',
    // Additional Pages
    medicationReminders: 'Medication Reminders',
    medicationSubtitle: 'Prescribed schedule extracted from your discharge instructions.',
    upcoming: 'Upcoming',
    calendars: 'Calendars',
    noMedsPrescribed: 'No Medications Prescribed',
    noMedsDesc: 'Your recovery plan currently has no active medications.',
    skip: 'Skip',
    taken: 'Taken',
    markTaken: 'Take Medicine',
    adherenceSummary: 'Adherence Rate',
    exportCalendar: 'Export Calendar (.ics)',
    duration: 'Duration',
    symptomTracking: 'Daily Symptom & Vitals Log',
    symptomSubtitle: 'Log your daily recovery progress and detect complications early.',
    painLevel: 'Pain Level (1–10)',
    temperatureLabel: 'Body Temperature (°F)',
    selectSymptoms: 'Select Any Symptoms You Feel Today',
    additionalNotes: 'Additional Observations & Notes',
    saveLog: 'Submit Daily Vitals Log',
    savedSuccess: 'Vitals Recorded Successfully!',
    urgentAttention: 'Urgent Attention Required',
    urgentSubtitle: 'Your logged symptom matches a warning sign in your recovery instructions.',
    warningSign: 'Warning Sign',
    recommendedAction: 'Recommended Action',
    callClinician: 'Call Your Clinician',
    viewSource: 'View Source Instructions',
    emergencyDisclaimer: 'If you feel this is a medical emergency, seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline).',
    verificationTitle: 'Discharge Summary Verification',
    verificationSubtitle: 'Review and confirm extracted medical instructions before activating your recovery plan.',
    dischargeDocument: 'Hospital Discharge Document',
    extractedInstructions: 'Extracted Clinical Items',
    confirmAll: 'Confirm All Items',
    confirmItem: 'Confirm Item',
    reconfirm: 'Re-confirm',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    noReadableText: 'No Readable Text Extracted',
    noReadableTextDesc: 'The uploaded document contained no detectable text, legible handwriting, or structured clinical discharge instructions.',
    reuploadDoc: 'Re-upload Clear Document',
    noItemsExtracted: 'No Clinical Instructions Extracted',
    noItemsExtractedDesc: "We couldn't extract any medications, tasks, or follow-ups from this document. Please verify that you uploaded a valid, legible discharge summary.",
    nextConfirmPlan: 'Proceed to Plan Confirmation',
    greetingMorning: 'Good Morning',
    activeTimeline: 'Active Recovery Timeline',
    noPlanYet: 'No Recovery Plan Yet',
    uploadDischargeDesc: 'Upload your discharge summary to generate your personalised 15-day recovery timeline.',
    nextFollowUp: 'Next Upcoming Follow-up',
    calendarView: 'Calendar View',
    symptomTracker: 'Daily Symptom & Vitals Log',
    painScore: 'Pain Level (1–10)',
    saveSymptomLog: 'Save Daily Check-in',
    redFlagSafety: 'Red Flags & Safety',
    viewAll: 'View All',
    noAppointments: 'No upcoming appointments',
    fifteenDayCalendar: '15-Day Medication Schedule Calendar',
    weeklyTrend: 'Weekly dose completion trend',
    noDosesScheduled: 'No doses scheduled',
    noTasksToday: 'No tasks scheduled for today.',
    of: 'of',
  },

  bn: {
    today: 'আজ',
    timeline: '১৫ দিনের পরিকল্পনা',
    medications: 'ওষুধপত্র',
    symptoms: 'লক্ষণ',
    safety: 'বিপদ সংকেত',
    schemes: 'সরকারি প্রকল্প',
    facilities: 'স্বাস্থ্যকেন্দ্র',
    ashaCaseload: 'আশা কর্মী তালিকা',
    anmReview: 'এএনএম পর্যালোচনা',
    family: 'পরিবার',
    verification: 'যাচাইকরণ',
    day: 'দিন',
    takeMedicine: 'ওষুধ খান',
    completed: 'সম্পন্ন',
    pending: 'বাকি',
    emergencyTitle: 'জরুরি সাহায্য?',
    emergencySubtitle: 'অতিরিক্ত রক্তপাত বা বুকে ব্যথা হলে:',
    emergencyHelp: 'জরুরি সহায়তা',
    callAmbulance: '১০৮ অ্যাম্বুলেন্স',
    call108: '১০৮ অ্যাম্বুলেন্স',
    verifiedPlan: 'যাচাইকৃত পরিকল্পনা',
    verified: 'যাচাইকৃত',
    savedOffline: 'অফলাইন সংরক্ষিত',
    syncNow: 'সিঙ্ক করুন',
    synced: 'সিঙ্ক সম্পন্ন',
    readAloud: 'শুনুন',
    tapToListen: 'শুনুন',
    uploadDischarge: 'ছাড়পত্র আপলোড করুন',
    verificationBadge: 'যাচাইকৃত',
    restrictions: 'বিধিনিষেধ',
    followUp: 'পরবর্তী চেকআপ',
    doctorQuestions: 'ডাক্তারের জন্য প্রশ্ন',
    familyCircle: 'পরিবার সদস্য',
    ashaVisit: 'আশা পরিদর্শন',
    riskTierHigh: 'উচ্চ ঝুঁকি (লাল)',
    riskTierMedium: 'মাঝারি ঝুঁকি (হলুদ)',
    riskTierLow: 'স্থিতিশীল (সবুজ)',
    todaysProgress: 'আজকের অগ্রগতি',
    todaysTasks: 'আজকের কাজ',
    medicines: 'ওষুধ',
    tasks: 'কাজ',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    previousDay: 'আগের দিন',
    nextDay: 'পরের দিন',
    heroTitle: 'হাসপাতাল পরবর্তী নিরাপদ পুনরুদ্ধার',
    heroSubtitle: 'সহজ নির্দেশিকা ও আশা সহায়তায় সুস্থ থাকুন।',
    startRecovery: 'ছাড়পত্র আপলোড করুন',
    tryDemo: 'ডেমো দেখুন',
    howItWorks: 'কীভাবে কাজ করে',
    step1Title: '১. আপলোড করুন',
    step1Desc: 'ছাড়পত্রের ছবি তুলুন।',
    step2Title: '২. যাচাইকরণ',
    step2Desc: 'ডাক্তার কর্তৃক ওষুধ নিশ্চিত করা হয়।',
    step3Title: '৩. আশা কর্মী যত্ন',
    step3Desc: 'প্রতিদিনের যত্ন ও পরামর্শ।',
    punjabCoverageBadge: 'স্বাস্থ্য পরিসেবা',
    ashaTitle: 'আশা কর্মী পোর্টাল',
    ashaSubtitle: 'রোগীদের যত্ন নিন ও তথ্য রাখুন।',
    searchPatients: 'রোগী খুঁজুন...',
    allRisks: 'সকল রোগী',
    highRisk: 'উচ্চ ঝুঁকি (লাল)',
    moderateRisk: 'মাঝারি ঝুঁকি (হলুদ)',
    stable: 'স্থিতিশীল (সবুজ)',
    visitedToday: 'আজকের পরিদর্শন',
    logHomeVisit: 'পরিদর্শন রেকর্ড করুন',
    escalateToAnm: 'এএনএমকে জানান',
    pillCount: 'ওষুধ গণনা',
    blisterCheck: 'ওষুধের প্যাকেট চেক',
    temperature: 'তাপমাত্রা',
    bloodPressure: 'রক্তচাপ',
    bloodSugar: 'সুগার',
    visitNotes: 'নোট',
    saveVisit: 'সংরক্ষণ করুন',
    emptyCaseloadTitle: 'তালিকা খালি',
    emptyCaseloadDesc: 'কোনো রোগী নেই।',
    loadDemoCaseload: 'ডেমো লোড করুন',
    activeFilters: 'ফিল্টার',
    adherenceRate: 'ওষুধ সেবনের হার',
    missedDoses: 'বাদ পড়া ডোজ',
    riskFactors: 'ঝুঁকি',
    village: 'গ্রাম',
    anmTitle: 'এএনএম পর্যালোচনা পোর্টাল',
    anmSubtitle: 'জরুরি বিষয়ের মূল্যায়ন করুন।',
    allEscalations: 'সকল সমস্যা',
    raised: 'নতুন',
    acknowledged: 'গৃহীত',
    visited: 'পরিদর্শিত',
    referred: 'রেফার্ড',
    resolved: 'সমাধান',
    severityEmergency: 'জরুরি',
    severityUrgent: 'তাৎক্ষণিক',
    severityWarning: 'সতর্কতা',
    takeSupervisoryAction: 'পদক্ষেপ নিন',
    supervisoryNotes: 'নির্দেশনা',
    referralFacility: 'হাসপাতাল',
    closeEscalation: 'সম্পূর্ণ করুন',
    emptyEscalationsTitle: 'কোনো জরুরি কেস নেই',
    emptyEscalationsDesc: 'সব রোগী স্থিতিশীল।',
    loadDemoEscalations: 'ডেমো কেস লোড করুন',
    referToChc: 'রেফার করুন',
    facilitiesTitle: 'স্বাস্থ্যকেন্দ্র ও হাসপাতাল',
    facilitiesSubtitle: '২৪ ঘণ্টার জরুরি পরিসেবা।',
    filterAll: 'সকল',
    filterHospitals: 'হাসপাতাল',
    filterChc: 'সিএইচসি',
    filterPhc: 'পিএইচসি',
    filterAac: 'ক্লিনিক',
    emergencyHelplines: 'হেল্পলাইন',
    callNow: 'কল করুন',
    getDirections: 'দিকনির্দেশ',
    open247: '২৪ ঘণ্টা খোলা',
    schemesTitle: 'সরকারি স্বাস্থ্য প্রকল্প',
    schemesSubtitle: 'বিনামূল্যে চিকিৎসা ও ওষুধের প্রকল্প।',
    searchSchemesPlaceholder: 'প্রকল্প খুঁজুন...',
    applyForScheme: 'আবেদনের উপায়',
    coverageLimit: 'সুবিধার সীমা',
    beneficiaryGroup: 'সুবিধাভোগী',
    keyBenefits: 'সুবিধাসমূহ',
    requiredDocuments: 'প্রয়োজনীয় কাগজপত্র',
    // Additional Pages
    medicationReminders: 'Medication Reminders',
    medicationSubtitle: 'Prescribed schedule extracted from your discharge instructions.',
    upcoming: 'Upcoming',
    calendars: 'Calendars',
    noMedsPrescribed: 'No Medications Prescribed',
    noMedsDesc: 'Your recovery plan currently has no active medications.',
    skip: 'Skip',
    taken: 'Taken',
    markTaken: 'Take Medicine',
    adherenceSummary: 'Adherence Rate',
    exportCalendar: 'Export Calendar (.ics)',
    duration: 'Duration',
    symptomTracking: 'Daily Symptom & Vitals Log',
    symptomSubtitle: 'Log your daily recovery progress and detect complications early.',
    painLevel: 'Pain Level (1–10)',
    temperatureLabel: 'Body Temperature (°F)',
    selectSymptoms: 'Select Any Symptoms You Feel Today',
    additionalNotes: 'Additional Observations & Notes',
    saveLog: 'Submit Daily Vitals Log',
    savedSuccess: 'Vitals Recorded Successfully!',
    urgentAttention: 'Urgent Attention Required',
    urgentSubtitle: 'Your logged symptom matches a warning sign in your recovery instructions.',
    warningSign: 'Warning Sign',
    recommendedAction: 'Recommended Action',
    callClinician: 'Call Your Clinician',
    viewSource: 'View Source Instructions',
    emergencyDisclaimer: 'If you feel this is a medical emergency, seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline).',
    verificationTitle: 'Discharge Summary Verification',
    verificationSubtitle: 'Review and confirm extracted medical instructions before activating your recovery plan.',
    dischargeDocument: 'Hospital Discharge Document',
    extractedInstructions: 'Extracted Clinical Items',
    confirmAll: 'Confirm All Items',
    confirmItem: 'Confirm Item',
    reconfirm: 'Re-confirm',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    noReadableText: 'No Readable Text Extracted',
    noReadableTextDesc: 'The uploaded document contained no detectable text, legible handwriting, or structured clinical discharge instructions.',
    reuploadDoc: 'Re-upload Clear Document',
    noItemsExtracted: 'No Clinical Instructions Extracted',
    noItemsExtractedDesc: "We couldn't extract any medications, tasks, or follow-ups from this document. Please verify that you uploaded a valid, legible discharge summary.",
    nextConfirmPlan: 'Proceed to Plan Confirmation',
    greetingMorning: 'Good Morning',
    activeTimeline: 'Active Recovery Timeline',
    noPlanYet: 'No Recovery Plan Yet',
    uploadDischargeDesc: 'Upload your discharge summary to generate your personalised 15-day recovery timeline.',
    nextFollowUp: 'Next Upcoming Follow-up',
    calendarView: 'Calendar View',
    symptomTracker: 'Daily Symptom & Vitals Log',
    painScore: 'Pain Level (1–10)',
    saveSymptomLog: 'Save Daily Check-in',
    redFlagSafety: 'Red Flags & Safety',
    viewAll: 'View All',
    noAppointments: 'No upcoming appointments',
    fifteenDayCalendar: '15-Day Medication Schedule Calendar',
    weeklyTrend: 'Weekly dose completion trend',
    noDosesScheduled: 'No doses scheduled',
    noTasksToday: 'No tasks scheduled for today.',
    of: 'of',
  },

  ta: {
    today: 'இன்று',
    timeline: '15 நாள் திட்டம்',
    medications: 'மருந்துகள்',
    symptoms: 'அறிகுறிகள்',
    safety: 'ஆபத்து எச்சரிக்கை',
    schemes: 'அரசு திட்டங்கள்',
    facilities: 'மருத்துவமனை',
    ashaCaseload: 'ஆஷா பணியாளர் பட்டியல்',
    anmReview: 'ஏஎன்எம் மதிப்பாய்வு',
    family: 'குடும்பம்',
    verification: 'சரிபார்ப்பு',
    day: 'நாள்',
    takeMedicine: 'மருந்து சாப்பிடுங்கள்',
    completed: 'முடிந்தது',
    pending: 'நிலுவை',
    emergencyTitle: 'அவசர மருத்துவ உதவி?',
    emergencySubtitle: 'அதிக இரத்தப்போக்கு அல்லது நெஞ்சு வலி இருந்தால்:',
    emergencyHelp: 'அவசர உதவி',
    callAmbulance: '108 ஆம்புலன்ஸ்',
    call108: '108 ஆம்புலன்ஸ்',
    verifiedPlan: 'சரிபார்க்கப்பட்ட திட்டம்',
    verified: 'சரிபார்க்கப்பட்டது',
    savedOffline: 'மொபைலில் சேமிக்கப்பட்டது',
    syncNow: 'இப்போது ஒத்திசைக்கவும்',
    synced: 'ஒத்திசைக்கப்பட்டது',
    readAloud: 'கேளுங்கள்',
    tapToListen: 'கேளுங்கள்',
    uploadDischarge: 'டிஸ்சார்ஜ் சீட்டை பதிவேற்றவும்',
    verificationBadge: 'மருத்துவரால் சரிபார்க்கப்பட்டது',
    restrictions: 'கட்டுப்பாடுகள்',
    followUp: 'அடுத்த பரிசோதனை',
    doctorQuestions: 'மருத்துவரிடம் கேட்க வேண்டியவை',
    familyCircle: 'குடும்ப உறுப்பினர்கள்',
    ashaVisit: 'ஆஷா வீட்டுப் பார்வை',
    riskTierHigh: 'அதிக ஆபத்து (சிவப்பு)',
    riskTierMedium: 'மிதமான ஆபத்து (மஞ்சள்)',
    riskTierLow: 'பாதுகாப்பானது (பச்சை)',
    todaysProgress: 'இன்றைய முன்னேற்றம்',
    todaysTasks: 'இன்றைய பணிகள்',
    medicines: 'மருந்துகள்',
    tasks: 'பணிகள்',
    appointments: 'நேரக்குறிப்புகள்',
    previousDay: 'முந்தைய நாள்',
    nextDay: 'அடுத்த நாள்',
    heroTitle: 'வீட்டில் பாதுகாப்பான மருத்துவ கவனிப்பு',
    heroSubtitle: 'மருந்து நினைவூட்டல்கள் மற்றும் ஆஷா பணியாளர் ஆதரவு.',
    startRecovery: 'சீட்டை பதிவேற்றவும்',
    tryDemo: 'டெமோ காண்க',
    howItWorks: 'எவ்வாறு செயல்படுகிறது',
    step1Title: '1. பதிவேற்றம்',
    step1Desc: 'டிஸ்சார்ஜ் சீட்டின் புகைப்படம் எடுக்கவும்.',
    step2Title: '2. மருத்துவர் சரிபார்ப்பு',
    step2Desc: 'மருந்துகள் துல்லியமாக சரிபார்க்கப்படுகின்றன.',
    step3Title: '3. ஆஷா பராமரிப்பு',
    step3Desc: 'வீட்டுப் பார்வை மூலம் பாதுகாப்பு உறுதி.',
    punjabCoverageBadge: 'சுகாதார மையங்கள்',
    ashaTitle: 'ஆஷா பணியாளர் கண்காணிப்பு',
    ashaSubtitle: 'நோயாளிகளைக் கண்காணித்து பதிவு செய்யுங்கள்.',
    searchPatients: 'நோயாளியைத் தேடுக...',
    allRisks: 'அனைத்து நோயாளிகள்',
    highRisk: 'அதிக ஆபத்து (சிவப்பு)',
    moderateRisk: 'மிதமான ஆபத்து (மஞ்சள்)',
    stable: 'பாதுகாப்பானது (பச்சை)',
    visitedToday: 'இன்றைய பார்வை',
    logHomeVisit: 'பார்வையைப் பதிவுசெய்க',
    escalateToAnm: 'ஏஎன்எம்க்கு தெரிவி',
    pillCount: 'மருந்து எண்ணிக்கை',
    blisterCheck: 'மருந்து அட்டை சோதனை',
    temperature: 'வெப்பநிலை',
    bloodPressure: 'இரத்த அழுத்தம்',
    bloodSugar: 'சர்க்கரை அளவு',
    visitNotes: 'குறிப்புகள்',
    saveVisit: 'சேமிக்க',
    emptyCaseloadTitle: 'பட்டியல் காலியாக உள்ளது',
    emptyCaseloadDesc: 'நோயாளிகள் எவரும் இல்லை.',
    loadDemoCaseload: 'டெமோ நோயாளிகளை ஏற்றுக',
    activeFilters: 'வடிகட்டி',
    adherenceRate: 'மருந்து உட்கொள்ளும் வீதம்',
    missedDoses: 'தவறவிட்ட அளவுகள்',
    riskFactors: 'ஆபத்து காரணிகள்',
    village: 'கிராமம்',
    anmTitle: 'ஏஎன்எம் மேற்பார்வை மையம்',
    anmSubtitle: 'அவசர சிகிச்சை வழிகாட்டல்.',
    allEscalations: 'அனைத்து புகார்கள்',
    raised: 'புதியது',
    acknowledged: 'ஏற்றுக்கொள்ளப்பட்டது',
    visited: 'பார்வையிடப்பட்டது',
    referred: 'பரிந்துரைக்கப்பட்டது',
    resolved: 'தீர்க்கப்பட்டது',
    severityEmergency: 'அவசரம்',
    severityUrgent: 'முக்கியமானது',
    severityWarning: 'எச்சரிக்கை',
    takeSupervisoryAction: 'நடவடிக்கை எடுக்க',
    supervisoryNotes: 'அறிவுறுத்தல்கள்',
    referralFacility: 'மருத்துவமனை',
    closeEscalation: 'முடிவுசெய்க',
    emptyEscalationsTitle: 'நிலுவை வழக்குகள் இல்லை',
    emptyEscalationsDesc: 'அனைவரும் நலமாக உள்ளனர்.',
    loadDemoEscalations: 'டெமோ வழக்குகளை ஏற்றுக',
    referToChc: 'பரிந்துரைக்க',
    facilitiesTitle: 'அருகிலுள்ள அரசு மருத்துவமனைகள்',
    facilitiesSubtitle: '24 மணி நேர அவசர சிகிச்சைகள்.',
    filterAll: 'அனைத்தும்',
    filterHospitals: 'மருத்துவமனைகள்',
    filterChc: 'சிஎச்சி',
    filterPhc: 'பிஎச்சி',
    filterAac: 'கிளினிக்',
    emergencyHelplines: 'உதவி எண்கள்',
    callNow: 'அழைக்க',
    getDirections: 'வழிகாட்டுதல்',
    open247: '24 மணி நேரமும் திறந்திருக்கும்',
    schemesTitle: 'அரசு நலத்திட்டங்கள்',
    schemesSubtitle: 'இலவச சிகிச்சை மற்றும் மருந்துகள்.',
    searchSchemesPlaceholder: 'திட்டங்களைத் தேடுக...',
    applyForScheme: 'பயன்பெறுவது எப்படி',
    coverageLimit: 'வரம்பு',
    beneficiaryGroup: 'பயனாளிகள்',
    keyBenefits: 'நன்மைகள்',
    requiredDocuments: 'தேவையான ஆவணங்கள்',
    // Additional Pages
    medicationReminders: 'Medication Reminders',
    medicationSubtitle: 'Prescribed schedule extracted from your discharge instructions.',
    upcoming: 'Upcoming',
    calendars: 'Calendars',
    noMedsPrescribed: 'No Medications Prescribed',
    noMedsDesc: 'Your recovery plan currently has no active medications.',
    skip: 'Skip',
    taken: 'Taken',
    markTaken: 'Take Medicine',
    adherenceSummary: 'Adherence Rate',
    exportCalendar: 'Export Calendar (.ics)',
    duration: 'Duration',
    symptomTracking: 'Daily Symptom & Vitals Log',
    symptomSubtitle: 'Log your daily recovery progress and detect complications early.',
    painLevel: 'Pain Level (1–10)',
    temperatureLabel: 'Body Temperature (°F)',
    selectSymptoms: 'Select Any Symptoms You Feel Today',
    additionalNotes: 'Additional Observations & Notes',
    saveLog: 'Submit Daily Vitals Log',
    savedSuccess: 'Vitals Recorded Successfully!',
    urgentAttention: 'Urgent Attention Required',
    urgentSubtitle: 'Your logged symptom matches a warning sign in your recovery instructions.',
    warningSign: 'Warning Sign',
    recommendedAction: 'Recommended Action',
    callClinician: 'Call Your Clinician',
    viewSource: 'View Source Instructions',
    emergencyDisclaimer: 'If you feel this is a medical emergency, seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline).',
    verificationTitle: 'Discharge Summary Verification',
    verificationSubtitle: 'Review and confirm extracted medical instructions before activating your recovery plan.',
    dischargeDocument: 'Hospital Discharge Document',
    extractedInstructions: 'Extracted Clinical Items',
    confirmAll: 'Confirm All Items',
    confirmItem: 'Confirm Item',
    reconfirm: 'Re-confirm',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    noReadableText: 'No Readable Text Extracted',
    noReadableTextDesc: 'The uploaded document contained no detectable text, legible handwriting, or structured clinical discharge instructions.',
    reuploadDoc: 'Re-upload Clear Document',
    noItemsExtracted: 'No Clinical Instructions Extracted',
    noItemsExtractedDesc: "We couldn't extract any medications, tasks, or follow-ups from this document. Please verify that you uploaded a valid, legible discharge summary.",
    nextConfirmPlan: 'Proceed to Plan Confirmation',
    greetingMorning: 'Good Morning',
    activeTimeline: 'Active Recovery Timeline',
    noPlanYet: 'No Recovery Plan Yet',
    uploadDischargeDesc: 'Upload your discharge summary to generate your personalised 15-day recovery timeline.',
    nextFollowUp: 'Next Upcoming Follow-up',
    calendarView: 'Calendar View',
    symptomTracker: 'Daily Symptom & Vitals Log',
    painScore: 'Pain Level (1–10)',
    saveSymptomLog: 'Save Daily Check-in',
    redFlagSafety: 'Red Flags & Safety',
    viewAll: 'View All',
    noAppointments: 'No upcoming appointments',
    fifteenDayCalendar: '15-Day Medication Schedule Calendar',
    weeklyTrend: 'Weekly dose completion trend',
    noDosesScheduled: 'No doses scheduled',
    noTasksToday: 'No tasks scheduled for today.',
    of: 'of',
  },
};

/**
 * Voice synthesis reader for rural accessibility
 */
export function speakText(text: string, lang: LanguageCode = 'en'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;

  if (lang === 'hi') {
    utterance.lang = 'hi-IN';
  } else if (lang === 'pa') {
    utterance.lang = 'pa-IN';
  } else if (lang === 'mr') {
    utterance.lang = 'mr-IN';
  } else if (lang === 'bn') {
    utterance.lang = 'bn-IN';
  } else if (lang === 'ta') {
    utterance.lang = 'ta-IN';
  } else {
    utterance.lang = 'en-IN';
  }

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(lang));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * React hook for UI localization and voice assistance
 * Defaults to 'en' (English) across all pages unless the user explicitly switches.
 */
export function useTranslation() {
  const prefLang = useAppPreferencesStore((s) => s.language) || 'en';
  const currentLanguage: LanguageCode = (prefLang in TRANSLATIONS) ? (prefLang as LanguageCode) : 'en';

  const t = (key: keyof Translations | string, fallback?: string): string => {
    return (
      (TRANSLATIONS[currentLanguage] as any)?.[key] ||
      (TRANSLATIONS.en as any)?.[key] ||
      fallback ||
      (key as string)
    );
  };

  const speak = (text: string): void => {
    speakText(text, currentLanguage);
  };

  return {
    t,
    currentLanguage,
    speak,
  };
}
