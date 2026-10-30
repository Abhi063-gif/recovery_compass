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
  FileText
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadDemoPatient } = usePlanStore();

  const handleStartDemo = () => {
    loadDemoPatient();
    navigate('/dashboard');
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pt-2 pb-12">
      {/* Hero Section (Split 2-column like reference Wireframe 1) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
        {/* Left Column Text & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Your recovery, <br />
            <span className="text-rose-700">made easier to follow.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            Turn your hospital discharge instructions into a clear, verified and day-by-day recovery plan.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/onboarding"
              className="px-7 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition hover:-translate-y-0.5"
            >
              Start My Recovery
            </Link>

            <button
              onClick={handleStartDemo}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm rounded-xl shadow-subtle transition"
            >
              How It Works (Try Demo)
            </button>
          </div>
        </div>

        {/* Right Column Calming Visual Card */}
        <div className="lg:col-span-5 relative">
          <div className="bg-gradient-to-tr from-sky-50 via-slate-50 to-rose-50 rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col items-center text-center space-y-4 overflow-hidden relative">
            <div className="w-full h-52 rounded-2xl bg-gradient-to-br from-rose-800 to-medical-700 p-6 flex flex-col justify-between text-white shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur">
                  Verified Post-Surgery
                </span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-left space-y-1">
                <span className="text-xs text-sky-100 font-medium">Right Knee Replacement</span>
                <h3 className="text-lg font-bold">John Doe's Recovery Plan</h3>
                <span className="text-[11px] text-white/80 block">Day 4 of 14 • 3/5 Tasks Done</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-slate-600 px-2">
              <span className="font-semibold text-slate-900">Dr. Sharma • Orthopedic Surgery</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Plan Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process (Directly matching Wireframe 1 bottom cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col items-start space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-extrabold text-sm shadow-sm">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">1. Upload</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your discharge instructions from hospital or clinic.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col items-start space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-medical-700 flex items-center justify-center font-extrabold text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">2. Verify</h3>
            <p className="text-xs text-slate-500 mt-1">
              What was extracted against original highlighted document.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col items-start space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">3. Follow</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your day-by-day plan with scheduled doses & safety alerts.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Badges (Matching bottom row of Wireframe 1) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200/80">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">Secure & Private</span>
            <span className="text-slate-500">Your health data is protected & confidential.</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">No Medical Advice</span>
            <span className="text-slate-500">We only organize your clinician's instructions.</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <PhoneCall className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">Always Here</span>
            <span className="text-slate-500">Emergency & doctor contact access 24/7.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
