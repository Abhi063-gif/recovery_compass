import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SmsProvider,
  formatIndianPhoneNumber,
  formatOtpForSharing,
} from './sms.provider';

describe('SmsProvider & Indian Phone Number / OTP Utilities', () => {
  describe('formatIndianPhoneNumber', () => {
    it('should format 10-digit Indian numbers starting with 6, 7, 8, 9 with +91', () => {
      expect(formatIndianPhoneNumber('9876543210')).toBe('+919876543210');
      expect(formatIndianPhoneNumber('8123456789')).toBe('+918123456789');
      expect(formatIndianPhoneNumber('7000123456')).toBe('+917000123456');
      expect(formatIndianPhoneNumber('6987654321')).toBe('+916987654321');
    });

    it('should strip leading 0 from 11-digit numbers and prepend +91', () => {
      expect(formatIndianPhoneNumber('09876543210')).toBe('+919876543210');
      expect(formatIndianPhoneNumber('0 98765 43210')).toBe('+919876543210');
    });

    it('should normalize 12-digit numbers starting with 91 to +91', () => {
      expect(formatIndianPhoneNumber('919876543210')).toBe('+919876543210');
    });

    it('should handle numbers already formatted with +91 and formatting punctuation', () => {
      expect(formatIndianPhoneNumber('+91 98765-43210')).toBe('+919876543210');
      expect(formatIndianPhoneNumber('+91 (98765) 43210')).toBe('+919876543210');
      expect(formatIndianPhoneNumber('+919876543210')).toBe('+919876543210');
    });

    it('should preserve other valid international E.164 formats', () => {
      expect(formatIndianPhoneNumber('+14155552671')).toBe('+14155552671');
      expect(formatIndianPhoneNumber('+447911123456')).toBe('+447911123456');
    });

    it('should handle empty or null values gracefully', () => {
      expect(formatIndianPhoneNumber('')).toBe('');
      expect(formatIndianPhoneNumber(null as any)).toBe('');
    });
  });

  describe('formatOtpForSharing', () => {
    it('should format clean SMS and WhatsApp payloads with 6-digit OTP code', () => {
      const result = formatOtpForSharing('482910', {
        patientName: 'Gurpreet Singh',
        expiryMinutes: 15,
        phone: '9876543210',
      });

      expect(result.otp).toBe('482910');
      expect(result.phone).toBe('+919876543210');

      // SMS checks
      expect(result.smsMessage).toContain('482910 is your Recovery Compass verification code');
      expect(result.smsMessage).toContain("Gurpreet Singh's Family Circle");
      expect(result.smsMessage).toContain('15 minutes');
      expect(result.smsUri).toContain('sms:+919876543210?body=');

      // WhatsApp checks
      expect(result.whatsappMessage).toContain('*Recovery Compass Verification*');
      expect(result.whatsappMessage).toContain('Your OTP verification code is: *482910*');
      expect(result.whatsappMessage).toContain("Gurpreet Singh's Family Circle");
      expect(result.whatsappUri).toContain('https://wa.me/919876543210?text=');
    });

    it('should format direct links and custom purpose when provided', () => {
      const result = formatOtpForSharing('123456', {
        purpose: 'to verify your frontline worker login',
        link: 'https://recoverycompass.in/login?token=xyz',
      });

      expect(result.smsMessage).toContain('123456 is your Recovery Compass verification code to verify your frontline worker login');
      expect(result.smsMessage).toContain('Direct link: https://recoverycompass.in/login?token=xyz');
      expect(result.whatsappMessage).toContain('Direct link: https://recoverycompass.in/login?token=xyz');
      expect(result.whatsappUri).toContain('https://wa.me/?text=');
    });
  });

  describe('SmsProvider service class', () => {
    let provider: SmsProvider;
    let mockLogger: any;
    let mockConfig: any;

    beforeEach(() => {
      mockLogger = {
        setContext: vi.fn(),
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      mockConfig = {
        get: vi.fn((key: string, defaultVal?: any) => {
          if (key === 'SMS_PROVIDER') return 'console';
          return defaultVal;
        }),
      };

      provider = new SmsProvider(mockConfig, mockLogger);
    });

    it('should format phone and log cleanly in console mode', async () => {
      await provider.send({
        to: '9876543210',
        message: 'Your OTP is 998877',
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[SMS CONSOLE] To: +919876543210 | Message: Your OTP is 998877'
      );
    });

    it('should delegate OTP share generation via provider instance', () => {
      const share = provider.formatOtpForSharing('654321', { phone: '09876543210' });
      expect(share.otp).toBe('654321');
      expect(share.phone).toBe('+919876543210');
      expect(share.smsUri).toContain('sms:+919876543210?body=');
    });
  });
});
