import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
  Pill
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlanStore } from '@/stores/usePlanStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading, error } = useAuthStore();
  const { loadDemoPatient } = usePlanStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      let success = false;
      if (isRegisterMode) {
        if (!firstName) {
          setLocalError('Please enter your first name');
          return;
        }
        success = await register({
          email,
          firstName,
          lastName,
          role: 'PATIENT',
          password,
        });
      } else {
        success = await login(email, password);
      }

      if (success) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleInstantDemo = () => {
    loadDemoPatient();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[88vh] bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Main Card: Login & Register Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-elevated">
          {/* Header */}
          <div className="text-center sm:text-left mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
              <span>Secure Clinical Access</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRegisterMode ? 'Create your Recovery Compass account' : 'Sign in to Recovery Compass'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {isRegisterMode
                ? 'Empowering patients with clear, verified post-discharge guidance'
                : 'Access your daily recovery timeline, medications, and safety checks'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                !isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Maria"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Gonzalez"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-medium text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-medium text-slate-900"
                  required
                />
              </div>
            </div>

            {(localError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{localError || error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{isRegisterMode ? 'Create Account & Continue' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>HIPAA & DPDP Protected</span>
            </span>
            <Link to="/settings" className="hover:underline text-rose-700 font-semibold">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Right Card: Instant Demo & Feature Highlights */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-elevated">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                1-Click Interactive Demo
              </span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Try Patient Recovery Experience</h2>
            <p className="text-xs text-slate-400 mb-4">
              Instantly explore the full interactive dashboard with sample recovery tasks, medication schedule, and follow-ups.
            </p>

            <button
              onClick={handleInstantDemo}
              className="w-full p-4 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-left transition flex items-center justify-between group shadow-sm"
            >
              <div>
                <span className="block text-xs font-extrabold text-white">Load Maria Gonzalez Plan</span>
                <span className="block text-[11px] text-rose-200 mt-0.5">Day 1 • 14-Day Laparoscopic Pathway</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Highlights Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Included In Your Recovery Plan
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Day-by-Day Guidance:</strong> Clear daily milestones starting at Day 1.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Pill className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Medication Reminders:</strong> Precise dosing schedules with safety warnings.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Follow-up & Q&A:</strong> Doctor questions prep and clinical appointment tracking.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
