import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryScheduler } from './recovery.scheduler';

describe('RecoveryScheduler', () => {
  let scheduler: RecoveryScheduler;

  beforeEach(() => {
    scheduler = new RecoveryScheduler(
      null as any,
      { setContext: () => {}, log: () => {}, debug: () => {} } as any,
    );
  });

  describe('deterministic slot and frequency parsing', () => {
    it('should map frequencies to expected times per day', () => {
      const parseFrequency = (scheduler as any).parseFrequency.bind(scheduler);

      expect(parseFrequency('OD')).toBe(1);
      expect(parseFrequency('ONCE DAILY')).toBe(1);
      expect(parseFrequency('BD')).toBe(2);
      expect(parseFrequency('TWICE DAILY')).toBe(2);
      expect(parseFrequency('TDS')).toBe(3);
      expect(parseFrequency('THREE TIMES DAILY')).toBe(3);
      expect(parseFrequency('QDS')).toBe(4);
      expect(parseFrequency('UNKNOWN_FREQ')).toBe(0);
    });

    it('should generate standard time slots based on daily frequency', () => {
      const getTimeSlots = (scheduler as any).getTimeSlots.bind(scheduler);

      const onceSlots = getTimeSlots(1);
      expect(onceSlots).toHaveLength(1);
      expect(onceSlots[0].hour).toBe(8);

      const twiceSlots = getTimeSlots(2);
      expect(twiceSlots).toHaveLength(2);
      expect(twiceSlots[0].hour).toBe(8);
      expect(twiceSlots[1].hour).toBe(20);

      const thriceSlots = getTimeSlots(3);
      expect(thriceSlots).toHaveLength(3);
      expect(thriceSlots[0].hour).toBe(7);
      expect(thriceSlots[1].hour).toBe(13);
      expect(thriceSlots[2].hour).toBe(19);
    });

    it('should extract correct day offsets from clinical instructions', () => {
      const parseDayOffset = (scheduler as any).parseDayOffset.bind(scheduler);

      expect(parseDayOffset('Remove dressing on Day 3', 'task')).toBe(2);
      expect(parseDayOffset('Follow-up on Day 7', 'task')).toBe(6);
      expect(parseDayOffset('Begin light walking Week 2', 'task')).toBe(7);
      expect(parseDayOffset('Rest immediately after discharge', 'task')).toBe(0);
    });
  });
});
