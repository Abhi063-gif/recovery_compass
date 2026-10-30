import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  Shield,
  Heart,
  User,
  AlertTriangle,
  FileText,
  Activity,
  Globe,
  Stethoscope,
  Brain,
  Wind,
  Baby,
  Sparkles,
  Flame,
  Search,
  CheckCircle2,
  Ribbon,
  ShieldAlert,
  BedDouble
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAuthStore } from '@/stores/useAuthStore';

export interface RecoveryPathwayOption {
  id: string;
  category: 'all' | 'surgical' | 'cardiac' | 'orthopedic' | 'neuro' | 'specialty';
  categoryLabel: string;
  title: string;
  badge?: string;
  description: string;
  examples: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  date1Label: string;
  date2Label: string;
}

export const RECOVERY_PATHWAYS: RecoveryPathwayOption[] = [
  {
    id: 'post-surgery-general',
    category: 'surgical',
    categoryLabel: 'Surgical',
    title: 'General & Abdominal Surgery',
    badge: 'Most Common',
    description: 'Laparoscopy, Cholecystectomy, Appendectomy, Hernia Repair, Bowel Resection',
    examples: 'Incision site care, lifting restrictions, early walking, pain titration, bland diet',
    icon: Activity,
    color: 'bg-rose-700 text-white',
    date1Label: 'Date of Surgery / Procedure',
    date2Label: 'Date of Discharge',
  },
  {
    id: 'orthopedic-joint',
    category: 'orthopedic',
    categoryLabel: 'Orthopedic',
    title: 'Orthopedic & Joint Replacement',
    badge: 'High Demand',
    description: 'Total Knee Arthroplasty (TKA), Total Hip Replacement (THA), Spine Fusion, Fracture Fixation',
    examples: 'DVT prevention exercises, weight-bearing limits, physical therapy schedule, wound check',
    icon: Stethoscope,
    color: 'bg-indigo-700 text-white',
    date1Label: 'Date of Surgery / Procedure',
    date2Label: 'Date of Discharge',
  },
  {
    id: 'cardiac-rehab',
    category: 'cardiac',
    categoryLabel: 'Cardiac',
    title: 'Cardiac Rehabilitation & Post-MI',
    badge: 'Specialized',
    description: 'Coronary Bypass (CABG), Angioplasty / Stent, Heart Valve Repair, Heart Failure Step-Down',
    examples: 'Heart rate target zones, fluid restriction monitoring, anti-platelet compliance, sternal precautions',
    icon: Heart,
    color: 'bg-red-700 text-white',
    date1Label: 'Date of Cardiac Event / Procedure',
    date2Label: 'Date of Hospital Discharge',
  },
  {
    id: 'neuro-stroke',
    category: 'neuro',
    categoryLabel: 'Neuro & Rehab',
    title: 'Stroke & Neurological Recovery',
    badge: 'Comprehensive',
    description: 'Ischemic / Hemorrhagic Stroke, Craniotomy, Traumatic Brain Injury, Spine Surgery',
    examples: 'Mobility & speech milestones, blood pressure tracking, fall prevention, neurological red flags',
    icon: Brain,
    color: 'bg-violet-700 text-white',
    date1Label: 'Date of Neurological Event / Surgery',
    date2Label: 'Date of Discharge / Rehab Start',
  },
  {
    id: 'pulmonary-respiratory',
    category: 'specialty',
    categoryLabel: 'Specialty',
    title: 'Pulmonary & Respiratory Care',
    badge: 'Respiratory',
    description: 'Severe Pneumonia, COPD Exacerbation, Thoracic Surgery, Post-COVID Pulmonary Rehab',
    examples: 'Incentive spirometry, pulse oximetry thresholds, inhaler timing, breathing pacing',
    icon: Wind,
    color: 'bg-sky-700 text-white',
    date1Label: 'Date of Hospital Admission / Surgery',
    date2Label: 'Date of Discharge',
  },
  {
    id: 'postpartum-csection',
    category: 'specialty',
    categoryLabel: 'Maternal',
    title: 'Postpartum & C-Section Healing',
    badge: 'Maternal Care',
    description: 'Cesarean Section, High-Risk Delivery Recovery, Pelvic Floor Healing, Postpartum Care',
    examples: 'Surgical incision healing, lochia tracking, postpartum preeclampsia warning signs, infant feeding rest',
    icon: Baby,
    color: 'bg-pink-700 text-white',
    date1Label: 'Date of Delivery / C-Section',
    date2Label: 'Date of Discharge Home',
  },
  {
    id: 'oncology-chemo',
    category: 'specialty',
    categoryLabel: 'Specialty',
    title: 'Oncology & Chemotherapy Step-Down',
    badge: 'Oncology',
    description: 'Post-Surgical Tumor Resection, Chemotherapy Infusion Recovery, Radiation Step-Down',
    examples: 'Neutropenic fever protocol (100.4°F), nausea management, hydration pacing, fatigue grading',
    icon: Ribbon,
    color: 'bg-amber-700 text-white',
    date1Label: 'Date of Procedure / Infusion Cycle',
    date2Label: 'Date of Discharge',
  },
  {
    id: 'diabetic-wound',
    category: 'specialty',
    categoryLabel: 'Specialty',
    title: 'Diabetic & Chronic Wound Recovery',
    badge: 'Wound Care',
    description: 'Diabetic Foot Ulcers, Vascular Stent Recovery, Graft Care, Stoma & Ostomy Management',
    examples: 'Daily dressing change protocols, offloading compliance, blood glucose limits, tissue perfusion check',
    icon: ShieldAlert,
    color: 'bg-teal-700 text-white',
    date1Label: 'Date of Procedure / Debridement',
    date2Label: 'Date of Discharge',
  },
  {
    id: 'post-icu-acute',
    category: 'specialty',
    categoryLabel: 'Acute Care',
    title: 'Post-ICU & Acute Illness Recovery',
    badge: 'Intensive Step-Down',
    description: 'Severe Sepsis Step-Down, Critical Illness Weakness, Acute Kidney Injury Resolution',
    examples: 'Cognitive pacing, gradual endurance building, medication reconciliation, renal fluid logs',
    icon: BedDouble,
    color: 'bg-slate-800 text-white',
    date1Label: 'Date of ICU Discharge',
    date2Label: 'Date of Home Discharge',
  },
  {
    id: 'tuberculosis-dots',
    category: 'specialty',
    categoryLabel: 'National Health Mission',
    title: 'Tuberculosis (DOTS) Recovery',
    badge: 'SIH PRD Pathway',
    description: 'Directly Observed Therapy (DOTS), Sputum Check Milestones, Nikshay Nutrition Scheme',
    examples: 'Daily antibiotic adherence logging, anti-emetic timing, monthly sputum tests, Nikshay Rs 500 DBT verification',
    icon: Wind,
    color: 'bg-amber-600 text-white',
    date1Label: 'Date of Diagnosis / Treatment Start',
    date2Label: 'Date of Discharge / DOTS Enrolment',
  },
  {
    id: 'hypertension-care',
    category: 'cardiac',
    categoryLabel: 'Chronic Care',
    title: 'Hypertension & Cardiovascular Health',
    badge: 'SIH PRD Pathway',
    description: 'Essential Hypertension, Post-Hypertensive Emergency Step-Down, Antihypertensive Titration',
    examples: 'Twice daily blood pressure logging, low-sodium dietary adherence, warning signs (severe headache, vision blur)',
    icon: Heart,
    color: 'bg-rose-600 text-white',
    date1Label: 'Date of Clinical Assessment',
    date2Label: 'Date of Discharge / Regimen Start',
  },
];

