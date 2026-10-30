import { describe, it, expect } from 'vitest';
import {
  ExtractionFieldSchema,
  MedicineExtractionSchema,
  RootExtractionSchema,
} from './extraction.schema';

describe('ExtractionSchema', () => {
  it('should validate a valid extraction field with source reference', () => {
    const validField = {
      value: 'Paracetamol 500mg',
      sourceText: 'Paracetamol 500mg PO QDS',
      page: 1,
      boundingBox: { x: 10, y: 20, width: 100, height: 15 },
      confidence: 0.95,
      isUncertain: false,
    };

    const result = ExtractionFieldSchema.safeParse(validField);
    expect(result.success).toBe(true);
  });

  it('should accept null value when explicitly uncertain', () => {
    const uncertainField = {
      value: null,
      sourceText: 'illegible dosage',
      page: 1,
      boundingBox: null,
      confidence: 0.2,
      isUncertain: true,
      uncertaintyReason: 'Handwriting smudged',
    };

    const result = ExtractionFieldSchema.safeParse(uncertainField);
    expect(result.success).toBe(true);
  });

  it('should reject confidence values outside [0, 1]', () => {
    const invalidField = {
      value: 'Aspirin',
      sourceText: 'Aspirin 75mg',
      page: 1,
      boundingBox: null,
      confidence: 1.5,
      isUncertain: false,
    };

    const result = ExtractionFieldSchema.safeParse(invalidField);
    expect(result.success).toBe(false);
  });

  it('should validate a complete medication extraction', () => {
    const medication = {
      name: {
        value: 'Ibuprofen',
        sourceText: 'Ibuprofen',
        page: 1,
        boundingBox: null,
        confidence: 0.98,
        isUncertain: false,
      },
      dose: {
        value: '400',
        sourceText: '400mg',
        page: 1,
        boundingBox: null,
        confidence: 0.95,
        isUncertain: false,
      },
      doseUnit: {
        value: 'mg',
        sourceText: 'mg',
        page: 1,
        boundingBox: null,
        confidence: 0.99,
        isUncertain: false,
      },
      frequency: {
        value: 'TDS',
        sourceText: 'three times daily with food',
        page: 1,
        boundingBox: null,
        confidence: 0.9,
        isUncertain: false,
      },
      asNeeded: false,
    };

    const result = MedicineExtractionSchema.safeParse(medication);
    expect(result.success).toBe(true);
  });

  it('should validate root extraction schema structure', () => {
    const rootData = {
      schemaVersion: '1.0' as const,
      extractionConfidence: 0.95,
      documentType: 'DISCHARGE_SUMMARY',
      surgeryType: 'Laparoscopic Appendectomy',
      surgeryDate: {
        value: '2026-09-15',
        sourceText: 'DOS: 15/09/2026',
        page: 1,
        boundingBox: null,
        confidence: 0.9,
        isUncertain: false,
      },
      dischargeDate: {
        value: '2026-09-16',
        sourceText: 'Discharged: 16/09/2026',
        page: 1,
        boundingBox: null,
        confidence: 0.92,
        isUncertain: false,
      },
      clinicianName: {
        value: 'Dr. Jane Smith',
        sourceText: 'Dr. Jane Smith, MD',
        page: 1,
        boundingBox: null,
        confidence: 0.98,
        isUncertain: false,
      },
      hospitalName: {
        value: 'City General Hospital',
        sourceText: 'City General Hospital',
        page: 1,
        boundingBox: null,
        confidence: 0.99,
        isUncertain: false,
      },
      medicines: [],
      followUps: [],
      tests: [],
      restrictions: [],
      diet: [],
      hydration: [],
      tasks: [],
      symptoms: [],
      redFlags: [],
      conditionalInstructions: [],
      extractionNotes: 'Discharge summary parsed cleanly',
    };

    const result = RootExtractionSchema.safeParse(rootData);
    expect(result.success).toBe(true);
  });
});
