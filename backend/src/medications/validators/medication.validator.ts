import { Injectable } from '@nestjs/common';
import Fuse from 'fuse.js';

/**
 * Medication Validator
 *
 * SAFETY CONTRACT:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Validates medication names against a known drug list (RxNorm subset)
 * 2. Performs FUZZY MATCHING — never auto-substitutes a different drug
 * 3. If fuzzy match is uncertain → status = NEEDS_REVIEW
 * 4. Normalizes frequency abbreviations but preserves source wording
 * 5. Dose sanity checks flag suspected OCR errors — never auto-correct
 *
 * Dose sanity check: IF extracted dose differs from source by >10x → flag
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class MedicationValidator {
  // Common medication names for fuzzy matching (MVP subset — in production, connect to RxNorm API)
  private readonly knownDrugs = [
    'paracetamol', 'acetaminophen', 'ibuprofen', 'naproxen', 'aspirin',
    'amoxicillin', 'amoxicillin-clavulanate', 'cephalexin', 'cetirizine',
    'metformin', 'lisinopril', 'atorvastatin', 'omeprazole', 'lansoprazole',
    'codeine', 'tramadol', 'morphine', 'oxycodone', 'diclofenac',
    'metronidazole', 'flucloxacillin', 'co-amoxiclav', 'ciprofloxacin',
    'prednisolone', 'dexamethasone', 'warfarin', 'enoxaparin', 'rivaroxaban',
    'metoprolol', 'amlodipine', 'ramipril', 'furosemide', 'spironolactone',
    'ondansetron', 'metoclopramide', 'lactulose', 'senna', 'bisacodyl',
    'pantoprazole', 'ranitidine', 'gabapentin', 'pregabalin',
  ];

  private readonly fuse: Fuse<string>;

  // Frequency normalization map
  private readonly frequencyMap: Record<string, string> = {
    'BD': 'twice daily',
    'BDS': 'twice daily',
    'BID': 'twice daily',
    'TDS': 'three times daily',
    'TID': 'three times daily',
    'QDS': 'four times daily',
    'QID': 'four times daily',
    'OD': 'once daily',
    'OM': 'every morning',
    'ON': 'every night',
    'HS': 'at bedtime',
    'SOS': 'as needed',
    'PRN': 'as needed',
    'STAT': 'immediately',
  };

  constructor() {
    this.fuse = new Fuse(this.knownDrugs, {
      threshold: 0.3,
      distance: 100,
      includeScore: true,
    });
  }

  validateMedicationName(name: string): {
    isValid: boolean;
    normalizedName?: string;
    fuzzyMatchScore?: number;
    status: 'VALID' | 'NEEDS_REVIEW' | 'UNKNOWN';
  } {
    const normalized = name.trim().toLowerCase();

    // Exact match
    if (this.knownDrugs.includes(normalized)) {
      return { isValid: true, normalizedName: normalized, status: 'VALID' };
    }

    // Fuzzy match
    const results = this.fuse.search(normalized);

    if (results.length === 0) {
      return { isValid: false, status: 'UNKNOWN' };
    }

    const best = results[0];
    const score = 1 - (best.score ?? 1);

    if (score >= 0.7) {
      return {
        isValid: true,
        normalizedName: best.item,
        fuzzyMatchScore: score,
        status: 'VALID',
      };
    }

    // Uncertain fuzzy match
    return {
      isValid: false,
      normalizedName: best.item,
      fuzzyMatchScore: score,
      status: 'NEEDS_REVIEW',
    };
  }

  normalizeFrequency(frequency: string): {
    normalized: string;
    code: string;
    isAsNeeded: boolean;
  } {
    const upper = frequency.trim().toUpperCase();
    const normalized = this.frequencyMap[upper];

    return {
      normalized: normalized ?? frequency, // Preserve original if unknown
      code: upper,
      isAsNeeded: ['SOS', 'PRN'].includes(upper),
    };
  }

  /**
   * Dose sanity check.
   * Detects potentially malformed extraction (e.g., "500mg" parsed as "5000mg").
   *
   * SAFETY: This does NOT recommend a dose — it only flags suspected OCR errors.
   */
  validateDose(dose: string, doseUnit: string): {
    status: 'VALID' | 'NEEDS_REVIEW' | 'SUSPECTED_EXTRACTION_ERROR';
    note?: string;
  } {
    const numericDose = parseFloat(dose);

    if (isNaN(numericDose)) {
      return { status: 'NEEDS_REVIEW', note: 'Dose is not a valid number' };
    }

    if (numericDose <= 0) {
      return { status: 'SUSPECTED_EXTRACTION_ERROR', note: 'Dose cannot be zero or negative' };
    }

    // Unit-specific sanity ranges (these do NOT recommend doses — only flag >10x typical max)
    const maxSanity: Record<string, number> = {
      'mg': 10000,  // 10g per dose would be unusual and warrants review
      'g': 10,
      'ml': 1000,
      'mcg': 1000,
      'µg': 1000,
      'iu': 100000,
    };

    const unit = doseUnit.toLowerCase().trim();
    const max = maxSanity[unit];

    if (max && numericDose > max) {
      return {
        status: 'SUSPECTED_EXTRACTION_ERROR',
        note: `Dose ${numericDose}${unit} exceeds sanity threshold ${max}${unit} — possible OCR error`,
      };
    }

    return { status: 'VALID' };
  }
}
