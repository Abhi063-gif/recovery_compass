import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Upload,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  HeartHandshake,
  AlertTriangle,
  PhoneCall,
  Activity,
  FileText,
  Building2,
  Users,
  Shield,
  Clock,
  Phone,
  WifiOff,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/services/i18n';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loadDemoPatient } = usePlanStore();
  const { isAuthenticated, user } = useAuthStore();

  const handleStartDemo = () => {
    loadDemoPatient();
    navigate('/dashboard');
  };

  const handleUploadClick = () => {
    if (isAuthenticated || user) {
      navigate('/documents/upload');
    } else {
      navigate('/login', {
        state: {
          from: '/documents/upload',
          message: 'Please sign in or create an account to upload your discharge summary.',
        },
      });
    }
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto pt-4 pb-16">
      {/* Hero Section — Two Column SaaS Healthcare Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2">
        {/* Left Column Text & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-[#C8103E] text-xs font-bold border border-rose-200">
            <ShieldCheck className="w-4 h-4 text-[#C8103E]" />
            <span>Punjab Public Health Recovery Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#17243A] tracking-tight leading-[1.15]">
            {t('heroTitle', 'Hospital Recovery, Clear & Guided at Home')}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            {t(
              'heroSubtitle',
              'Turn complex discharge summaries into clear daily recovery plans with scheduled medication alarms, danger sign detection, and offline frontline ASHA support across Punjab.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleUploadClick}
              className="px-6 py-3.5 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t('startRecovery', 'Upload Discharge Summary')}</span>
            </button>

            <button
              onClick={handleStartDemo}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('tryDemo', 'Try Live Demo')}</span>
            </button>
          </div>

          <div className="pt-2 flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Clinician Verified
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-600" />
              100% Offline Ready
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-600" />
              ASHA Field Integrated
            </span>
          </div>
        </div>

        {/* Right Column Calming Clinical Card */}
        <div className="lg:col-span-5 relative">
          <div className="bg-gradient-to-tr from-slate-50 via-white to-rose-50/40 rounded-3xl p-6 border border-[#E2E8F0] shadow-card flex flex-col space-y-4 relative overflow-hidden">
            {/* Top Preview Banner */}
            <div className="w-full rounded-2xl bg-[#17243A] p-6 flex flex-col justify-between text-white shadow-md relative overflow-hidden border border-[#25364F]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold tracking-wider uppercase bg-[#25364F] text-rose-300 px-3 py-1 rounded-full border border-slate-700">
                  Verified Recovery Plan
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Day 4 of 15
                </span>
              </div>

              <div className="text-left space-y-1">
                <span className="text-xs text-slate-300 font-medium">
                  Laparoscopic Cholecystectomy
                </span>
                <h3 className="text-xl font-bold text-white">Gurpreet Kaur</h3>
                <span className="text-xs text-slate-400 block">
                  Civil Hospital Ludhiana • Dr. Harinder Singh Dhillon (SMO)
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300">Medication Adherence:</span>
                <span className="font-bold text-white">85% (1 Dose Due Today)</span>
              </div>
            </div>

            {/* Quick Live Indicators */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C8103E]" />
                  <span className="font-semibold text-slate-800">Assigned ASHA Worker:</span>
                </div>
                <span className="font-bold text-slate-900">Harjit Kaur (Sahnewal)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span className="font-semibold text-slate-800">Follow-up Facility:</span>
                </div>
                <span className="font-bold text-slate-900">CHC Sahnewal (Day 7)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17243A]">
            {t('howItWorks', 'How RecoveryCompass Works')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A safe, clinician-in-the-loop bridge between the hospital discharge counter and rural home recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#C8103E] flex items-center justify-center font-extrabold shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {t('step1Title', '1. Upload Discharge Slip')}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t(
                  'step1Desc',
                  'Snap a photo of your hospital discharge paper. AI extracts medications, wound care, and follow-up schedules.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#17243A] flex items-center justify-center font-extrabold shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {t('step2Title', '2. Verify with Clinician')}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t(
                  'step2Desc',
                  'Review every extracted dose with high safety confidence before plan activation.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-start space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {t('step3Title', '3. Recover with ASHA Care')}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t(
                  'step3Desc',
                  'Daily schedules, voice guidance, and frontline ASHA worker home visits keep you protected at home.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Specialized Healthcare Portals Section */}
      <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#17243A]">
              Integrated Healthcare Portals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Dedicated interfaces tailored for patients, field health workers, and supervisory nurses.
            </p>
          </div>
          <Link
            to="/auth"
            className="text-xs font-bold text-[#C8103E] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Sign into Staff Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patient Portal */}
          <Link
            to="/dashboard"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#C8103E] hover:shadow-md transition group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C8103E] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#C8103E] transition">
                Patient & Family Portal
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Day-by-day 15-day timeline, medication reminders, symptom logging, and phone calendar alarms.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Open Timeline →
            </span>
          </Link>

          {/* ASHA Portal */}
          <Link
            to="/asha"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#C8103E] hover:shadow-md transition group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#C8103E] transition">
                ASHA Caseload Portal
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Village field monitoring, blister pack inspections, vital recording, and ANM escalation.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Open Caseload →
            </span>
          </Link>

          {/* ANM Portal */}
          <Link
            to="/anm"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#C8103E] hover:shadow-md transition group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#17243A] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#C8103E]" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#C8103E] transition">
                ANM Supervisory Portal
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Triage incoming clinical escalations, schedule supervisory visits, and refer to CHC/District Hospital.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Open Review Queue →
            </span>
          </Link>

          {/* Facilities & Schemes */}
          <Link
            to="/facilities"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#C8103E] hover:shadow-md transition group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#C8103E] transition">
                Nearby PHCs & Schemes
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Locate verified Punjab public hospitals, Aam Aadmi Clinics, and explore authentic AB-PMJAY & state schemes.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Explore Facilities →
            </span>
          </Link>
        </div>
      </section>

      {/* Emergency & Punjab Public Health Helpline Banner */}
      <section className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#C8103E] font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Punjab Public Health Emergency Response</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Medical Emergency or Sudden Deterioration?
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            If experiencing heavy bleeding, severe breathlessness, or persistent high fever, access Punjab emergency helplines immediately.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:108"
            className="px-5 py-3 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>Call 108 Ambulance</span>
          </a>
          <a
            href="tel:104"
            className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-sky-600" />
            <span>Call 104 Helpline</span>
          </a>
        </div>
      </section>
    </div>
  );
};
