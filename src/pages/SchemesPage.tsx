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
} from 'lucide-react';

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
  rationCategory: string; // 'BPL' | 'AAY' | 'APL_ORANGE' | 'WHITE' | 'NONE'
  pathway: string;
  isPregnantOrPostnatal: boolean;
  age: number;
}

const SCHEMES: SchemeRule[] = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat PM-JAY',
    nameRegional: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    category: 'national',
    coverageAmount: 'Up to ₹5,00,000 / family / year',
    summary: 'Secondary & tertiary hospitalization coverage in empanelled public and private hospitals across India.',
    details: 'Covers pre-hospitalization (3 days), hospitalization, ICU, surgery, diagnostics, and 15 days post-discharge medications.',
    helpline: '14555 / 1800 111 565',
    officialPortal: 'https://pmjay.gov.in',
    documentsRequired: [
      'Aadhaar Card (identity proof)',
      'Ration Card (NFSA / BPL / Antyodaya)',
      'Ayushman Golden Card (if already issued)',
      'Discharge Summary & Prescription',
    ],
    eligibilityCheck: (a) => {
      if (['BPL', 'AAY', 'APL_ORANGE'].includes(a.rationCategory)) return 'likely';
      if (a.rationCategory === 'WHITE') return 'maybe';
      return 'maybe';
    },
    notes: 'Free treatment for secondary and surgical care. Check with the Ayushman Mitra desk at your Taluka/District hospital.',
  },
  {
    id: 'mjpjay',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    nameRegional: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना (महाराष्ट्र शासन)',
    category: 'state',
    coverageAmount: 'Up to ₹5,00,000 / family / year',
    summary: 'Maharashtra State health assurance scheme for state residents, covering 1,356 medical and surgical procedures.',
    details: 'Applicable in Maharashtra empanelled government and trust/private hospitals. Covers post-operative follow-up and medicine package.',
    helpline: '155388 / 1800 233 2200',
    officialPortal: 'https://www.jeevandayee.gov.in',
    documentsRequired: [
      'Yellow or Orange Ration Card (Maharashtra)',
      'Aadhaar Card or Voter ID of patient',
      'Doctor referral note or hospital admission slip',
      'Passport size photo',
    ],
    eligibilityCheck: (a) => {
      if (a.state.toLowerCase().includes('maha') && ['BPL', 'AAY', 'APL_ORANGE'].includes(a.rationCategory)) return 'likely';
      if (a.state.toLowerCase().includes('maha')) return 'maybe';
      return 'ineligible';
    },
    notes: 'Universalized scheme in Maharashtra. Yellow and Orange ration card holders have zero out-of-pocket costs at empanelled centres.',
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    nameRegional: 'प्रधानमंत्री मातृ वंदना योजना (मातृत्व लाभ)',
    category: 'maternal',
    coverageAmount: '₹5,000 in Direct Cash Transfer',
    summary: 'Maternity benefit cash incentive directly deposited into Aadhaar-linked bank account in installments.',
    details: 'Supports nutritional needs and compensates wage loss during pregnancy and post-delivery lactation.',
    helpline: '011-23382393 / 104',
    officialPortal: 'https://pmmvy.wcd.gov.in',
    documentsRequired: [
      'Mother and Father Aadhaar Cards',
      'Mother-Child Protection (MCP) Card registered with ASHA/ANM',
      'Aadhaar-seeded Bank Passbook copy',
      'Delivery/Discharge certificate from health facility',
    ],
    eligibilityCheck: (a) => {
      if (a.isPregnantOrPostnatal || a.pathway === 'PREGNANCY') return 'likely';
      return 'ineligible';
    },
    notes: 'Register through your local ASHA worker or Anganwadi centre within 270 days of delivery.',
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    nameRegional: 'जननी सुरक्षा योजना (संस्थात्मक प्रसूती सहाय्य)',
    category: 'maternal',
    coverageAmount: '₹1,400 Cash Assistance (Rural)',
    summary: 'Safe motherhood intervention promoting institutional delivery in rural public health facilities.',
    details: 'Paid immediately at discharge from Sub-District Hospital, Rural Hospital, or Primary Health Centre.',
    helpline: '104 (Health Helpline)',
    officialPortal: 'https://nhm.gov.in',
    documentsRequired: [
      'MCP Card (Mother-Child Protection Card)',
      'BPL / SC / ST Certificate (if applicable)',
      'Institutional Delivery Discharge Slip',
      'Bank details for DBT transfer',
    ],
    eligibilityCheck: (a) => {
      if (a.isPregnantOrPostnatal || a.pathway === 'PREGNANCY') return 'likely';
      return 'ineligible';
    },
    notes: 'ASHA worker receives accompanying incentive; patient receives direct financial assistance at discharge.',
  },
  {
    id: 'nikshay',
    name: 'Nikshay Poshan Yojana (TB Nutrition Support)',
    nameRegional: 'निक्षय पोषण योजना (टीबी पोषण सहाय्य)',
    category: 'disease',
    coverageAmount: '₹500 / month throughout treatment',
    summary: 'Direct Benefit Transfer (DBT) scheme providing financial incentive for nutritional support to tuberculosis patients.',
    details: 'Provided monthly for the entire duration of DOTS anti-tubercular medication regimen (typically 6 months).',
    helpline: '1800-11-6666 (Nikshay Helpline)',
    officialPortal: 'https://nikshay.in',
    documentsRequired: [
      'Nikshay Patient ID (issued by PHC/DOTS centre)',
      'Aadhaar Card',
      'Active Bank Account Passbook (Aadhaar linked)',
      'DOTS Treatment Card / Discharge Note',
    ],
    eligibilityCheck: (a) => {
      if (a.pathway === 'TUBERCULOSIS') return 'likely';
      return 'ineligible';
    },
    notes: 'Enrolment done directly at your Primary Health Centre or by the TB Health Visitor (TBHV).',
  },
];

