import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Heart,
  Droplets,
  Wind,
  Check,
  X,
  PhoneCall,
  ChevronRight,
  FileText,
  Upload,
  Volume2,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';
import { useSafetyStore } from '@/stores/useSafetyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/services/i18n';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, toggleTaskStatus, recordMedicationAction, isSyncing } = usePlanStore();
  const triggerManualEmergency = useSafetyStore((s) => s.triggerManualEmergency);
  const { user } = useAuthStore();
  const { t, speak } = useTranslation();

  const hasPlan = !!plan.id;
  const currentDay = plan.currentDay || 1;
  const todayTasks = plan.tasks;
  const completedTasksCount = todayTasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = todayTasks.length || 0;

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'there';

  // Get the next upcoming follow-up
  const nextFollowUp = plan.followUps && plan.followUps.length > 0
    ? plan.followUps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;

  const formatFollowUpDate = (fu: typeof nextFollowUp) => {
    if (!fu) return null;
    try {
      const d = new Date(`${fu.date}T${fu.time || '00:00'}`);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + (fu.time ? ` • ${fu.time}` : '');
    } catch {
      return `${fu.date}${fu.time ? ` • ${fu.time}` : ''}`;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <span>Good Morning, {displayName}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasPlan ? `Day ${currentDay} • Active Recovery Timeline` : 'Welcome to Recovery Compass'}
          </p>
        </div>
      </div>

      {/* Empty state — no plan loaded yet */}
      {!hasPlan && !isSyncing && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">No Recovery Plan Yet</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your discharge summary to generate your personalised recovery plan with medications, tasks, and follow-up schedules.
            </p>
          </div>
          <Link
            to="/documents/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-2xl transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Discharge Summary
          </Link>
        </div>
      )}

      {isSyncing && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-600">Loading your recovery plan…</span>
        </div>
      )}

      {hasPlan && (
        <>
          {/* 2-Card Row: Progress Gauge & Next Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Progress Gauge Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#e2e8f0"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#0284c7"
                    strokeWidth="7"
                    strokeDasharray={201}
                    strokeDashoffset={totalTasksCount > 0 ? 201 - (201 * completedTasksCount) / totalTasksCount : 201}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base font-extrabold text-slate-900 block leading-none">
                    {completedTasksCount}/{totalTasksCount}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-900 block">{t('todaysProgress')}</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {completedTasksCount} of {totalTasksCount} daily recovery tasks completed.
                </p>
              </div>
            </div>

            {/* Next Follow-up Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center justify-between gap-4">
              {nextFollowUp ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    Next Follow-up
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{formatFollowUpDate(nextFollowUp)}</h3>
                  <span className="text-xs text-slate-500 block">
                    {nextFollowUp.clinician} • {nextFollowUp.specialty}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Follow-ups
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">No upcoming appointments</h3>
                  <span className="text-xs text-slate-500 block">Check your plan for scheduled visits</span>
                </div>
              )}

              <Link
                to="/follow-ups"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Today's Tasks List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900">{t('todaysTasks')}</h2>
              <span className="text-xs text-slate-500 font-semibold">
                Day {currentDay} of {plan.totalDays || '—'}
              </span>
            </div>

            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No tasks scheduled for today.</p>
              ) : (
                todayTasks.map((task) => {
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <span
                            className={`text-xs sm:text-sm font-semibold block ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[11px] text-slate-500">{task.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(task.title);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-[11px] font-medium"
                          title={t('tapToListen')}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">{t('tapToListen')}</span>
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted ? t('completed') : t('pending')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Red Emergency / Urgent Help Banner */}
      <div
        onClick={triggerManualEmergency}
        className="bg-urgentRed-50 border border-urgentRed-100 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-urgentRed-100/80 transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-urgentRed-600 text-white rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-urgentRed-900 block">
              Emergency / Urgent Help
            </span>
            <span className="text-[11px] text-urgentRed-700">
              Get immediate assistance if you notice any serious or unexpected symptoms.
            </span>
          </div>
        </div>

        <a
          href="tel:108"
          onClick={(e) => {
            e.stopPropagation();
            triggerManualEmergency();
          }}
          className="px-4 py-2 bg-urgentRed-600 hover:bg-urgentRed-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-sm inline-flex items-center justify-center"
        >
          Call 108 Ambulance
        </a>
      </div>
    </div>
  );
};
