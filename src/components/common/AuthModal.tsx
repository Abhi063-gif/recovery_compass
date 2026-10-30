import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { LogIn, UserPlus, Shield, X, Sparkles, AlertCircle, CheckCircle2, Lock, Mail, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const { login, register, isLoading, error, clearError, quickDemoLogin } = useAuthStore();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'CAREGIVER'>('PATIENT');
  const [relationship, setRelationship] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let ok = false;
    if (tab === 'login') {
      ok = await login(email, password);
    } else {
      ok = await register({
        email,
        password,
        firstName,
        lastName,
        role,
        relationship: role === 'CAREGIVER' ? relationship : undefined,
      });
    }

    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleQuickLogin = async (targetRole: 'PATIENT' | 'CAREGIVER' | 'ADMIN') => {
    clearError();
    const ok = await quickDemoLogin(targetRole);
    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tab === 'login' ? 'Sign In to Recovery Compass' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure healthcare session & encrypted recovery plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Switchers */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              1-Click Demo Profiles
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('PATIENT')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-slate-800 transition flex flex-col items-center gap-0.5"
            >
              <span className="text-rose-700 font-bold">Patient</span>
              <span className="text-[10px] text-slate-400">Jane Doe</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('CAREGIVER')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-slate-800 transition flex flex-col items-center gap-0.5"
            >
              <span className="text-rose-700 font-bold">Caregiver</span>
              <span className="text-[10px] text-slate-400">John Doe</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-slate-800 transition flex flex-col items-center gap-0.5"
            >
              <span className="text-rose-700 font-bold">Admin</span>
              <span className="text-[10px] text-slate-400">Director</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            onClick={() => { setTab('login'); clearError(); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              tab === 'login'
                ? 'border-rose-600 text-rose-700 bg-rose-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); clearError(); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              tab === 'register'
                ? 'border-rose-600 text-rose-700 bg-rose-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('PATIENT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      role === 'PATIENT'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('CAREGIVER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      role === 'CAREGIVER'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Caregiver
                  </button>
                </div>
              </div>

              {role === 'CAREGIVER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship to Patient</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Spouse / Parent / Adult Child"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