export const SchemesPage: React.FC = () => {
  const [answers, setAnswers] = useState<QuestionnaireState>({
    state: 'Maharashtra',
    rationCategory: 'APL_ORANGE',
    pathway: 'POST_SURGERY',
    isPregnantOrPostnatal: false,
    age: 48,
  });

  const [hasEvaluated, setHasEvaluated] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<SchemeRule | null>(null);

  const eligibleSchemes = SCHEMES.filter(
    (s) => s.eligibilityCheck(answers) === 'likely'
  );
  const maybeSchemes = SCHEMES.filter(
    (s) => s.eligibilityCheck(answers) === 'maybe'
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-100 text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Govt Schemes & Hospital Benefits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Government Scheme Eligibility Checker
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Free healthcare and cash support schemes available for rural patients in Maharashtra and across India. 100% offline rule-based evaluation.
          </p>
        </div>
      </div>

      {/* Guided Questionnaire */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Eligibility Profile</h2>
            <p className="text-xs text-slate-500">Answer 4 quick questions to see all applicable schemes</p>
          </div>
          <button
            onClick={() => setHasEvaluated(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Eligibility
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* State */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              State of Residence
            </label>
            <select
              value={answers.state}
              onChange={(e) => setAnswers({ ...answers, state: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Other">Other States</option>
            </select>
          </div>

          {/* Ration Card */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Ration Card Category
            </label>
            <select
              value={answers.rationCategory}
              onChange={(e) => setAnswers({ ...answers, rationCategory: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="BPL">Yellow / BPL (Below Poverty Line)</option>
              <option value="AAY">Antyodaya Anna Yojana (AAY)</option>
              <option value="APL_ORANGE">Orange / Kesari Card (Maharashtra)</option>
              <option value="WHITE">White Card / General</option>
            </select>
          </div>

          {/* Pathway / Condition */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Clinical Condition
            </label>
            <select
              value={answers.pathway}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  pathway: e.target.value,
                  isPregnantOrPostnatal: e.target.value === 'PREGNANCY',
                })
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="POST_SURGERY">Post-Surgery Recovery</option>
              <option value="PREGNANCY">Pregnancy / Postnatal</option>
              <option value="DIABETES">Diabetes Care</option>
              <option value="TUBERCULOSIS">Tuberculosis (DOTS)</option>
              <option value="HYPERTENSION">Hypertension / Cardiac</option>
            </select>
          </div>

          {/* Pregnancy Check */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Pregnant / Delivered in last year?
            </label>
            <select
              value={answers.isPregnantOrPostnatal ? 'yes' : 'no'}
              onChange={(e) =>
                setAnswers({ ...answers, isPregnantOrPostnatal: e.target.value === 'yes' })
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="no">No</option>
              <option value="yes">Yes (Eligible for maternal benefits)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasEvaluated && (
        <div className="space-y-6">
          {/* Likely Eligible Schemes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-base font-bold text-slate-900">
                Highly Likely to Be Eligible ({eligibleSchemes.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-card hover:border-emerald-500 transition cursor-pointer flex flex-col justify-between space-y-4"
                  onClick={() => setSelectedScheme(scheme)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Likely Eligible
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {scheme.coverageAmount}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{scheme.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{scheme.nameRegional}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{scheme.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {scheme.helpline.split('/')[0]}
                    </span>
                    <button className="text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                      View Documents & Guide <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maybe Eligible Schemes */}
          {maybeSchemes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h2 className="text-base font-bold text-slate-900">
                  May Be Eligible / Check at PHC ({maybeSchemes.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maybeSchemes.map((scheme) => (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card hover:border-amber-400 transition cursor-pointer flex flex-col justify-between space-y-4"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Verify at PHC
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {scheme.coverageAmount}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{scheme.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{scheme.nameRegional}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{scheme.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Helpline: {scheme.helpline}</span>
                      <button className="text-sky-600 font-bold flex items-center gap-1 hover:underline">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Disclaimer Badge */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Indicative Guidance Only — Verify at Your PHC / Ayushman Mitra</p>
          <p className="text-[11px] text-amber-800">
            Government scheme eligibility depends on active ration database records and hospital empanelment. Recovery Compass does not approve claims or disburse funds. Visit your Primary Health Centre or ask your ASHA worker to confirm enrolment.
          </p>
        </div>
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedScheme.coverageAmount}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedScheme.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedScheme.nameRegional}</p>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                className="text-slate-400 hover:text-slate-600 p-2 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">What is Covered?</h4>
                <p className="leading-relaxed">{selectedScheme.details}</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <h4 className="font-bold text-emerald-900">Required Documents Checklist</h4>
                <ul className="space-y-1.5 pl-2">
                  {selectedScheme.documentsRequired.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">How to Claim / Enrol</h4>
                <p className="leading-relaxed text-slate-600">{selectedScheme.notes}</p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <a
                  href={`tel:${selectedScheme.helpline.split('/')[0].trim()}`}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-800"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Helpline: {selectedScheme.helpline.split('/')[0]}
                </a>
                <a
                  href={selectedScheme.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-200"
                >
                  Official Govt Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
