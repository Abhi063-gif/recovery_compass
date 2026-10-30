/**
 * Recovery Compass — Multilingual & Voice Accessibility Service
 *
 * Implements PRD v3.0 Languages:
 * - English (en) [Default across all pages]
 * - Hindi (hi)
 * - Marathi (mr)
 * - Punjabi (pa)
 * - Bengali (bn)
 * - Tamil (ta)
 *
 * Includes text-to-speech (TTS) voice guidance for low-literacy rural patients.
 */

import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'pa' | 'bn' | 'ta';

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
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    today: 'Today',
    timeline: '15-Day Plan',
    medications: 'Medications',
    symptoms: 'Symptoms',
    safety: 'Red Flags & Safety',
    schemes: 'Govt Schemes',
    facilities: 'Nearby PHCs',
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
  },
  mr: {
    today: 'आज',
    timeline: '१५-दिवसीय आराखडा',
    medications: 'औषधे',
    symptoms: 'लक्षणे',
    safety: 'धोक्याचे संकेत (रेड फ्लॅग)',
    schemes: 'सरकारी योजना',
    facilities: 'जवळचे आरोग्य केंद्र',
    ashaCaseload: 'आशा सेविका यादी',
    anmReview: 'एएनएम तपासणी',
    family: 'कुटुंब',
    verification: 'पडताळणी',
    day: 'दिवस',
    takeMedicine: 'औषध घ्या',
    completed: 'पूर्ण झाले',
    pending: 'बाकी',
    emergencyTitle: 'तात्काळ वैद्यकीय मदत हवी आहे?',
    emergencySubtitle: 'जास्त रक्तस्राव, धाप लागणे किंवा छातीत तीव्र वेदना असल्यास:',
    emergencyHelp: 'तात्काळ / आणीबाणी मदत',
    callAmbulance: '१०८ रुग्णवाहिकेला फोन करा',
    verifiedPlan: 'तपासलेली उपचार योजना',
    verified: 'तपासलेले',
    savedOffline: 'मोबाईलवर सुरक्षित (ऑफलाईन कार्यक्षम)',
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
    ashaVisit: 'आशा सेविका भेट',
    riskTierHigh: 'उच्च धोका (लाल)',
    riskTierMedium: 'मध्यम धोका (पिवळा)',
    riskTierLow: 'सुरक्षित (हिरवा)',
    todaysProgress: 'आजची प्रगती',
    todaysTasks: 'आजची कामे',
    medicines: 'औषधे',
    tasks: 'कामे',
    appointments: 'तपासणी व भेटी',
    previousDay: 'मागील दिवस',
    nextDay: 'पुढील दिवस',
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
  },
  bn: {
    today: 'আজ',
    timeline: '১৫ দিনের পরিকল্পনা',
    medications: 'ওষুধপত্র',
    symptoms: 'লক্ষণ',
    safety: 'বিপদ সংকেত',
    schemes: 'সরকারি প্রকল্প',
    facilities: 'নিকটবর্তী স্বাস্থ্যকেন্দ্র',
    ashaCaseload: 'আশা কর্মী তালিকা',
    anmReview: 'এএনএম পর্যালোচনা',
    family: 'পরিবার',
    verification: 'যাচাইকরণ',
    day: 'দিন',
    takeMedicine: 'ওষুধ খান',
    completed: 'সম্পন্ন',
    pending: 'বাকি',
    emergencyTitle: 'জরুরি সাহায্য প্রয়োজন?',
    emergencySubtitle: 'যদি অতিরিক্ত রক্তপাত, শ্বাসকষ্ট বা বুকে ব্যথা হয়:',
    emergencyHelp: 'জরুরি সহায়তা',
    callAmbulance: '১০৮ অ্যাম্বুলেন্সে কল করুন',
    verifiedPlan: 'যাচাইকৃত পরিকল্পনা',
    verified: 'যাচাইকৃত',
    savedOffline: 'ফোনে সংরক্ষিত (অফলাইন)',
    syncNow: 'এখনই সিঙ্ক করুন',
    synced: 'সিঙ্ক সম্পন্ন',
    readAloud: 'শুনুন',
    tapToListen: 'শুনুন',
    uploadDischarge: 'ছাড়পত্র আপলোড করুন',
    verificationBadge: 'চিকিৎসক দ্বারা যাচাইকৃত',
    restrictions: 'সতর্কতা ও বিধিনিষেধ',
    followUp: 'পরবর্তী চেকআপ',
    doctorQuestions: 'ডাক্তারের জন্য প্রশ্ন',
    familyCircle: 'পরিবার সদস্য',
    ashaVisit: 'আশা কর্মীর পরিদর্শন',
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
  },
  ta: {
    today: 'இன்று',
    timeline: '15 நாள் திட்டம்',
    medications: 'மருந்துகள்',
    symptoms: 'அறிகுறிகள்',
    safety: 'ஆபத்து எச்சரிக்கை',
    schemes: 'அரசு திட்டங்கள்',
    facilities: 'அருகிலுள்ள மருத்துவமனை',
    ashaCaseload: 'ஆஷா பணியாளர் பட்டியல்',
    anmReview: 'ஏஎன்எம் மதிப்பாய்வு',
    family: 'குடும்பம்',
    verification: 'சரிபார்ப்பு',
    day: 'நாள்',
    takeMedicine: 'மருந்து சாப்பிடுங்கள்',
    completed: 'முடிந்தது',
    pending: 'நிலுவை',
    emergencyTitle: 'அவசர மருத்துவ உதவி தேவையா?',
    emergencySubtitle: 'அதிக இரத்தப்போக்கு அல்லது நெஞ்சு வலி இருந்தால்:',
    emergencyHelp: 'அவசர உதவி',
    callAmbulance: '108 ஆம்புலன்ஸை அழைக்கவும்',
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
    doctorQuestions: 'மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள்',
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
  } else if (lang === 'pa') {
    utterance.lang = 'pa-IN';
  } else if (lang === 'bn') {
    utterance.lang = 'bn-IN';
  } else if (lang === 'ta') {
    utterance.lang = 'ta-IN';
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

/**
 * React hook for UI localization and voice assistance
 * Defaults to 'en' (English) across all pages unless the user explicitly switches.
 */
export function useTranslation() {
  const prefLang = useAppPreferencesStore((s) => s.language) || 'en';
  const currentLanguage: LanguageCode = (prefLang in TRANSLATIONS) ? (prefLang as LanguageCode) : 'en';

  const t = (key: keyof Translations): string => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS.en[key] || (key as string);
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
