import { apiClient } from './client';

export interface BackendExtractionField {
  id: string;
  extractionId: string;
  category:
    | 'MEDICINES'
    | 'FOLLOW_UPS'
    | 'TESTS'
    | 'RESTRICTIONS'
    | 'DIET'
    | 'HYDRATION'
    | 'TASKS'
    | 'SYMPTOMS'
    | 'RED_FLAGS'
    | 'CONDITIONAL_INSTRUCTIONS';
  fieldKey: string;
  value: string | null;
  rawValue?: string | null;
  sourceText?: string | null;
  page?: number | null;
  boundingBox?: { x: number; y: number; width?: number; height?: number; w?: number; h?: number } | null;
  confidence?: number | null;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN' | null;
  validationStatus: 'VALID' | 'NEEDS_REVIEW' | 'CONFLICT' | 'SUSPECTED_EXTRACTION_ERROR' | 'CONFIRMED' | 'UNCLEAR';
  isUnclear: boolean;
  conflictInfo?: Record<string, unknown> | null;
  editedValue?: string | null;
  editedAt?: string | null;
  notes?: string | null;
}

export interface BackendExtraction {
  id: string;
  documentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW' | 'CONFIRMED';
  schemaVersion: string;
  confirmedAt?: string | null;
  fields: BackendExtractionField[];
}

export interface SourceReferenceResponse {
  sourceText?: string;
  page?: number;
  boundingBox?: { x: number; y: number; width?: number; height?: number; w?: number; h?: number };
  documentId: string;
}

export const extractionApi = {
  getById: async (id: string): Promise<BackendExtraction> => {
    return apiClient.get<BackendExtraction>(`/extractions/${id}`);
  },

  updateField: async (
    extractionId: string,
    fieldId: string,
    value: string,
    notes?: string,
  ): Promise<BackendExtractionField> => {
    return apiClient.patch<BackendExtractionField>(`/extractions/${extractionId}/fields/${fieldId}`, {
      value,
      notes,
    });
  },

  confirm: async (id: string): Promise<BackendExtraction> => {
    return apiClient.post<BackendExtraction>(`/extractions/${id}/confirm`);
  },

  markUnclear: async (extractionId: string, fieldId: string, notes?: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/extractions/${extractionId}/mark-unclear`, {
      fieldId,
      notes,
    });
  },

  getSource: async (extractionId: string, fieldId: string): Promise<SourceReferenceResponse> => {
    return apiClient.get<SourceReferenceResponse>(`/extractions/${extractionId}/fields/${fieldId}/source`);
  },
};
