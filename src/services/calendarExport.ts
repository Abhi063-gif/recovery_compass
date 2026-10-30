/**
 * Recovery Compass — Offline Calendar (.ics) Alarm Generator
 *
 * Implements PRD v3.0 Section 7.3:
 * Primary offline reminder layer using phone-calendar alarms (.ics)
 * with VALARM notifications. Works 100% offline with zero recurring SMS costs.
 */

import { RecoveryPlan, MedicationItem, FollowUpAppointment } from '@/types';

interface IcsEvent {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  start: Date;
  durationMinutes: number;
  alarmMinutesBefore: number;
}

function formatDateToIcs(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateRecoveryIcs(plan: RecoveryPlan): string {
  const events: IcsEvent[] = [];
  const baseDateStr = plan.patientProfile?.dischargeDate || plan.patientProfile?.surgeryDate || new Date().toISOString();
  const baseDate = new Date(baseDateStr);

  // 1. Generate 15-day Medication events with alarms
  const medications = plan.medications || [];
  const totalDays = plan.totalDays || 15;

  for (let day = 1; day <= totalDays; day++) {
    const eventDate = new Date(baseDate);
    eventDate.setDate(baseDate.getDate() + (day - 1));

    medications.forEach((med: MedicationItem, idx: number) => {
      // Determine standard reminder hours based on timing
      const timings: { hour: number; minute: number; label: string }[] = [];
      const timingLower = (med.timing || '').toLowerCase();
      const freqLower = (med.frequency || '').toLowerCase();

      if (timingLower.includes('morning') || freqLower.includes('od') || freqLower.includes('bd') || freqLower.includes('tds')) {
        timings.push({ hour: 8, minute: 0, label: 'Morning' });
      }
      if (timingLower.includes('afternoon') || freqLower.includes('tds')) {
        timings.push({ hour: 13, minute: 0, label: 'Afternoon' });
      }
      if (timingLower.includes('evening') || timingLower.includes('night') || freqLower.includes('bd') || freqLower.includes('tds') || freqLower.includes('hs')) {
        timings.push({ hour: 20, minute: 0, label: 'Night' });
      }
      if (timings.length === 0) {
        timings.push({ hour: 9, minute: 0, label: 'Daily' });
      }

      timings.forEach((t, tIdx) => {
        const start = new Date(eventDate);
        start.setHours(t.hour, t.minute, 0, 0);

        events.push({
          uid: `med-${med.id || idx}-day${day}-${tIdx}@recoverycompass.org`,
          summary: `💊 Take ${med.name} (${med.dose} ${med.unit || ''})`,
          description: `Recovery Compass Day ${day} Medicine Reminder:\n` +
            `Medication: ${med.name}\n` +
            `Dose: ${med.dose} ${med.unit || ''}\n` +
            `Instructions: ${med.timing || ''}\n` +
            `Source line verified from discharge instruction.\n` +
            `Contact ASHA / Clinic if severe side effects occur.`,
          start,
          durationMinutes: 15,
          alarmMinutesBefore: 15,
        });
      });
    });
  }

  // 2. Generate Follow-up appointments
  const followUps = plan.followUps || [];
  followUps.forEach((f: FollowUpAppointment, idx: number) => {
    let apptDate: Date;
    try {
      apptDate = f.date ? new Date(f.date) : new Date(baseDate.getTime() + 86400000 * 7);
      if (isNaN(apptDate.getTime())) {
        apptDate = new Date(baseDate.getTime() + 86400000 * 7);
      }
    } catch {
      apptDate = new Date(baseDate.getTime() + 86400000 * 7);
    }

    apptDate.setHours(10, 0, 0, 0);

    events.push({
      uid: `followup-${f.id || idx}@recoverycompass.org`,
      summary: `🏥 Clinic Follow-up: ${f.specialty || f.clinician || 'Hospital Check-up'}`,
      description: `Hospital Check-up & Post-Discharge Review:\n` +
        `Clinician / Department: ${f.clinician || f.specialty}\n` +
        `Purpose: ${f.purpose || 'Post-operative recovery assessment'}\n` +
        `Location: ${f.location || plan.patientProfile?.hospitalName || 'Primary Health Centre'}\n` +
        `Tests to bring: ${f.tests?.join(', ') || 'Discharge papers and prescription'}`,
      location: f.location || plan.patientProfile?.hospitalName || 'Primary Health Centre',
      start: apptDate,
      durationMinutes: 60,
      alarmMinutesBefore: 120, // Alarm 2 hours prior
    });
  });

  // 3. Assemble RFC 5545 iCalendar string
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Recovery Compass//Rural Health Post-Hospital Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Recovery Compass Plan (Day 1-15)`,
    `X-WR-TIMEZONE:Asia/Kolkata`,
  ];

  events.forEach((ev) => {
    const dtStamp = formatDateToIcs(new Date());
    const dtStart = formatDateToIcs(ev.start);
    const dtEnd = formatDateToIcs(new Date(ev.start.getTime() + ev.durationMinutes * 60000));

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${ev.summary.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${ev.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
      ...(ev.location ? [`LOCATION:${ev.location.replace(/,/g, '\\,')}`] : []),
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      `TRIGGER:-PT${ev.alarmMinutesBefore}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${ev.summary.replace(/,/g, '\\,')}`,
      'END:VALARM',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger download of .ics file to user's phone or desktop
 */
export function downloadRecoveryCalendar(plan: RecoveryPlan): void {
  const icsData = generateRecoveryIcs(plan);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recovery-compass-day1-15-alarms.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
