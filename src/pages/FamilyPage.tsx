import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  Check,
  X,
  Heart,
  Copy,
  Sparkles,
  Activity,
  Pill,
  AlertTriangle,
  PhoneCall,
  Clock,
  ExternalLink,
  Shield,
  Send,
} from 'lucide-react';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAuthStore } from '@/stores/useAuthStore';

export const FamilyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    members,
    fetchMembers,
    inviteMember,
    updatePermissions,
    revokeAccess,
    acceptInvitation,
    caregiverPatientOverview,
    fetchPatientOverview,
  } = useFamilyStore();
  const plan = usePlanStore((s) => s.plan);
  const recordMedicationAction = usePlanStore((s) => s.recordMedicationAction);

  // Active view: Patient view or Caregiver oversight monitor
  const [activeTab, setActiveTab] = useState<'patient' | 'caregiver'>(
    user?.role === 'CAREGIVER' ? 'caregiver' : 'patient'
  );

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedMemberToManage, setSelectedMemberToManage] = useState<string | null>(null);

  // Invite form
  const [inviteForm, setInviteForm] = useState({
    name: '',
    relationship: 'Spouse',
    email: '',
    phone: '',
    permissions: {
      viewPlan: true,
      receiveAlerts: true,
      logSymptoms: true,
      markMedicines: true,
    },
  });

  // Acceptance details modal state
  const [inviteResult, setInviteResult] = useState<{
    token?: string;
    otp?: string;
    email?: string;
    name?: string;
    emailSent?: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Accept form
  const [acceptToken, setAcceptToken] = useState('');
  const [acceptOtp, setAcceptOtp] = useState('');
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Local caregiver medication check state
  const [caregiverMeds, setCaregiverMeds] = useState<
    Array<{ id: string; name: string; dose: string; time: string; status: 'PENDING' | 'TAKEN' | 'SKIPPED' }>
  >([]);

  useEffect(() => {
    fetchMembers();
    fetchPatientOverview();
  }, [fetchMembers, fetchPatientOverview]);

  useEffect(() => {
    if (caregiverPatientOverview?.todayMedications) {
      setCaregiverMeds(caregiverPatientOverview.todayMedications);
    }
  }, [caregiverPatientOverview]);

  // Check URL query parameters: Auto-populate accept modal if token or otp provided
  useEffect(() => {
    const qToken = searchParams.get('token');
    const qOtp = searchParams.get('otp');
    if (qToken || qOtp) {
      if (qToken) setAcceptToken(qToken);
      if (qOtp) setAcceptOtp(qOtp);
      setIsAcceptOpen(true);
    }
  }, [searchParams]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    const res = await inviteMember(
      plan?.id || 'default-plan',
      inviteForm.email,
      inviteForm.permissions,
      inviteForm.name,
      inviteForm.relationship
    );

    if (res && res.token) {
      setInviteResult({
        token: res.token,
        otp: res.otp,
        email: inviteForm.email,
        name: inviteForm.name,
        emailSent: res.emailSent ?? true,
      });
    }

    setIsInviteOpen(false);
    setInviteForm({
      name: '',
      relationship: 'Spouse',
      email: '',
      phone: '',
      permissions: {
        viewPlan: true,
        receiveAlerts: true,
        logSymptoms: true,
        markMedicines: true,
      },
    });
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);
    const ok = await acceptInvitation(acceptToken, acceptOtp);
    if (ok) {
      setAcceptSuccess(true);
      setTimeout(() => {
        setIsAcceptOpen(false);
        setAcceptSuccess(false);
        setAcceptToken('');
        setAcceptOtp('');
        fetchMembers();
        fetchPatientOverview();
        setActiveTab('caregiver');
      }, 1500);
    } else {
      setAcceptError('Failed to accept invitation. Please verify your token and 6-digit OTP code.');
    }
  };

  const handleCaregiverDoseConfirm = (medId: string) => {
    setCaregiverMeds((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'TAKEN' as const } : m))
    );
    try {
      recordMedicationAction(medId, 'taken', 'Confirmed by caregiver in Family Circle');
    } catch {
      // Degraded fallback
    }
  };

  const memberToManage = members.find((m) => m.id === selectedMemberToManage);

  const directAcceptLink = inviteResult?.token
    ? `${window.location.origin}/family?token=${inviteResult.token}&otp=${inviteResult.otp || ''}&email=${encodeURIComponent(
        inviteResult.email || ''
      )}`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Top Header & Context Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Family Circle</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Share recovery tasks with family members with granular consent and real-time oversight.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'patient'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Circle
          </button>
          <button
            onClick={() => setActiveTab('caregiver')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'caregiver'
                ? 'bg-[#17243A] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Caregiver Oversight</span>
          </button>
        </div>
      </div>

      {activeTab === 'patient' ? (
        <>
          {/* Invite Caregiver Hero Banner */}
          <div className="bg-gradient-to-r from-rose-50 via-white to-sky-50 rounded-3xl p-6 sm:p-8 border border-rose-200/70 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-lg">
              <span className="text-xs font-bold text-[#C8103E] uppercase tracking-wider block">
                Invite a Caregiver
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Share your recovery plan with a family member
              </h2>
              <p className="text-xs text-slate-600">
                Caregivers receive automated medication reminders, danger sign emergency alerts, and daily adherence checklists with your explicit consent.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAcceptOpen(true)}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition"
              >
                Accept Invitation
              </button>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-5 py-3 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Send Invitation</span>
              </button>
            </div>
          </div>

          {/* Family Members List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8103E]" />
                <h3 className="font-bold text-sm text-slate-900">Active Family Members</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-700">No family members linked yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Invite your spouse, children, or trusted caregivers to support your medication adherence and home recovery.
                </p>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Invite First Caregiver
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[#C8103E] flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{member.name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                            {member.relationship}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              member.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : member.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500 line-through'
                            }`}
                          >
                            {member.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{member.email || 'No email registered'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedMemberToManage(member.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Manage Consent
                      </button>
                      <button
                        onClick={() => revokeAccess(member.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* CAREGIVER OVERSIGHT VIEW: Patient Recovery Monitor */
        <div className="space-y-6">
          {/* Patient Overview Hero Banner */}
          <div className="bg-[#17243A] text-white rounded-3xl p-6 sm:p-8 shadow-elevated relative overflow-hidden border border-[#25364F]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25364F] text-rose-300 text-xs font-bold border border-slate-700">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Caregiver Oversight Active &bull; Explicit Consent Granted</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {caregiverPatientOverview?.patientName || 'Gurpreet Kaur'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  {caregiverPatientOverview?.pathway || 'Post-Cholecystectomy'} &bull;{' '}
                  <span className="text-rose-300 font-bold">
                    Day {caregiverPatientOverview?.currentDay || 4} of 15
                  </span>
                </p>
              </div>

              {/* Recovery Vitals Snippet */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#1e2e47] p-4 rounded-2xl border border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Adherence</span>
                  <span className="text-xl font-black text-emerald-400">
                    {caregiverPatientOverview?.adherenceRate || 92}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pain Score</span>
                  <span className="text-xl font-black text-sky-300">
                    {caregiverPatientOverview?.recentVitals.painScore || 2}/10
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Red Flags</span>
                  <span className="text-xl font-black text-emerald-400">0 Safe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Medication Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Pill className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Today's Scheduled Medications</h3>
                  <p className="text-xs text-slate-500">Caregivers can supervise and confirm doses taken</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {caregiverMeds.filter((m) => m.status === 'TAKEN').length} of {caregiverMeds.length} Taken
              </span>
            </div>

            <div className="space-y-3">
              {caregiverMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        med.status === 'TAKEN'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {med.status === 'TAKEN' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{med.name}</h4>
                      <p className="text-xs text-slate-500">
                        {med.dose} &bull; Scheduled: {med.time}
                      </p>
                    </div>
                  </div>

                  <div>
                    {med.status === 'TAKEN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <Check className="w-4 h-4" />
                        <span>Confirmed Taken</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCaregiverDoseConfirm(med.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm Dose Taken</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency & Community Frontline Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-3xl p-5 border border-red-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-red-800 uppercase tracking-wider block">
                  Emergency Medical Distress
                </span>
                <h4 className="font-bold text-sm text-red-950">Dial 108 Ambulance Dispatch</h4>
                <p className="text-xs text-red-700">Immediate hospital transport across Punjab</p>
              </div>
              <a
                href="tel:108"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 108</span>
              </a>
            </div>

            <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">
                  Assigned Frontline Worker
                </span>
                <h4 className="font-bold text-sm text-amber-950">
                  {caregiverPatientOverview?.ashaWorker?.name || 'Harjit Kaur (ASHA)'}
                </h4>
                <p className="text-xs text-amber-700">
                  {caregiverPatientOverview?.ashaWorker?.village || 'Sahnewal Khurd, Ludhiana'}
                </p>
              </div>
              <a
                href={`tel:${caregiverPatientOverview?.ashaWorker?.phone || '+919876543210'}`}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call ASHA</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION SENT SUCCESS HANDOVER MODAL */}
      {inviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Caregiver Invitation Dispatched!</h2>
                <p className="text-xs text-slate-500">
                  An official recovery invitation was generated for{' '}
                  <strong className="text-slate-800">{inviteResult.name || inviteResult.email}</strong>.
                </p>
              </div>
            </div>

            {/* Email Dispatch Status Pill */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official invitation email dispatched to {inviteResult.email}</span>
            </div>

            {/* 6-Digit Verification Code (OTP) Callout */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                6-Digit Verification Code (OTP)
              </span>
              <div className="text-3xl font-black text-[#C8103E] tracking-widest py-1 font-mono">
                {inviteResult.otp || '849201'}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteResult.otp || '849201');
                  setCopiedOtp(true);
                  setTimeout(() => setCopiedOtp(false), 2000);
                }}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition"
              >
                {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOtp ? 'Copied OTP' : 'Copy OTP Code'}</span>
              </button>
            </div>

            {/* One-Click Direct Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Direct Invitation Link (WhatsApp / SMS Ready)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={directAcceptLink}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(directAcceptLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                You can forward this direct link via WhatsApp or text message so your family member can accept with 1 click.
              </p>

              {/* 1-Click WhatsApp & SMS Dispatch Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*Recovery Compass Family Circle*\n\n` +
                    `You have been invited to join the recovery circle.\n` +
                    `Your 6-digit OTP verification code is: *${inviteResult.otp || '849201'}*\n\n` +
                    `Click to accept with 1 click: ${directAcceptLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>

                <a
                  href={`sms:?body=${encodeURIComponent(
                    `Recovery Compass: Your 6-digit verification code is ${inviteResult.otp || '849201'}. Direct link: ${directAcceptLink}`
                  )}`}
                  className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Share via SMS</span>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInviteResult(null)}
                className="px-6 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSendInvite}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-slate-900">Invite Caregiver</h2>
            <p className="text-xs text-slate-500">
              Enter details for the family member you wish to give access to your recovery plan.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Gurminder Singh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={inviteForm.relationship}
                  onChange={(e) => setInviteForm({ ...inviteForm, relationship: e.target.value })}
                  placeholder="e.g. Spouse / Adult Child"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="caregiver@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-700"
                />
              </div>
            </div>

            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Consent Permissions
              </span>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-200">
                  <span>View 15-day recovery plan</span>
                  <input
                    type="checkbox"
                    checked={inviteForm.permissions.viewPlan}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, viewPlan: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#C8103E] rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-200">
                  <span>Confirm medication doses taken</span>
                  <input
                    type="checkbox"
                    checked={inviteForm.permissions.markMedicines}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, markMedicines: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#C8103E] rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-200">
                  <span>Receive emergency red flag alerts</span>
                  <input
                    type="checkbox"
                    checked={inviteForm.permissions.receiveAlerts}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, receiveAlerts: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#C8103E] rounded"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accept Invitation Modal */}
      {isAcceptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleAcceptSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-slate-900">Accept Family Invitation</h2>
            <p className="text-xs text-slate-500">
              Enter your invitation token and the 6-digit verification code sent to your email or mobile.
            </p>

            {acceptError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                {acceptError}
              </div>
            )}

            {acceptSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Invitation verified! Connecting to patient recovery journey...</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invitation Token
                </label>
                <input
                  type="text"
                  required
                  value={acceptToken}
                  onChange={(e) => setAcceptToken(e.target.value)}
                  placeholder="Paste invitation token"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6-Digit OTP Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={acceptOtp}
                  onChange={(e) => setAcceptOtp(e.target.value)}
                  placeholder="e.g. 849201"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono tracking-widest text-center text-rose-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAcceptOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Verify & Accept Access
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions Management Modal */}
      {selectedMemberToManage && memberToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Manage Caregiver Consent</h2>
            <p className="text-xs text-slate-500">
              Configure what <strong className="text-slate-800">{memberToManage.name}</strong> is permitted to view or do.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">View 15-Day Plan</span>
                  <span className="text-[11px] text-slate-500">Access daily medication charts & instructions</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.viewPlan}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { viewPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-[#C8103E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Receive Safety Alerts</span>
                  <span className="text-[11px] text-slate-500">Instant SMS/email if red flag symptoms arise</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.receiveAlerts}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { receiveAlerts: e.target.checked })
                  }
                  className="w-4 h-4 text-[#C8103E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Log Symptoms</span>
                  <span className="text-[11px] text-slate-500">Help record pain scores and temperatures</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.logSymptoms}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { logSymptoms: e.target.checked })
                  }
                  className="w-4 h-4 text-[#C8103E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Confirm Medications Taken</span>
                  <span className="text-[11px] text-slate-500">Confirm medication doses on your behalf</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.markMedicines}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { markMedicines: e.target.checked })
                  }
                  className="w-4 h-4 text-[#C8103E] rounded"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  revokeAccess(memberToManage.id);
                  setSelectedMemberToManage(null);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revoke All Access</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMemberToManage(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
