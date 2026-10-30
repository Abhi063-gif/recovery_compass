import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FlaskConical,
  FileText,
  Download,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { followupsApi } from '@/api/followups';

export const FollowUpsPage: React.FC = () => {
  const plan = usePlanStore((s) => s.plan);
  const [downloadedIndex, setDownloadedIndex] = useState<number | null>(null);
  const [remoteFollowups, setRemoteFollowups] = useState<any[]>([]);

  useEffect(() => {
    if (plan.id) {
      followupsApi
        .getByPlan(plan.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setRemoteFollowups(data);
          }
        })
        .catch(() => {
          // offline fallback
        });
    }
  }, [plan.id]);

  const appointments =
    remoteFollowups.length > 0
      ? remoteFollowups.map((f) => ({
          id: f.id,
          date: f.scheduledDate
            ? new Date(f.scheduledDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Scheduled Review',
          time: f.scheduledDate
            ? new Date(f.scheduledDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '10:30 AM',
          title: f.clinicianName || f.appointmentType || 'Surgical Clinic Outpatient Review',
          purpose: f.purpose || f.originalInstruction || 'Wound healing check and post-op recovery review',
          preparation: 'Bring your discharge summary and medication history.',
          tests: f.pendingTests?.map((t: any) => t.testName) || [],
          location: 'Hospital Surgical Clinic',
          sourceReference: f.sourceText || 'Discharge Summary Section 5: Follow-up Appointment',
        }))
      : plan.followUps && plan.followUps.length > 0
      ? plan.followUps.map((f) => ({
          id: f.id,
          date: f.date,
          time: f.time,
          title: f.clinician,
          purpose: f.purpose,
          preparation: f.preparation,
          tests: f.tests || [],
          location: f.location,
          sourceReference: f.sourceReference,
        }))
      : [
          {
            id: 'app-1',
            date: '26 Apr 2026',
            time: '10:30 AM',
            title: 'Dr. Marcus Vance, FRCS (Consultant Surgeon)',
            purpose: 'Post-surgery review & incision check',
            preparation: 'Bring your discharge summary and current medication list.',
            tests: [],
            location: 'Surgical Pavilion, Suite 410',
            sourceReference: 'Discharge Summary Page 1: Surgical Clinic Review in 3 weeks',
          },
        ];

  const handleDownloadCalendar = async (app: (typeof appointments)[0], index: number) => {
    try {
      followupsApi.downloadCalendarIcs(app.id);
      setDownloadedIndex(index);
      setTimeout(() => setDownloadedIndex(null), 3000);
    } catch {
      // Fallback RFC-5545 generator
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Recovery Compass//Follow-up//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${app.title}`,
        `DESCRIPTION:${app.purpose} | Location: ${app.location}`,
        `LOCATION:${app.location}`,
        'DTSTART:20260426T103000Z',
        'DTEND:20260426T113000Z',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `FollowUp_${app.date.replace(/ /g, '_')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadedIndex(index);
      setTimeout(() => setDownloadedIndex(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Follow-up Appointments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Upcoming consultations and lab tests scheduled in your discharge paperwork.
        </p>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((app, idx) => (
          <div
            key={app.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">{app.title}</h2>
                  <span className="text-xs font-semibold text-purple-700">
                    {app.date} • {app.time}
                  </span>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {app.location}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 min-w-[90px]">Purpose:</span>
                <span className="text-slate-600">{app.purpose}</span>
              </div>

              {app.preparation && (
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-700 min-w-[90px]">Preparation:</span>
                  <span className="text-slate-600">{app.preparation}</span>
                </div>
              )}

              {app.tests && app.tests.length > 0 && (
                <div className="flex items-start gap-2 pt-1">
                  <span className="font-bold text-slate-700 min-w-[90px]">Pending Tests:</span>
                  <span className="text-slate-600 font-semibold">{app.tests.join(', ')}</span>
                </div>
              )}

              {app.sourceReference && (
                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 italic">
                  <span className="font-semibold text-slate-500 not-italic min-w-[90px]">Source:</span>
                  <span>{app.sourceReference}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDownloadCalendar(app, idx)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadedIndex === idx ? 'Downloaded (.ics) ✓' : 'Add to Calendar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
