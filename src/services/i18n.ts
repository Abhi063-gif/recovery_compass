/**
 * Recovery Compass — Multilingual & Voice Accessibility Service
 *
 * Implements PRD v3.0 Tier 1 Languages:
 * - English (en)
 * - Hindi (hi)
 * - Marathi (mr)
 *
 * Includes text-to-speech (TTS) voice guidance for low-literacy rural patients.
 */

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface Translations {
  today: string;
  timeline: string;
  medications: string;
  symptoms: string;
  safety: string;
  schemes: string;
  facilities: string;
  ashaCaseload: string;
  day: string;
  takeMedicine: string;
  completed: string;
  pending: string;
  emergencyTitle: string;
  emergencySubtitle: string;
  callAmbulance: string;
  verifiedPlan: string;
  savedOffline: string;
  syncNow: string;
  synced: string;
  readAloud: string;
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
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    today: 'Today',
    timeline: '15-Day Timeline',
    medications: 'Medications',
    symptoms: 'Symptom Log',
    safety: 'Red Flags & Safety',
    schemes: 'Govt Schemes',
    facilities: 'Nearby Facilities',
    ashaCaseload: 'ASHA Caseload',
    day: 'Day',
    takeMedicine: 'Take Medicine',
    completed: 'Completed',
    pending: 'Pending',
    emergencyTitle: 'Medical Emergency?',
    emergencySubtitle: 'If you have heavy bleeding, severe breathlessness or chest pain:',
    callAmbulance: 'Call 108 Ambulance',
    verifiedPlan: 'Verified Recovery Plan',
    savedOffline: 'Saved on phone (Offline ready)',
    syncNow: 'Sync Now',
    synced: 'Fully Synced',
    readAloud: 'Read aloud',
    uploadDischarge: 'Upload Discharge Summary',
    verificationBadge: 'Clinician Verified',
    restrictions: 'Activity Restrictions',
    followUp: 'Next Follow-up',
    doctorQuestions: 'Questions for Doctor',
    familyCircle: 'Family Circle',
    ashaVisit: 'ASHA Home Visit',
    riskTierHigh: 'High Risk (Red)',
    riskTierMedium: 'Moderate Risk (Amber)',
    riskTierLow: 'Stable (Green)',
  },
  hi: {
    today: 'आज का दिन',
    timeline: '15-दिवसीय समयरेखा',
    medications: 'दवाइयाँ',
    symptoms: 'लक्षण दर्ज करें',
    safety: 'खतरे के संकेत (रेड फ्लैग)',
    schemes: 'सरकारी योजनाएँ',
    facilities: 'निकटतम स्वास्थ्य केंद्र',
    ashaCaseload: 'आशा कार्यकर्ता सूची',
    day: 'दिन',
    takeMedicine: 'दवा लें',
    completed: 'पूर्ण हुआ',
    pending: 'शेष',
    emergencyTitle: 'आपातकालीन स्थिति?',
    emergencySubtitle: 'यदि अत्यधिक रक्तस्राव, सांस फूलना या सीने में दर्द हो:',
    callAmbulance: '108 एम्बुलेंस को कॉल करें',
    verifiedPlan: 'सत्यापित देखभाल योजना',
    savedOffline: 'फोन पर सुरक्षित (ऑफलाइन उपलब्ध)',
    syncNow: 'अभी सिंक करें',
    synced: 'सिंक हो गया',
    readAloud: 'आवाज़ में सुनें',
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
  },
  mr: {
    today: 'आजचा दिवस',
    timeline: '१५-दिवसीय पुनर्प्राप्ती',
    medications: 'औषधे',
    symptoms: 'लक्षण नोंद',
    safety: 'धोक्याचे संकेत (रेड फ्लॅग)',
    schemes: 'सरकारी योजना',
    facilities: 'जवळचे आरोग्य केंद्र',
    ashaCaseload: 'आशा सेविका यादी',
    day: 'दिवस',
    takeMedicine: 'औषध घ्या',
    completed: 'पूर्ण झाले',
    pending: 'बाकी',
    emergencyTitle: 'तात्काळ वैद्यकीय मदत हवी आहे?',
    emergencySubtitle: 'जास्त रक्तस्राव, धाप लागणे किंवा छातीत तीव्र वेदना असल्यास:',
    callAmbulance: '१०८ रुग्णवाहिकेला फोन करा',
    verifiedPlan: 'तपासलेली उपचार योजना',
    savedOffline: 'मोबाईलवर सुरक्षित (ऑफलाईन कार्यक्षम)',
    syncNow: 'आता सिंक करा',
    synced: 'सिंक पूर्ण',
    readAloud: 'आवाजात ऐका',
    uploadDischarge: 'डिस्चार्ज कार्ड अपलोड करा',
    verificationBadge: 'वैद्यकीय तपासणी पूर्ण',
    restrictions: 'सावधगिरी व बंधने',
    followUp: 'पुढील तपासणी',
    doctorQuestions: 'डॉक्टरांना विचारायचे प्रश्न',
    familyCircle: 'कुटुंब सदस्य',
    ashaVisit: 'आशा सेविका भेट',
    riskTierHigh: 'उच्च धोका (लाल)',
    riskTierMedium: 'मध्यम धोका (पिवळा)',
    riskTierLow: 'सुरक्षित (हिरवा)',
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

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly slower for clear comprehension

  if (lang === 'hi') {
    utterance.lang = 'hi-IN';
  } else if (lang === 'mr') {
    utterance.lang = 'mr-IN';
  } else {
    utterance.lang = 'en-IN';
  }

  // Fallback voice selection if regional voice is available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(lang));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