const STEPS = [
  { id: 1, label: 'Pathway' },
  { id: 2, label: 'Dates' },
  { id: 3, label: 'Language' },
  { id: 4, label: 'Caregiver' },
  { id: 5, label: 'Review' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan } = usePlanStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const defaultPatientName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || ''
    : '';

  const [formData, setFormData] = useState({
    patientName: defaultPatientName,
    pathwayId: 'post-surgery-general',
    surgeryDate: new Date().toISOString().split('T')[0],
    dischargeDate: new Date().toISOString().split('T')[0],
    isCaregiver: false,
    language: 'en',
  });

  const [dateError, setDateError] = useState<string | null>(null);

  const selectedPathway = useMemo(() => {
    return (
      RECOVERY_PATHWAYS.find((p) => p.id === formData.pathwayId) || RECOVERY_PATHWAYS[0]
    );
  }, [formData.pathwayId]);

  const filteredPathways = useMemo(() => {
    return RECOVERY_PATHWAYS.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.examples.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const validateDates = () => {
    if (new Date(formData.dischargeDate) < new Date(formData.surgeryDate)) {
      setDateError('Discharge date cannot be earlier than procedure / admission date.');
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2 && !validateDates()) return;
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    } else {
      navigate('/documents/upload');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* 5-Step Horizontal Indicator */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
        {STEPS.map((s) => {
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  isDone
                    ? 'bg-rose-700 text-white'
                    : isCurrent
                    ? 'bg-rose-700 text-white ring-4 ring-rose-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1.5 ${
                  isCurrent ? 'text-rose-800 font-bold' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card Content Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* STEP 1: Rich Care Pathway Selection */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                <span>Personalized Clinical Recovery</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Select Your Care & Recovery Pathway</h1>
              <p className="text-xs text-slate-500 mt-1">
                Choose the clinical pathway that best matches your hospital discharge or procedure.
              </p>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="space-y-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by procedure (e.g. Knee replacement, Heart bypass, Stroke, C-Section, Pneumonia)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 text-slate-900"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Pathways' },
                  { id: 'surgical', label: 'Surgical' },
                  { id: 'orthopedic', label: 'Orthopedic' },
                  { id: 'cardiac', label: 'Cardiac' },
                  { id: 'neuro', label: 'Neuro & Rehab' },
                  { id: 'specialty', label: 'Specialty & Maternal' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition text-[11px] ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pathway Cards Grid */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredPathways.map((pathway) => {
                const isSelected = formData.pathwayId === pathway.id;
                const IconComponent = pathway.icon;

                return (
                  <div
                    key={pathway.id}
                    onClick={() => setFormData({ ...formData, pathwayId: pathway.id })}
                    className={`border-2 rounded-2xl p-4 sm:p-5 flex items-start justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-rose-700 bg-rose-50/50 shadow-subtle ring-1 ring-rose-700'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      <div
                        className={`p-3 rounded-2xl shrink-0 mt-0.5 shadow-sm ${pathway.color}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-900">
                            {pathway.title}
                          </span>
                          {pathway.badge && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                              {pathway.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          {pathway.description}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          <strong>Includes:</strong> {pathway.examples}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 shrink-0 mt-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-rose-700 text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPathways.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-600 font-bold">No pathways matched "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-2 text-xs font-bold text-rose-700 hover:underline"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Adaptable Milestones & Dates */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-slate-900">Patient & Recovery Milestones</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your key dates for <strong>{selectedPathway.title}</strong> to anchor your daily schedule.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {selectedPathway.date1Label}
                  </label>
                  <input
                    type="date"
                    value={formData.surgeryDate}
                    onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {selectedPathway.date2Label}
                  </label>
                  <input
                    type="date"
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {dateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Language Selection */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-slate-900">Preferred Language</h1>
              <p className="text-xs text-slate-500 mt-1">
                Choose your primary language for daily tasks, instructions, and red-flag alerts.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { code: 'en', label: 'English (US)' },
                { code: 'es', label: 'Español (Spanish)' },
                { code: 'fr', label: 'Français (French)' },
                { code: 'hi', label: 'हिन्दी (Hindi)' },
                { code: 'zh', label: '中文 (Chinese)' },
                { code: 'ar', label: 'العربية (Arabic)' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: lang.code })}
                  className={`p-3.5 rounded-2xl border text-center transition font-bold text-xs ${
                    formData.language === lang.code
                      ? 'border-rose-700 bg-rose-50 text-rose-900 ring-2 ring-rose-100 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Caregiver Assistance */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-slate-900">Caregiver Assistance</h1>
              <p className="text-xs text-slate-500 mt-1">
                Will a family member or caregiver be assisting with your recovery journey?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isCaregiver: false })}
                className={`p-5 rounded-2xl border text-left transition ${
                  !formData.isCaregiver
                    ? 'border-rose-700 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User className="w-5 h-5 text-rose-700 mb-2" />
                <span className="font-bold text-sm block">I'm managing alone</span>
                <span className="text-[11px] text-slate-500">Patient direct view and notification delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isCaregiver: true })}
                className={`p-5 rounded-2xl border text-left transition ${
                  formData.isCaregiver
                    ? 'border-rose-700 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Heart className="w-5 h-5 text-rose-700 mb-2" />
                <span className="font-bold text-sm block">With Family Caregiver</span>
                <span className="text-[11px] text-slate-500">Caregiver alerts and schedule synchronization enabled</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Final Review */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-slate-900">Review Onboarding Setup</h1>
              <p className="text-xs text-slate-500 mt-1">
                Verify your pathway details before uploading your hospital discharge document.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{formData.patientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Care Pathway:</span>
                <span className="font-bold text-rose-800">{selectedPathway.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">{selectedPathway.date1Label}:</span>
                <span className="font-bold text-slate-900">{formData.surgeryDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">{selectedPathway.date2Label}:</span>
                <span className="font-bold text-slate-900">{formData.dischargeDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Caregiver Assistance:</span>
                <span className="font-bold text-slate-900">
                  {formData.isCaregiver ? 'Yes (Caregiver Sharing Active)' : 'No (Patient Managing Alone)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <span>{currentStep === 5 ? 'Proceed to Upload' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
