import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../../common/logger/logger.service';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailProvider {
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly cfg: ConfigService, private readonly logger: LoggerService) {
    this.logger.setContext(EmailProvider.name);

    this.from = cfg.get<string>('EMAIL_FROM', 'Recovery Compass <noreply@recoverycompass.app>');

    this.transporter = nodemailer.createTransport({
      host: cfg.get<string>('SMTP_HOST', 'localhost'),
      port: cfg.get<number>('SMTP_PORT', 1025),
      secure: cfg.get<boolean>('SMTP_SECURE', false),
      auth: cfg.get<string>('SMTP_USER')
        ? {
            user: cfg.get<string>('SMTP_USER'),
            pass: cfg.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async send(options: EmailOptions): Promise<void> {
    if (process.env.EMAIL_PROVIDER === 'console') {
      this.logger.log(`[EMAIL CONSOLE] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
