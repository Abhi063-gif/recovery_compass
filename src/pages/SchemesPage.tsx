import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  Info,
  Award,
  Sparkles,
  RefreshCw,
  Search,
  Building2,
} from 'lucide-react';
import { useTranslation } from '@/services/i18n';

interface SchemeRule {
  id: string;
  name: string;
  nameRegional: string;
  category: 'national' | 'state' | 'maternal' | 'disease';
  coverageAmount: string;
  summary: string;
  details: string;
  helpline: string;
  officialPortal: string;
  documentsRequired: string[];
  eligibilityCheck: (answers: QuestionnaireState) => 'likely' | 'maybe' | 'ineligible';
  notes: string;
}

interface QuestionnaireState {
  state: string;
  rationCategory: string; // 'BPL' | 'AAY' | 'BLUE_CARD_PUNJAB' | 'GENERAL'
  pathway: string;
  isPregnantOrPostnatal: boolean;
  age: number;
}

const AUTHENTIC_INDIAN_SCHEMES: SchemeRule[] = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat PM-JAY',
    nameRegional: 'ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਜਨ ਅਰੋਗਿਆ ਯੋਜਨਾ / आयुष्मान भारत',
    category: 'national',
    coverageAmount: 'Up to ₹5,00,000 / family / year',
    summary: 'Secondary & tertiary hospitalization coverage in empanelled public and private hospitals across India.',
    details: 'Covers pre-hospitalization (3 days), surgical procedures, ICU, diagnostic tests, and 15 days post-discharge medications.',
    helpline: '14555 / 1800 111 565',
    officialPortal: 'https://pmjay.gov.in',
    documentsRequired: [
      'Aadhaar Card (identity proof)',
      'Ration Card / NFSA / Antyodaya Card',
      'Ayushman Card (PM-JAY Golden Card)',
      'Hospital Discharge Summary & Treatment Slips',
    ],
    eligibilityCheck: (a) => {
      if (['BPL', 'AAY', 'BLUE_CARD_PUNJAB'].includes(a.rationCategory)) return 'likely';
      return 'maybe';
    },
    notes: 'Free cashless treatment for surgical care. Check with the Ayushman Mitra desk at your Civil Hospital or empanelled facility.',
  },
  {
    id: 'ab-mmjby',
    name: 'Ayushman Bharat Mukh Mantri Sehat Bima Yojana (AB-MMJBY) — Punjab',
    nameRegional: 'ਮੁੱਖ ਮੰਤਰੀ ਸਿਹਤ ਬੀਮਾ ਯੋਜਨਾ (ਪੰਜਾਬ ਸਰਕਾਰ)',
    category: 'state',
    coverageAmount: 'Up to ₹5,00,000 / family / year',
    summary: 'Punjab State flagship health assurance scheme covering more than 65% of the state population (over 44 lakh families).',
    details: 'Provides cashless treatment across 900+ empanelled government and private hospitals in Punjab. Covers post-operative medicines and diagnostic packages.',
    helpline: '104 (Punjab Health Helpline) / 14555',
    officialPortal: 'https://sha.punjab.gov.in',
    documentsRequired: [
      'Aadhaar Card with Punjab residence',
      'Punjab Blue Ration Card (NFSA) / J-Form (Farmers) / Sugarcane weight slip / Excise card',
      'Doctor prescription / discharge slip from Government Hospital',
      'Passport size photograph',
    ],
    eligibilityCheck: (a) => {
      if (a.state.toLowerCase().includes('punjab') && ['BPL', 'AAY', 'BLUE_CARD_PUNJAB'].includes(a.rationCategory)) return 'likely';
      if (a.state.toLowerCase().includes('punjab')) return 'likely';
      return 'maybe';
    },
    notes: 'Empanelled across all Civil Hospitals and Sub-Divisional Hospitals in Punjab. Zero out-of-pocket hospitalisation cost.',
  },
  {
    id: 'jssk',
    name: 'Janani Shishu Suraksha Karyakram (JSSK)',
    nameRegional: 'ਜਨਨੀ ਸ਼ਿਸ਼ੂ ਸੁਰੱਖਿਆ ਕਾਰਜਕ੍ਰਮ (ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫਤ ਜਣੇਪਾ ਸੇਵਾਵਾਂ)',
    category: 'maternal',
    coverageAmount: '100% Free Treatment, Medicines & Transport',
    summary: 'Universal zero-expense delivery entitlement for pregnant women and sick neonates up to 30 days post-birth in public health facilities.',
    details: 'Covers completely free Normal & Caesarean deliveries, zero-cost drugs and consumables, free diagnostics, free diet during stay, and free 108 ambulance transport.',
    helpline: '108 (Free Drop-back Ambulance) / 104',
    officialPortal: 'https://nhm.gov.in',
    documentsRequired: [
      'Mother and Child Protection (MCP) Card registered with ASHA/ANM',
      'Aadhaar Card of mother',
      'Institutional Delivery / Hospital Admission Slip',
    ],
    eligibilityCheck: (a) => {
      if (a.isPregnantOrPostnatal || a.pathway === 'PREGNANCY') return 'likely';
      return 'ineligible';
    },
    notes: 'No out-of-pocket expenses allowed in Government Civil Hospitals, CHCs, or PHCs. Includes free home drop-back in 108 ambulance.',
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    nameRegional: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਮਾਤਰੂ ਵੰਦਨਾ ਯੋਜਨਾ (ਮਾਤ੍ਰਤਵ ਲਾਭ)',
    category: 'maternal',
    coverageAmount: '₹5,000 to ₹6,000 Direct Benefit Transfer (DBT)',
    summary: 'Maternity financial incentive credited directly into Aadhaar-linked bank accounts in installments.',
    details: 'Compensates wage loss and promotes institutional delivery and early infant immunization.',
    helpline: '104 / 011-23382393',
    officialPortal: 'https://pmmvy.wcd.gov.in',
    documentsRequired: [
      'MCP Card registered at Sub-Centre / Anganwadi',
      'Mother and Father Aadhaar Card',
      'Aadhaar-seeded Bank Passbook',
      'Child Birth Registration Certificate',
    ],
    eligibilityCheck: (a) => {
      if (a.isPregnantOrPostnatal || a.pathway === 'PREGNANCY') return 'likely';
      return 'ineligible';
    },
    notes: 'Register via your local ASHA worker or Anganwadi centre in your village block.',
  },
  {
    id: 'rbsk',
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK) — Punjab',
    nameRegional: 'ਰਾਸ਼ਟਰੀ ਬਾਲ ਸਵਾਸਥ ਪ੍ਰੋਗਰਾਮ (ਬੱਚਿਆਂ ਲਈ ਮੁਫਤ ਸਰਜਰੀ ਅਤੇ ਇਲਾਜ)',
    category: 'disease',
    coverageAmount: '100% Free Screening & Tertiary Care',
    summary: 'Child health screening and early intervention covering 4Ds (Defects at birth, Diseases, Deficiencies, Development delays) from birth to 18 years.',
    details: 'Free corrective surgeries for Congenital Heart Disease (CHD), Cleft Lip/Palate, Clubfoot, and neural tube defects at empanelled tertiary hospitals (e.g. PGIMER Chandigarh).',
    helpline: '104 (Punjab Health Helpline)',
    officialPortal: 'https://nhm.punjab.gov.in',
    documentsRequired: [
      'RBSK Mobile Health Team Screening Slip / School Health Card',
      'Child Birth Certificate or Aadhaar Card',
      'Parent Aadhaar Card',
    ],
    eligibilityCheck: (a) => {
      if (a.age <= 18) return 'likely';
      return 'ineligible';
    },
    notes: 'Screening conducted by dedicated RBSK Mobile Medical Teams at Anganwadi Centres and Government Schools across Punjab.',
  },
  {
    id: 'punjab-free-meds',
    name: 'Punjab Free Essential Drugs & Diagnostics (Aam Aadmi Clinics)',
    nameRegional: 'ਮੁਫਤ ਦਵਾਈਆਂ ਅਤੇ ਲੈਬ ਟੈਸਟ ਸਕੀਮ (ਆਮ ਆਦਮੀ ਕਲੀਨਿਕ ਅਤੇ ਪੀ.ਐਚ.ਸੀ)',
    category: 'state',
    coverageAmount: '100% Free Drugs & 40+ Diagnostic Tests',
    summary: 'Free essential medicines and pathology diagnostics across 650+ Aam Aadmi Clinics, PHCs, and Civil Hospitals in Punjab.',
    details: 'Provides free blood tests, sugar tests, ECG, post-op wound dressings, and over 100 free generic pharmaceuticals for surgery and chronic illness patients.',
    helpline: '104 (Health Helpline)',
    officialPortal: 'https://punjab.gov.in',
    documentsRequired: [
      'Doctor Prescription Slip from PHC or Civil Hospital',
      'Aadhaar Card or Phone Number for OPD token',
    ],
    eligibilityCheck: () => 'likely',
    notes: 'Universal entitlement for all residents of Punjab visiting public health facilities. No ration card required.',
  },
  {
    id: 'nikshay',
    name: 'Nikshay Poshan Yojana (TB Nutritional Support DBT)',
    nameRegional: 'ਨਿਕਸ਼ੈ ਪੋਸ਼ਣ ਯੋਜਨਾ (ਟੀ.ਬੀ. ਮਰੀਜ਼ ਪੋਸ਼ਣ ਸਹਾਇਤਾ)',
    category: 'disease',
    coverageAmount: '₹500 / month direct cash transfer',
    summary: 'Direct cash assistance credited monthly into patient accounts for nutritional support during anti-tubercular medication.',
    details: 'Paid every month during the entire DOTS treatment regimen (typically 6 to 9 months) to prevent treatment defaults and support recovery.',
    helpline: '1800-11-6666 (Nikshay Helpline)',
    officialPortal: 'https://nikshay.in',
    documentsRequired: [
      'Nikshay ID issued by PHC / Civil Hospital DOTS Centre',
      'Patient Aadhaar Card',
      'Active Bank Account Passbook (Aadhaar linked)',
    ],
    eligibilityCheck: (a) => {
      if (a.pathway === 'TUBERCULOSIS') return 'likely';
      return 'ineligible';
    },
    notes: 'Enrolment completed automatically by the TB Health Visitor or ASHA worker at the time of diagnosis.',
  },
];

