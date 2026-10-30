// Recovery Compass — API Endpoints & Error Codes

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_PREFIX}/auth/register`,
    LOGIN: `${API_PREFIX}/auth/login`,
    LOGOUT: `${API_PREFIX}/auth/logout`,
    REFRESH: `${API_PREFIX}/auth/refresh`,
    ME: `${API_PREFIX}/auth/me`,
  },
  // Users & Preferences
  USERS: {
    PROFILE: `${API_PREFIX}/users/profile`,
    PREFERENCES: `${API_PREFIX}/users/preferences`,
  },
  // Documents
  DOCUMENTS: {
    UPLOAD: `${API_PREFIX}/documents/upload`,
    BY_ID: (id: string) => `${API_PREFIX}/documents/${id}`,
    PROCESS: (id: string) => `${API_PREFIX}/documents/${id}/process`,
    PAGES: (id: string) => `${API_PREFIX}/documents/${id}/pages`,
    QUALITY: (id: string) => `${API_PREFIX}/documents/${id}/quality`,
  },
  // Extractions
  EXTRACTIONS: {
    BY_ID: (id: string) => `${API_PREFIX}/extractions/${id}`,
    FIELD: (extractionId: string, fieldId: string) =>
      `${API_PREFIX}/extractions/${extractionId}/fields/${fieldId}`,
    CONFIRM: (id: string) => `${API_PREFIX}/extractions/${id}/confirm`,
    MARK_UNCLEAR: (id: string) => `${API_PREFIX}/extractions/${id}/mark-unclear`,
    SOURCE: (extractionId: string, fieldId: string) =>
      `${API_PREFIX}/extractions/${extractionId}/fields/${fieldId}/source`,
  },
  // Recovery Plans
  PLANS: {
    CREATE: `${API_PREFIX}/plans`,
    LIST: `${API_PREFIX}/plans`,
    BY_ID: (id: string) => `${API_PREFIX}/plans/${id}`,
    CONFIRM: (id: string) => `${API_PREFIX}/plans/${id}/confirm`,
    TIMELINE: (id: string) => `${API_PREFIX}/plans/${id}/timeline`,
    SNAPSHOT: (id: string) => `${API_PREFIX}/plans/${id}/snapshot`,
    PROGRESS: (id: string) => `${API_PREFIX}/plans/${id}/progress`,
    MEDICATIONS: (id: string) => `${API_PREFIX}/plans/${id}/medications`,
    MEDICATIONS_TODAY: (id: string) => `${API_PREFIX}/plans/${id}/medications/today`,
    MEDICATIONS_MISSED: (id: string) => `${API_PREFIX}/plans/${id}/medications/missed`,
    SYMPTOMS: (id: string) => `${API_PREFIX}/plans/${id}/symptoms`,
    SAFETY_CHECK: (id: string) => `${API_PREFIX}/plans/${id}/safety/check`,
    RED_FLAGS: (id: string) => `${API_PREFIX}/plans/${id}/red-flags`,
    FOLLOW_UPS: (id: string) => `${API_PREFIX}/plans/${id}/follow-ups`,
    DOCTOR_QUESTIONS: (id: string) => `${API_PREFIX}/plans/${id}/doctor-questions`,
    GENERATE_QUESTIONS: (id: string) => `${API_PREFIX}/plans/${id}/doctor-questions/generate`,
    FAMILY_INVITE: (id: string) => `${API_PREFIX}/plans/${id}/family/invite`,
  },
  // Medications Events
  MEDICATIONS: {
    LOG_EVENT: (scheduleId: string) => `${API_PREFIX}/medications/${scheduleId}/events`,
  },
  // Symptoms
  SYMPTOMS: {
    LOG: `${API_PREFIX}/symptoms`,
    DEFINITIONS: `${API_PREFIX}/symptoms/definitions`,
  },
  // Follow-ups & Calendar
  FOLLOW_UPS: {
    CREATE: `${API_PREFIX}/follow-ups`,
    BY_ID: (id: string) => `${API_PREFIX}/follow-ups/${id}`,
    CALENDAR: (id: string) => `${API_PREFIX}/follow-ups/${id}/calendar`,
  },
  // Doctor Questions
  DOCTOR_QUESTIONS: {
    RESOLVE: (id: string) => `${API_PREFIX}/doctor-questions/${id}/resolve`,
  },
  // Family
  FAMILY: {
    ACCEPT_INVITATION: (token: string) => `${API_PREFIX}/family/invitations/${token}/accept`,
    MEMBERS: `${API_PREFIX}/family/members`,
    MEMBER: (id: string) => `${API_PREFIX}/family/members/${id}`,
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_PREFIX}/notifications`,
    MARK_READ: (id: string) => `${API_PREFIX}/notifications/${id}/read`,
  },
  // Privacy
  PRIVACY: {
    DELETE_REQUEST: `${API_PREFIX}/privacy/delete-request`,
  },
  // Admin
  ADMIN: {
    PATHWAYS: `${API_PREFIX}/admin/pathways`,
    RED_FLAGS: `${API_PREFIX}/admin/red-flags`,
    RED_FLAG: (id: string) => `${API_PREFIX}/admin/red-flags/${id}`,
    CONFIG: `${API_PREFIX}/admin/config`,
  },
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_EVENT: 'DUPLICATE_EVENT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
    timestamp: string;
  };
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    [key: string]: any;
  };
}
