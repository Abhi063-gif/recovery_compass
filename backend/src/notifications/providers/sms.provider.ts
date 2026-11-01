import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';

export interface SmsOptions {
  to: string;
  message: string;
}

export interface OtpShareOptions {
  phone?: string;
  patientName?: string;
  caregiverName?: string;
  expiryMinutes?: number;
  appName?: string;
  purpose?: string;
  link?: string;
}

export interface FormattedOtpShare {
  otp: string;
  phone?: string;
  smsMessage: string;
  whatsappMessage: string;
  smsUri: string;
  whatsappUri: string;
}

/**
 * Normalizes a phone number to standard Indian mobile E.164 format (+91XXXXXXXXXX).
 * Accepts 10-digit mobile numbers with or without +91 / 91 / 0 prefix and handles
 * whitespace, dashes, and parentheses.
 * Preserves other valid international E.164 formats (+...) unchanged.
 */
export function formatIndianPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';

  const trimmed = phone.trim();
  // Strip whitespace, dashes, dots, and parentheses
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

  // Extract all digit characters
  const digits = cleaned.replace(/\D/g, '');

  // Case 1: Exactly 10 digits starting with 6, 7, 8, or 9 (standard Indian mobile series)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  // Case 2: 11 digits starting with 0 followed by 6-9 (trunk prefix)
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }

  // Case 3: 12 digits starting with 91 followed by 6-9 (India country code without '+')
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return `+91${digits.slice(2)}`;
  }

  // Case 4: Already formatted with a leading '+' and at least 10 digits
  if (cleaned.startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }

  // Fallback for short test numbers or non-standard formats
  return digits.length === 10 ? `+91${digits}` : cleaned;
}

/**
 * Formats a 6-digit OTP code cleanly for carrier SMS gateways and WhatsApp sharing,
 * with standard E.164 phone formatting and URL encoding for 1-click delivery.
 */
export function formatOtpForSharing(otpCode: string, options?: OtpShareOptions): FormattedOtpShare {
  const cleanOtp = String(otpCode || '').trim();
  const appName = options?.appName || 'Recovery Compass';
  const expiry = options?.expiryMinutes ?? 10;
  const formattedPhone = options?.phone ? formatIndianPhoneNumber(options.phone) : undefined;
  const waPhone = formattedPhone ? formattedPhone.replace(/\D/g, '') : '';

  const contextPhrase = options?.patientName
    ? `to join ${options.patientName}'s Family Circle`
    : options?.purpose || 'to access your recovery plan';

  const linkLine = options?.link ? `\nDirect link: ${options.link}` : '';

  // Carrier-friendly SMS text (160 GSM-7 compliant plain text)
  const smsMessage = `${cleanOtp} is your ${appName} verification code ${contextPhrase}. Valid for ${expiry} minutes. Do not share this code with anyone.${linkLine}`;

  // WhatsApp formatted text with bolding asterisks and line breaks
  const whatsappMessage =
    `*${appName} Verification*\n\n` +
    `Your OTP verification code is: *${cleanOtp}*\n\n` +
    `Use this code ${contextPhrase}.\n` +
    `This code is valid for the next ${expiry} minutes.\n\n` +
    `_Please do not share this code with anyone for patient security._` +
    (linkLine ? `\n\nDirect link: ${options?.link}` : '');

  // 1-Click share URIs
  const smsUri = formattedPhone
    ? `sms:${formattedPhone}?body=${encodeURIComponent(smsMessage)}`
    : `sms:?body=${encodeURIComponent(smsMessage)}`;

  const whatsappUri = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    otp: cleanOtp,
    phone: formattedPhone,
    smsMessage,
    whatsappMessage,
    smsUri,
    whatsappUri,
  };
}

@Injectable()
export class SmsProvider {
  private readonly provider: string;

  constructor(private readonly cfg: ConfigService, private readonly logger: LoggerService) {
    this.logger.setContext(SmsProvider.name);
    this.provider = cfg.get<string>('SMS_PROVIDER', 'console');
  }

  formatPhone(phone: string): string {
    return formatIndianPhoneNumber(phone);
  }

  formatOtpForSharing(otpCode: string, options?: OtpShareOptions): FormattedOtpShare {
    return formatOtpForSharing(otpCode, options);
  }

  async send(options: SmsOptions): Promise<void> {
    const formattedRecipient = this.formatPhone(options.to);
    const normalizedOptions: SmsOptions = {
      to: formattedRecipient,
      message: options.message,
    };

    if (this.provider === 'console') {
      this.logger.log(`[SMS CONSOLE] To: ${normalizedOptions.to} | Message: ${normalizedOptions.message}`);
      return;
    }

    if (this.provider === 'twilio') {
      await this.sendViaTwilio(normalizedOptions);
    }
  }

  private async sendViaTwilio(options: SmsOptions): Promise<void> {
    // Twilio implementation
    const accountSid = this.cfg.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.cfg.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.cfg.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured — using console mode');
      this.logger.log(`[SMS TWILIO STUB] To: ${options.to} | Message: ${options.message}`);
      return;
    }

    // Dynamic require to avoid mandatory import
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body: options.message, from, to: options.to });
  }
}
