import { apiClient } from './client';

export interface DocumentResponse {
  id: string;
  documentId?: string;
  patientProfileId: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount?: number;
  status:
    | 'PENDING'
    | 'QUALITY_ANALYSIS'
    | 'QUALITY_FAILED'
    | 'OCR_PROCESSING'
    | 'OCR_DONE'
    | 'EXTRACTING'
    | 'EXTRACTION_DONE'
    | 'NEEDS_REVIEW'
    | 'CONFIRMED'
    | 'ARCHIVED';
  qualityStatus?: 'ACCEPTABLE' | 'NEEDS_RETAKE' | 'UNREADABLE';
  qualityIssues?: string[];
  uploadedAt: string;
  extractionId?: string;
  processingJob?: {
    id: string;
    status: string;
    attempt: number;
    lastError?: string | null;
  } | null;
}

export interface DocumentQualityReport {
  status: 'ACCEPTABLE' | 'NEEDS_RETAKE' | 'UNREADABLE';
  issues: string[];
  report?: Record<string, unknown>;
}

export const documentsApi = {
  upload: async (file: File): Promise<DocumentResponse> => {
    return apiClient.upload<DocumentResponse>('/documents/upload', file);
  },

  getById: async (id: string): Promise<DocumentResponse> => {
    return apiClient.get<DocumentResponse>(`/documents/${id}`);
  },

  getStatus: async (id: string): Promise<DocumentResponse> => {
    return apiClient.get<DocumentResponse>(`/documents/${id}/status`);
  },

  process: async (id: string): Promise<{ jobId: string; status: string; mode?: string }> => {
    return apiClient.post<{ jobId: string; status: string; mode?: string }>(`/documents/${id}/process`);
  },

  triggerProcessing: async (id: string): Promise<{ jobId: string; status: string; mode?: string }> => {
    return documentsApi.process(id);
  },

  getPages: async (id: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/documents/${id}/pages`);
  },

  getQuality: async (id: string): Promise<DocumentQualityReport> => {
    return apiClient.get<DocumentQualityReport>(`/documents/${id}/quality`);
  },
};