export const SchemesPage: React.FC = () => {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<QuestionnaireState>({
    state: 'Punjab',
    rationCategory: 'BLUE_CARD_PUNJAB',
    pathway: 'POST_SURGERY',
    isPregnantOrPostnatal: false,
    age: 48,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScheme, setSelectedScheme] = useState<SchemeRule | null>(null);

  const eligibleSchemes = AUTHENTIC_INDIAN_SCHEMES.filter(
    (s) => s.eligibilityCheck(answers) === 'likely'
  );
  const maybeSchemes = AUTHENTIC_INDIAN_SCHEMES.filter(
    (s) => s.eligibilityCheck(answers) === 'maybe'
  );

  const displayedSchemes = AUTHENTIC_INDIAN_SCHEMES.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (searchQuery.trim() === '') return true;
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameRegional.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-card border border-navy-700 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800 text-emerald-400 text-xs font-semibold tracking-wide border border-navy-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>National & Punjab State Health Schemes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Government Health & Recovery Financial Schemes
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verify your family's eligibility for cashless surgical care under Ayushman Bharat PM-JAY, Punjab Mukh Mantri Sehat Bima Yojana (AB-MMJBY), free maternity benefits (JSSK, PMMVY), and free essential medicines.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-navy-800 px-3 py-1.5 rounded-lg border border-navy-700 text-slate-200">
              National Helpline: <strong className="text-white">14555</strong>
            </span>
            <span className="bg-navy-800 px-3 py-1.5 rounded-lg border border-navy-700 text-slate-200">
              Punjab Health Helpline: <strong className="text-white">104</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Eligibility Evaluator Card */}
      <div className="rc-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-red" />
            <h2 className="text-base font-semibold text-navy-900">Patient Eligibility Questionnaire</h2>
          </div>
          <span className="text-xs text-content-secondary">Auto-matched with patient recovery profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* State */}
          <div className="space-y-1">
            <label className="font-semibold text-navy-900">State of Residence</label>
            <select
              value={answers.state}
              onChange={(e) => setAnswers({ ...answers, state: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-surface-border rounded-lg text-navy-900 focus:outline-none focus:border-brand-red"
            >
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Chandigarh">Chandigarh (UT)</option>
              <option value="Other">Other State</option>
            </select>
          </div>

          {/* Ration / Beneficiary Card */}
          <div className="space-y-1">
            <label className="font-semibold text-navy-900">Beneficiary / Ration Card</label>
            <select
              value={answers.rationCategory}
              onChange={(e) => setAnswers({ ...answers, rationCategory: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-surface-border rounded-lg text-navy-900 focus:outline-none focus:border-brand-red"
            >
              <option value="BLUE_CARD_PUNJAB">Punjab Blue Ration Card (Atta-Dal)</option>
              <option value="BPL">BPL / Antyodaya (AAY)</option>
              <option value="GENERAL">General / Standard Card</option>
            </select>
          </div>

          {/* Clinical Pathway */}
          <div className="space-y-1">
            <label className="font-semibold text-navy-900">Care Pathway</label>
            <select
              value={answers.pathway}
              onChange={(e) => setAnswers({ ...answers, pathway: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-surface-border rounded-lg text-navy-900 focus:outline-none focus:border-brand-red"
            >
              <option value="POST_SURGERY">Post-Surgical Recovery</option>
              <option value="PREGNANCY">Maternal / Postnatal</option>
              <option value="DIABETES">Diabetes & Hypertension</option>
              <option value="TUBERCULOSIS">Tuberculosis (DOTS)</option>
            </select>
          </div>

          {/* Pregnant or Postnatal */}
          <div className="space-y-1">
            <label className="font-semibold text-navy-900">Maternity Condition</label>
            <select
              value={answers.isPregnantOrPostnatal ? 'yes' : 'no'}
              onChange={(e) => setAnswers({ ...answers, isPregnantOrPostnatal: e.target.value === 'yes' })}
              className="w-full p-2 bg-slate-50 border border-surface-border rounded-lg text-navy-900 focus:outline-none focus:border-brand-red"
            >
              <option value="no">General Surgical / Chronic</option>
              <option value="yes">Pregnant or Post-Delivery (&lt; 1 yr)</option>
            </select>
          </div>
        </div>

        {/* Results Banner */}
        <div className="bg-clinical-green-bg border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-clinical-green flex-shrink-0" />
            <span className="text-emerald-900 font-medium">
              Based on your profile, you are <strong>likely eligible for {eligibleSchemes.length} Government Health Schemes</strong> with zero out-of-pocket costs.
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All Schemes', value: 'ALL' },
            { label: 'Punjab State Schemes', value: 'state' },
            { label: 'National Schemes', value: 'national' },
            { label: 'Maternal & Child', value: 'maternal' },
            { label: 'Specific Illness', value: 'disease' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white border border-surface-border text-navy-800 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Search scheme name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-surface-border rounded-input focus:outline-none focus:border-brand-red placeholder:text-content-muted"
          />
        </div>
      </div>

      {/* Schemes List */}
      <div className="space-y-3">
        {displayedSchemes.map((scheme) => {
          const status = scheme.eligibilityCheck(answers);
          return (
            <div
              key={scheme.id}
              className="rc-card p-5 hover:border-slate-300 transition-all duration-150 space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        scheme.category === 'state'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : scheme.category === 'national'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : scheme.category === 'maternal'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {scheme.category === 'state' ? 'Punjab State Scheme' : scheme.category.toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        status === 'likely'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : status === 'maybe'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status === 'likely' ? 'Likely Eligible' : status === 'maybe' ? 'Check Required' : 'Not Applicable'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-navy-900 pt-1">
                    {scheme.name}
                  </h3>
                  <div className="text-xs text-content-secondary font-medium">
                    {scheme.nameRegional}
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-xs text-content-muted">Financial Benefit</div>
                  <div className="text-sm font-bold text-clinical-green">{scheme.coverageAmount}</div>
                </div>
              </div>

              <p className="text-xs text-navy-800 leading-relaxed">
                {scheme.summary}
              </p>

              {/* Collapsible Details or Structured Badges */}
              <div className="bg-surface-subtle p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-navy-900">Key Coverage: </span>
                  <span className="text-content-secondary">{scheme.details}</span>
                </div>
                <div>
                  <span className="font-semibold text-navy-900">Documents Needed: </span>
                  <span className="text-content-secondary">{scheme.documentsRequired.join(' • ')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-surface-border text-xs">
                <div className="flex items-center gap-1.5 text-content-secondary">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Helpline: <strong>{scheme.helpline}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={scheme.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rc-btn-secondary text-xs py-1 px-3"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
