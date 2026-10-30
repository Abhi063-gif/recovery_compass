import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { usePlanStore } from '@/stores/usePlanStore';

export const FamilyPage: React.FC = () => {
  const { members, fetchMembers, inviteMember, updatePermissions, revokeAccess, acceptInvitation } =
    useFamilyStore();
  const plan = usePlanStore((s) => s.plan);

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
      markMedicines: false,
    },
  });

  // Acceptance details modal state
  const [inviteResult, setInviteResult] = useState<{ token?: string; otp?: string; email?: string } | null>(
    null,
  );

  // Accept form
  const [acceptToken, setAcceptToken] = useState('');
  const [acceptOtp, setAcceptOtp] = useState('');
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    const res = await inviteMember(
      plan.id,
      inviteForm.email,
      inviteForm.permissions,
      inviteForm.name,
      inviteForm.relationship,
    );

    if (res && res.token) {
      setInviteResult({
        token: res.token,
        otp: res.otp,
        email: inviteForm.email,
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
        markMedicines: false,
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
      }, 2000);
    } else {
      setAcceptError('Failed to accept invitation. Please check the code.');
    }
  };

  const memberToManage = members.find((m) => m.id === selectedMemberToManage);

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Family Circle</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Share recovery tasks with family members with granular consent and privacy controls.
        </p>
      </div>

      {/* Invite Caregiver Hero Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-sky-50 rounded-3xl p-6 sm:p-8 border border-rose-200/70 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-lg">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
            Invite a Caregiver
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Share your recovery plan with a family member
          </h2>
          <p className="text-xs text-slate-600">
            Caregivers can view reminders and receive emergency safety notifications with your explicit consent.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAcceptOpen(true)}
            className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition"
          >
            Accept Invitation
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Send Invitation
          </button>
        </div>
      </div>

      {/* Invitation Token & OTP Display Alert (For testing & verification) */}
      {inviteResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Invitation Sent to {inviteResult.email}!
            </span>
            <button
              onClick={() => setInviteResult(null)}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-700">
            For hackathon testing, you can use these synthetic verification details to accept:
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-800">
            <span>Token: <strong>{inviteResult.token}</strong></span>
            <span>OTP Code: <strong>{inviteResult.otp}</strong></span>
          </div>
        </div>
      )}

      {/* Family Members Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">Family Members</h3>
          <span className="text-xs text-slate-400 font-medium">{members.length} members</span>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-rose-800 shadow-subtle">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{member.name}</span>
                    <span className="text-xs text-slate-500">({member.relationship})</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {member.permissions.viewPlan && 'View Plan • '}
                    {member.permissions.receiveAlerts && 'Alerts • '}
                    {member.permissions.logSymptoms && 'Log Symptoms • '}
                    {member.permissions.markMedicines && 'Mark Meds'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    member.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : member.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {member.status === 'active' ? 'Active' : member.status === 'pending' ? 'Pending' : 'Revoked'}
                </span>

                <button
                  onClick={() => setSelectedMemberToManage(member.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition"
                >
                  Manage Permissions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Permissions Modal */}
      {selectedMemberToManage && memberToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Manage Permissions</h3>
                <p className="text-xs text-slate-500">{memberToManage.name} ({memberToManage.email})</p>
              </div>
              <button
                onClick={() => setSelectedMemberToManage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">View Recovery Plan</span>
                  <span className="text-[11px] text-slate-500">Access timeline, instructions, and appointments</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.viewPlan}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { viewPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-rose-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Receive Red-Flag Alerts</span>
                  <span className="text-[11px] text-slate-500">SMS / Email alerts for high fevers or emergency signs</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.receiveAlerts}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { receiveAlerts: e.target.checked })
                  }
                  className="w-4 h-4 text-rose-600 rounded"
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
                  className="w-4 h-4 text-rose-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Mark Medications Taken</span>
                  <span className="text-[11px] text-slate-500">Confirm medication doses on your behalf</span>
                </div>
                <input
                  type="checkbox"
                  checked={memberToManage.permissions.markMedicines}
                  onChange={(e) =>
                    updatePermissions(memberToManage.id, { markMedicines: e.target.checked })
                  }
                  className="w-4 h-4 text-rose-600 rounded"
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

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
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
                  placeholder="caregiver@recoverycompass.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accept Invitation Modal */}
      {isAcceptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAcceptSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-slate-900">Accept Family Invitation</h2>
            <p className="text-xs text-slate-500">
              Enter your invitation token and the 4-digit verification code.
            </p>

            {acceptError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                {acceptError}
              </div>
            )}

            {acceptSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                Invitation accepted successfully! Caregiver access granted.
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
                  OTP Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={acceptOtp}
                  onChange={(e) => setAcceptOtp(e.target.value)}
                  placeholder="e.g. 8492"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAcceptOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Verify & Accept Access
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
