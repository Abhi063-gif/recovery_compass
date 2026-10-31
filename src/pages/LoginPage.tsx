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
  Pill,
  Phone,
  KeyRound,
  Users,
  UserCheck,
} from 'lucide-react';
import { useAuthStore, DEMO_PERSONAS } from '@/stores/useAuthStore';
import { usePlanStore } from '@/stores/usePlanStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading, error, switchPersona } = useAuthStore();
  const { loadDemoPatient } = usePlanStore();

  const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Email / Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mobile / PIN states
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  // Registration profile states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'ASHA' | 'CAREGIVER' | 'ADMIN'>('PATIENT');

  const [localError, setLocalError] = useState<string | null>(null);

  const from =
    typeof (location.state as any)?.from === 'string'
      ? (location.state as any).from
      : (location.state as any)?.from?.pathname || '/dashboard';
  const redirectMessage = (location.state as any)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      let success = false;

      if (authMethod === 'PHONE') {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
          setLocalError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
          return;
        }
        if (!pin || pin.length < 4) {
          setLocalError('Please enter a 4-digit PIN');
          return;
        }

        if (isRegisterMode) {
          if (!firstName.trim()) {
            setLocalError('Please enter your first name');
            return;
          }
          success = await register({
            phone: cleanPhone,
            pin,
            firstName: firstName.trim(),
            lastName: lastName.trim() || 'User',
            role: selectedRole,
          });
        } else {
          success = await login({ phone: cleanPhone, pin });
        }
      } else {
        // Email & Password Auth
        if (!email || !email.includes('@')) {
          setLocalError('Please enter a valid email address');
          return;
        }
        if (!password || password.length < 6) {
          setLocalError('Password must be at least 6 characters long');
          return;
        }

        if (isRegisterMode) {
          if (!firstName.trim()) {
            setLocalError('Please enter your first name');
            return;
          }
          success = await register({
            email: email.trim().toLowerCase(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim() || 'User',
            role: selectedRole,
          });
        } else {
          success = await login(email.trim().toLowerCase(), password);
        }
      }

      if (success) {
        const user = useAuthStore.getState().user;
        if (user?.role === 'ASHA') {
          navigate('/asha', { replace: true });
        } else if (user?.role === 'ANM') {
          navigate('/anm', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleInstantDemo = (personaIndex = 0) => {
    const persona = DEMO_PERSONAS[personaIndex] || DEMO_PERSONAS[0];
    switchPersona(persona);
    loadDemoPatient();

    if (persona.role === 'ASHA') {
      navigate('/asha');
    } else if (persona.role === 'ANM') {
      navigate('/anm');
    } else {
      navigate('/dashboard');
    }
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
              <span>Rural Health Clinical Access</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRegisterMode ? 'Register New Account' : 'Sign in to Recovery Compass'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {authMethod === 'PHONE'
                ? 'Rural-accessible login with your 10-digit mobile number and 4-digit PIN'
                : 'Access your post-discharge timeline, medication charts, and safety alerts'}
            </p>
          </div>

          {/* Authentication Gate Notice */}
          {redirectMessage && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900 font-semibold shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {/* Method Switch: Mobile + PIN vs Email + Password */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PHONE');
                setLocalError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                authMethod === 'PHONE'
                  ? 'bg-white text-rose-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile & PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('EMAIL');
                setLocalError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                authMethod === 'EMAIL'
                  ? 'bg-white text-rose-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* Mode Switch Tabs: Sign In vs Create Account */}
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setLocalError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                !isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
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
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sharda"
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
                      placeholder="e.g. Patil"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role in Health System</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 font-semibold cursor-pointer"
                  >
                    <option value="PATIENT">Patient (Primary Recovery)</option>
                    <option value="ASHA">ASHA Worker (Community Health)</option>
                    <option value="CAREGIVER">Family Caregiver</option>
                    <option value="ADMIN">Clinical Staff / MO / ANM</option>
                  </select>
                </div>
              </div>
            )}

            {authMethod === 'PHONE' ? (
              <>
                {/* 10-digit Indian Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 digits)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-500 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 text-slate-900"
                      required
                    />
                  </div>
                </div>

                {/* 4-digit numeric PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      4-Digit Security PIN
                    </label>
                    <span className="text-[11px] text-slate-400">Numbers only (0-9)</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600 text-slate-900"
                      required
                    />
                  </div>
                </div>

                {/* Touch-Friendly PIN Keypad */}
                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Keypad:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (pin.length < 4) setPin((prev) => prev + num);
                        }}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-rose-100 rounded-xl font-bold text-xs sm:text-sm text-slate-800 transition"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {pin.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPin('')}
                      className="mt-2 text-[11px] text-rose-700 hover:underline font-semibold"
                    >
                      Clear PIN
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Email Address */}
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

                {/* Password */}
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
              </>
            )}

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
              <span>Ayushman Bharat Digital Mission (ABDM) Compatible</span>
            </span>
            <Link to="/settings" className="hover:underline text-rose-700 font-semibold">
              Privacy & Security
            </Link>
          </div>
        </div>

        {/* Right Card: Instant Demo Personas & Health Worker Quick Access */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-elevated">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Indian Health Personas (Demo)
              </span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Instant Role-Based Access</h2>
            <p className="text-xs text-slate-400 mb-4">
              Select a persona below to experience Recovery Compass from different roles:
            </p>

            <div className="space-y-2">
              {DEMO_PERSONAS.map((persona, idx) => (
                <button
                  key={persona.id}
                  onClick={() => handleInstantDemo(idx)}
                  className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-rose-700 text-white text-left transition flex items-center justify-between group shadow-sm"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">{persona.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-rose-200 group-hover:bg-rose-800">
                        {persona.badge}
                      </span>
                    </div>
                    <span className="block text-[11px] text-slate-400 group-hover:text-rose-100 mt-0.5 truncate">
                      {persona.description}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Highlights Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Designed For Rural Health Systems
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>No Email Required:</strong> Rural patients log in simply using phone number & 4-digit PIN.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>ASHA & ANM Caseloads:</strong> Community health workers track recovery adherence and escalate red flags.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Offline-First Durability:</strong> All logs and task actions persist locally on device even without network.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
