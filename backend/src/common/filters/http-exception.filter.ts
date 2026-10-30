import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string) || message;
        code = (r.error as string) || exception.name;
        details = r.details;
      } else {
        message = res as string;
      }
    } else if (exception instanceof Error) {
      // Never expose internal stack to clients
      this.logger.error(exception.message, exception.stack, 'UnhandledException');
    }

    // NEVER return stack traces to clients
    response.status(status).json({
      error: {
        code,
        message,
        details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${status} — ${message}`,
        undefined,
        'HttpExceptionFilter',
      );
    }
  }
}
