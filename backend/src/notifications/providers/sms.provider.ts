import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsProvider {
  private readonly provider: string;

  constructor(private readonly cfg: ConfigService, private readonly logger: LoggerService) {
    this.logger.setContext(SmsProvider.name);
    this.provider = cfg.get<string>('SMS_PROVIDER', 'console');
  }

  async send(options: SmsOptions): Promise<void> {
    if (this.provider === 'console') {
      this.logger.log(`[SMS CONSOLE] To: ${options.to} | Message: ${options.message}`);
      return;
    }

    if (this.provider === 'twilio') {
      await this.sendViaTwilio(options);
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
