import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    return next.handle().pipe(
      map((data) => {
        // If the response already has {data, meta} shape, pass through
        if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
          return {
            ...data,
            meta: {
              ...data.meta,
              requestId,
              timestamp: new Date().toISOString(),
            },
          };
        }

        return {
          data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
