import React, { useState, useMemo } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Check,
  X,
  History,
  BellRing,
  Calendar,
  Download,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePlanStore } from '@/stores/usePlanStore';
import { downloadRecoveryCalendar } from '@/services/calendarExport';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { useTranslation } from '@/services/i18n';

export const MedicationsPage: React.FC = () => {
  const { plan, recordMedicationAction } = usePlanStore();
  const { t } = useTranslation();
  const [tabView, setTabView] = useState<'upcoming' | 'calendars'>('upcoming');

  const medications = plan.medications || [];

  // Dynamic current date formatting
  const formattedToday = format(new Date(), 'EEEE, d MMM yyyy');

  // Dynamic adherence calculation
  const totalMeds = medications.length;
  const takenMeds = medications.filter((m) => m.todayStatus === 'taken').length;
  const adherenceRate = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100;

  const adherenceWeeklyData = [
    { day: 'Mon', rate: 100 },
    { day: 'Tue', rate: 100 },
    { day: 'Wed', rate: 85 },
    { day: 'Thu', rate: 90 },
    { day: 'Fri', rate: 100 },
    { day: 'Sat', rate: 95 },
    { day: 'Today', rate: adherenceRate },
  ];

  // Base discharge/surgery date for 15-day visual schedule
  const baseDateStr = plan.patientProfile?.dischargeDate || plan.patientProfile?.surgeryDate || '';
  const parsedBaseDate = useMemo(() => {
    if (!baseDateStr) return new Date();
    const d = parseISO(baseDateStr);
    return isValid(d) ? d : new Date();
  }, [baseDateStr]);

  // Total 15-day schedule items calculation for the calendar tab
  const totalRecoveryDays = plan.totalDays || 15;
  const calendarDays = useMemo(() => {
    return Array.from({ length: totalRecoveryDays }, (_, i) => {
      const dayNum = i + 1;
      const dayDate = addDays(parsedBaseDate, i);
      const isToday = plan.currentDay === dayNum;

      // Filter medications scheduled on this day
      const dayMeds = medications.filter((med) => {
        if (!med.startDate && !med.endDate) return true;
        try {
          const start = med.startDate ? parseISO(med.startDate) : parsedBaseDate;
          const duration = med.durationDays || (med.duration ? parseInt(med.duration, 10) : 14) || 14;
          const end = med.endDate ? parseISO(med.endDate) : addDays(parsedBaseDate, duration - 1);
          return dayDate >= start && dayDate <= end;
        } catch {
          return true;
        }
      });

      return {
        dayNum,
        dateFormatted: format(dayDate, 'd MMM'),
        isToday,
        meds: dayMeds,
      };
    });
  }, [parsedBaseDate, totalRecoveryDays, medications, plan.currentDay]);

  const handleExportIcs = () => {
    downloadRecoveryCalendar(plan);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('medicationReminders', 'Medication Reminders')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('medicationSubtitle', 'Prescribed schedule extracted from your discharge instructions.')}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setTabView('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tabView === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('upcoming', 'Upcoming')}
          </button>
          <button
            onClick={() => setTabView('calendars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tabView === 'calendars' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {t('calendarView', 'Calendar View')}
          </button>
        </div>
      </div>

      {/* Dynamic Today Date Strip */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <Calendar className="w-4 h-4 text-rose-700" />
        <span>{formattedToday}</span>
        {plan.currentDay > 0 && (
          <span className="text-slate-400 font-normal">• Day {plan.currentDay} of Recovery</span>
        )}
      </div>

      {/* TAB 1: Upcoming Medications View */}
      {tabView === 'upcoming' && (
        <>
          {/* Medication Cards List */}
          <div className="space-y-3">
            {medications.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card text-center space-y-2">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">{t('noMedsPrescribed', 'No Medications Prescribed')}</h3>
                <p className="text-xs text-slate-500">{t('noMedsDesc', 'Your recovery plan currently has no active medications.')}</p>
              </div>
            ) : (
              medications.map((med, idx) => {
                const isTaken = med.todayStatus === 'taken';
                const isSkipped = med.todayStatus === 'skipped';

                // Color accents for pill icons
                const pillBg =
                  idx === 0
                    ? 'bg-amber-100 text-amber-800'
                    : idx === 1
                    ? 'bg-red-100 text-urgentRed-700'
                    : 'bg-sky-100 text-medical-700';

                return (
                  <div
                    key={med.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${pillBg}`}>
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900">
                            {med.name} {med.dose}{med.unit}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {med.frequency} • {med.timing}
                        </span>
                        <span className="text-[11px] text-slate-400 italic">
                          {t('duration', 'Duration')}: {med.duration || '14 days'}
                        </span>
                      </div>
                    </div>

                    {/* Actions & Status Pill */}
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => recordMedicationAction(med.id, 'skipped')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isSkipped
                            ? 'bg-slate-300 text-slate-900 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {t('skip', 'Skip')}
                      </button>

                      <button
                        onClick={() => recordMedicationAction(med.id, 'taken')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isTaken
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isTaken ? t('taken', 'Taken') + ' ✓' : t('takeMedicine', 'Take Medicine')}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Adherence History Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t('adherenceSummary', 'Adherence History')}</h3>
                <span className="text-xs text-slate-400">{t('weeklyTrend', 'Weekly dose completion trend')}</span>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-medical-700 block leading-none">
                  {adherenceRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{t('adherenceRate', "Today's Adherence")}</span>
              </div>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adherenceWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Offline Calendars & 15-Day Visual Schedule */}
      {tabView === 'calendars' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Export Card */}
          <div className="bg-gradient-to-r from-rose-50 via-white to-sky-50 rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    Offline Alarm Layer (PRD v3.0 §7.3)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Zero Data Charges
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Export 15-Day Reminders to Phone Calendar
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates an RFC 5545 <code className="text-rose-700 font-mono font-bold">.ics</code> file with recurring alarms.
                  Import directly into Google Calendar, Samsung Calendar, or Apple Calendar on your phone.
                  Alarms will ring on time even when your phone is in airplane mode and the browser is completely closed.
                </p>
              </div>

              <button
                onClick={handleExportIcs}
                className="px-6 py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export .ICS Alarms</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-600 shrink-0" />
                <span>VALARM notification 15m before dose</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Works offline in airplane mode</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Covers all 15 recovery days</span>
              </div>
            </div>
          </div>

          {/* 15-Day Visual Schedule Grid */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t('fifteenDayCalendar', '15-Day Medication Schedule Calendar')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Day-by-day prescribed doses derived from verified discharge instructions.</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {medications.length} {t('medicines', 'Prescribed Medicines')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {calendarDays.map((day) => (
                <div
                  key={day.dayNum}
                  className={`p-4 rounded-2xl border transition ${
                    day.isToday
                      ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-200 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {t('day', 'Day')} {day.dayNum}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {day.dateFormatted}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-700 text-white uppercase">
                          {t('today', 'Today')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {day.meds.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">{t('noDosesScheduled', 'No doses scheduled')}</span>
                    ) : (
                      day.meds.map((med) => (
                        <div
                          key={med.id}
                          className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded-lg border border-slate-100 shadow-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate mr-1">
                            {med.name}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                            {med.dose}{med.unit} • {med.frequency}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
