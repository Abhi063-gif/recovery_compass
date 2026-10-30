// Queue and job name constants
// Using constants prevents typos and ensures idempotency key consistency

export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';
export const NOTIFICATION_QUEUE = 'notifications';
export const PLAN_GENERATION_QUEUE = 'plan-generation';

export const JOBS = {
  PROCESS_DOCUMENT: 'process-document',
  QUALITY_ANALYSIS: 'quality-analysis',
  RUN_OCR: 'run-ocr',
  RUN_EXTRACTION: 'run-extraction',
  VALIDATE_EXTRACTION: 'validate-extraction',
  GENERATE_PLAN: 'generate-plan',
  DELIVER_NOTIFICATION: 'deliver-notification',
  SCHEDULE_REMINDERS: 'schedule-reminders',
  GENERATE_DOCTOR_QUESTIONS: 'generate-doctor-questions',
  DATA_RETENTION_CLEANUP: 'data-retention-cleanup',
};
