import { describe, it, expect, beforeEach } from 'vitest';
import { RedFlagEngine, SymptomInput } from './red-flag.engine';

describe('RedFlagEngine', () => {
  let engine: RedFlagEngine;

  beforeEach(() => {
    // Engine evaluateRule method is purely deterministic
    engine = new RedFlagEngine(
      null as any,
      null as any,
      null as any,
      { setContext: () => {}, warn: () => {}, log: () => {} } as any,
    );
  });

  describe('evaluateRule', () => {
    it('should trigger rule when temperature exceeds threshold', () => {
      const feverRule = {
        triggerType: 'TEMPERATURE_HIGH',
        triggerConfig: {
          field: 'temperature',
          operator: 'gte' as const,
          value: 38.5,
        },
      };

      const highTemp: SymptomInput = { temperature: 38.6 };
      expect(engine.evaluateRule(feverRule, highTemp)).toBe(true);

      const normalTemp: SymptomInput = { temperature: 37.0 };
      expect(engine.evaluateRule(feverRule, normalTemp)).toBe(false);
    });

    it('should trigger rule when pain score is greater than threshold', () => {
      const painRule = {
        triggerType: 'SEVERE_PAIN',
        triggerConfig: {
          field: 'painScore',
          operator: 'gt' as const,
          value: 7,
        },
      };

      expect(engine.evaluateRule(painRule, { painScore: 8 })).toBe(true);
      expect(engine.evaluateRule(painRule, { painScore: 7 })).toBe(false);
      expect(engine.evaluateRule(painRule, { painScore: 5 })).toBe(false);
    });

    it('should trigger rule when symptom codes contain specific red flag', () => {
      const chestPainRule = {
        triggerType: 'CHEST_PAIN',
        triggerConfig: {
          field: 'symptomCodes',
          operator: 'contains' as const,
          value: 'CHEST_PAIN',
        },
      };

      expect(
        engine.evaluateRule(chestPainRule, {
          symptomCodes: ['NAUSEA', 'CHEST_PAIN'],
        }),
      ).toBe(true);

      expect(
        engine.evaluateRule(chestPainRule, {
          symptomCodes: ['HEADACHE', 'NAUSEA'],
        }),
      ).toBe(false);
    });

    it('should return false if evaluated field is missing from input', () => {
      const feverRule = {
        triggerType: 'TEMPERATURE_HIGH',
        triggerConfig: {
          field: 'temperature',
          operator: 'gte' as const,
          value: 38.5,
        },
      };

      expect(engine.evaluateRule(feverRule, { painScore: 5 })).toBe(false);
    });
  });
});
