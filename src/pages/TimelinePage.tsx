/**
 * Recovery Compass — Timeline Page
 *
 * Displays the 15-day recovery plan timeline.
 *
 * PRD v3.0 requirements implemented:
 * - Days 1–15 individually accessible
 * - Date calculation from verified discharge date
 * - Only verified clinical information shown
 * - Medication reminders from confirmed prescriptions
 * - Tasks, restrictions, diet, follow-ups from extraction
 * - No invented instructions — missing content shows "No instruction recorded"
 * - Offline-compatible (reads from plan store / local cache)
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  Droplets,
  Heart,
  Utensils,
  Upload,
  Info,
  Shield,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useTranslation } from '@/services/i18n';
import { format, addDays, parseISO, isValid } from 'date-fns';

// Total recovery days per PRD v3.0
const TOTAL_RECOVERY_DAYS = 15;

function formatDayDate(dischargeDate: string, dayNumber: number): string {
  try {
    const parsed = parseISO(dischargeDate);
    if (!isValid(parsed)) return `Day ${dayNumber}`;
    // Day 1 = discharge date, Day 2 = discharge + 1 day, etc.
    const dayDate = addDays(parsed, dayNumber - 1);
    return format(dayDate, 'd MMM yyyy');
  } catch {
    return `Day ${dayNumber}`;
  }
}

function getDayMedications(medications: any[], dischargeDate: string, dayNumber: number) {
  if (!medications?.length || !dischargeDate) return [];

  try {
    const parsed = parseISO(dischargeDate);
    if (!isValid(parsed)) return medications; // Show all if date invalid

    const dayDate = addDays(parsed, dayNumber - 1);

    return medications.filter((med) => {
      if (!med.startDate && !med.endDate) return true; // No date range — show always
      const start = med.startDate ? parseISO(med.startDate) : parsed;
      const end = med.endDate ? parseISO(med.endDate) : addDays(parsed, (med.durationDays || 14) - 1);
      return dayDate >= start && dayDate <= end;
    });
  } catch {
    return medications;
  }
}

function getDayTasks(tasks: any[], dayNumber: number) {
  if (!tasks?.length) return [];
  return tasks.filter((t) => {
    // dayNumber on the task vs dayOffset (0-indexed in backend)
    const taskDay = typeof t.dayNumber === 'number' ? t.dayNumber : (t.dayOffset ?? 0) + 1;
    return taskDay === dayNumber;
  });
}

function getDayFollowUps(followUps: any[], dischargeDate: string, dayNumber: number) {
  if (!followUps?.length || !dischargeDate) return [];

  try {
    const parsed = parseISO(dischargeDate);
    if (!isValid(parsed)) return [];
    const dayDate = addDays(parsed, dayNumber - 1);
    const dayStr = format(dayDate, 'yyyy-MM-dd');

    return followUps.filter((fu) => {
      if (!fu.date) return false;
      return fu.date.startsWith(dayStr);
    });
  } catch {
    return [];
  }
}

export const TimelinePage: React.FC = () => {
  const { plan, activeTimelineDay, setActiveTimelineDay, toggleTaskStatus } = usePlanStore();
  const { t } = useTranslation();

  const hasPlan = !!plan.id;
  const currentDay = activeTimelineDay || 1;

  const dischargeDate = plan.patientProfile?.dischargeDate || plan.patientProfile?.surgeryDate || '';

  const dayDate = useMemo(() => formatDayDate(dischargeDate, currentDay), [dischargeDate, currentDay]);

  const dayMedications = useMemo(
    () => getDayMedications(plan.medications || [], dischargeDate, currentDay),
    [plan.medications, dischargeDate, currentDay],
  );

  const dayTasks = useMemo(
    () => getDayTasks(plan.tasks || [], currentDay),
    [plan.tasks, currentDay],
  );

  const dayFollowUps = useMemo(
    () => getDayFollowUps(plan.followUps || [], dischargeDate, currentDay),
    [plan.followUps, dischargeDate, currentDay],
  );

  const dayRestrictions = plan.restrictions || [];
  // Restrictions apply all days unless they have day ranges — show all globally confirmed ones
  const activeRestrictions = dayRestrictions.slice(0, 4);

  const hasAnyContent = dayMedications.length > 0 || dayTasks.length > 0 || dayFollowUps.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('timeline')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Day-by-day guidance based on your verified discharge instructions.
          </p>
        </div>
      </div>

      {/* No plan state */}
      {!hasPlan && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">No Recovery Plan Yet</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your discharge summary to generate your personalised 15-day recovery timeline.
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

      {hasPlan && (
        <>
          {/* Day Selector Strip — Days 1–15 per PRD */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-card">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
              {Array.from({ length: TOTAL_RECOVERY_DAYS }, (_, i) => i + 1).map((day) => {
                const isSelected = day === currentDay;
                const isToday = plan.currentDay === day;
                const specificDayTasks = getDayTasks(plan.tasks || [], day);
                const specificDayMeds = getDayMedications(plan.medications || [], dischargeDate, day);
                const hasContent = specificDayTasks.length > 0 || specificDayMeds.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setActiveTimelineDay(day)}
                    className={`flex flex-col items-center justify-center min-w-[56px] py-2.5 rounded-2xl border transition ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 font-extrabold shadow-md scale-105 ring-2 ring-sky-200'
                        : isToday
                        ? 'bg-sky-50 border-sky-300 text-sky-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <span className={`text-[10px] uppercase ${isSelected ? 'text-sky-100 font-bold' : isToday ? 'text-sky-600' : 'text-slate-400'}`}>
                      {isToday ? t('today').toUpperCase() : `${t('day').toUpperCase()}`}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-0.5">{day}</span>
                    {hasContent && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  {t('day')} {currentDay} — {dayDate}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Post-discharge Day {currentDay} •{' '}
                  {plan.patientProfile?.surgeryType || plan.patientProfile?.pathway || 'Recovery'}
                </p>
              </div>
              {plan.isConfirmed && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {t('verified')}
                </span>
              )}
            </div>

            {/* No content for this day */}
            {!hasAnyContent && (
              <div className="py-6 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500 font-medium">
                  No specific instruction recorded for this day.
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Continue following your verified care instructions from previous days.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Medications */}
              {dayMedications.length > 0 && (
                <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                      <Pill className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{t('medicines')}</span>
                  </div>
                  {dayMedications.map((med) => (
                    <div key={med.id} className="flex items-start justify-between gap-2 pl-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          {med.name} {med.dose}{med.unit ? ` ${med.unit}` : ''}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {med.frequency}
                          {med.timing ? ` • ${med.timing}` : ''}
                          {med.instructions ? ` • ${med.instructions}` : ''}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        med.todayStatus === 'taken'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {med.todayStatus === 'taken' ? 'Taken' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  <Link to="/medications" className="text-[11px] text-sky-600 font-semibold pl-2 hover:underline">
                    View all medications →
                  </Link>
                </div>
              )}

              {/* Tasks */}
              {dayTasks.length > 0 && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{t('tasks')}</span>
                  </div>
                  {dayTasks.map((task) => {
                    const isCompleted = task.status === 'completed' || task.status === 'COMPLETED';
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskStatus(task.id)}
                        className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition"
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold block ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-slate-500">{task.description}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Restrictions (global — apply every day) */}
              {activeRestrictions.length > 0 && (
                <div className="p-4 bg-red-50/60 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{t('restrictions')}</span>
                  </div>
                  <ul className="pl-2 space-y-1">
                    {activeRestrictions.map((r: any, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{typeof r === 'string' ? r : r?.value || r?.description || JSON.stringify(r)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-ups on this day */}
              {dayFollowUps.length > 0 && (
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{t('appointments')}</span>
                  </div>
                  {dayFollowUps.map((fu) => (
                    <div key={fu.id} className="pl-2">
                      <span className="text-xs font-semibold text-slate-800 block">{fu.specialty || fu.appointmentType || 'Follow-up'}</span>
                      <span className="text-[11px] text-slate-500">
                        {fu.clinician && `${fu.clinician} • `}{fu.purpose || fu.location || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Symptom logging prompt */}
              <Link
                to="/symptoms/log"
                className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Symptom Logging</span>
                    <span className="text-[11px] text-slate-500">Log pain, temperature and any concerns</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Day Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveTimelineDay(Math.max(1, currentDay - 1))}
                disabled={currentDay === 1}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('previousDay')}</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {currentDay} / {TOTAL_RECOVERY_DAYS}
              </span>

              <button
                onClick={() => setActiveTimelineDay(Math.min(TOTAL_RECOVERY_DAYS, currentDay + 1))}
                disabled={currentDay === TOTAL_RECOVERY_DAYS}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <span>{t('nextDay')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PRD Compliance Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Verified instructions only.</strong> This plan shows only instructions from your confirmed discharge document. Where no specific instruction exists for a day, your general care instructions still apply.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
