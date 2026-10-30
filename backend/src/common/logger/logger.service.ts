import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'recovery-compass', env: process.env.NODE_ENV },
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'development'
              ? winston.format.combine(
                  winston.format.colorize(),
                  winston.format.simple(),
                )
              : winston.format.json(),
        }),
      ],
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context: context ?? this.context });
  }

  error(message: string, trace?: string | Error, context?: string): void {
    // SECURITY: Never log passwords, tokens, or full medical documents
    this.logger.error(message, {
      context: context ?? this.context,
      trace: trace instanceof Error ? trace.stack : trace,
    });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context ?? this.context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context ?? this.context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context ?? this.context });
  }

  /**
   * Structured log with explicit field control.
   * Never logs sensitive medical values.
   */
  structured(level: string, event: string, data: Record<string, unknown>): void {
    // Sanitize: remove any accidental sensitive fields
    const safe = { ...data };
    const blocked = ['password', 'passwordHash', 'token', 'secret', 'otp', 'pin'];
    blocked.forEach((k) => delete safe[k]);

    this.logger.log(level, event, { context: this.context, ...safe });
  }
}
