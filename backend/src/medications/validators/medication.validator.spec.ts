import { describe, it, expect, beforeEach } from 'vitest';
import { MedicationValidator } from './medication.validator';

describe('MedicationValidator', () => {
  let validator: MedicationValidator;

  beforeEach(() => {
    validator = new MedicationValidator();
  });

  describe('validateMedicationName', () => {
    it('should validate exact match drug names', () => {
      const res = validator.validateMedicationName('Paracetamol');
      expect(res.isValid).toBe(true);
      expect(res.normalizedName).toBe('paracetamol');
      expect(res.status).toBe('VALID');
    });

    it('should fuzzy match slightly misspelled drug names', () => {
      const res = validator.validateMedicationName('paracetemol');
      expect(res.isValid).toBe(true);
      expect(res.normalizedName).toBe('paracetamol');
    });

    it('should return UNKNOWN for completely unrecognized drugs', () => {
      const res = validator.validateMedicationName('XyzRandomCompound123');
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('UNKNOWN');
    });
  });

  describe('normalizeFrequency', () => {
    it('should normalize standard medical abbreviations', () => {
      expect(validator.normalizeFrequency('BD').normalized).toBe('twice daily');
      expect(validator.normalizeFrequency('TDS').normalized).toBe('three times daily');
      expect(validator.normalizeFrequency('QDS').normalized).toBe('four times daily');
      expect(validator.normalizeFrequency('OD').normalized).toBe('once daily');
    });

    it('should flag PRN and SOS as asNeeded', () => {
      const prn = validator.normalizeFrequency('PRN');
      expect(prn.isAsNeeded).toBe(true);
      expect(prn.normalized).toBe('as needed');

      const sos = validator.normalizeFrequency('SOS');
      expect(sos.isAsNeeded).toBe(true);
      expect(sos.normalized).toBe('as needed');
    });

    it('should preserve original string for unknown frequencies', () => {
      const custom = validator.normalizeFrequency('every other day at noon');
      expect(custom.normalized).toBe('every other day at noon');
      expect(custom.isAsNeeded).toBe(false);
    });
  });

  describe('validateDose', () => {
    it('should accept typical valid doses', () => {
      const res = validator.validateDose('500', 'mg');
      expect(res.status).toBe('VALID');
    });

    it('should flag non-numeric doses', () => {
      const res = validator.validateDose('one tablet', 'tab');
      expect(res.status).toBe('NEEDS_REVIEW');
    });

    it('should flag zero or negative doses as suspected extraction errors', () => {
      const res = validator.validateDose('0', 'mg');
      expect(res.status).toBe('SUSPECTED_EXTRACTION_ERROR');
    });

    it('should flag extreme doses exceeding sanity threshold as suspected OCR error', () => {
      const res = validator.validateDose('50000', 'mg');
      expect(res.status).toBe('SUSPECTED_EXTRACTION_ERROR');
      expect(res.note).toContain('possible OCR error');
    });
  });
});
