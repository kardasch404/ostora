import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ResponseDto } from '@ostora/shared-dto';

// ==================== RESPONSE TRANSFORM INTERCEPTOR ====================

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string);

    return next.handle().pipe(
      map((data) => {
        // If data is already a ResponseDto, return it
        if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
          return data;
        }

        // Transform raw data into ResponseDto
        return ResponseDto.success('Success', data, correlationId);
      }),
    );
  }
}

// ==================== LOGGING INTERCEPTOR ====================

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, headers, body } = request;
    const userAgent = headers['user-agent'] || '';
    const correlationId = headers['x-correlation-id'] || headers['x-request-id'];
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `→ ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent} | Correlation-ID: ${correlationId}`,
    );

    // Log request body in development (excluding sensitive fields)
    if (process.env.NODE_ENV !== 'production' && body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          this.logger.log(
            `← ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms | Correlation-ID: ${correlationId}`,
          );

          // Log response data in development
          if (process.env.NODE_ENV !== 'production' && data) {
            this.logger.debug(`Response: ${JSON.stringify(data).substring(0, 200)}...`);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `← ${method} ${url} | Error: ${error.message} | Duration: ${duration}ms | Correlation-ID: ${correlationId}`,
            error.stack,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

// ==================== TIMEOUT INTERCEPTOR ====================

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      tap({
        error: (error) => {
          if (error.name === 'TimeoutError') {
            this.logger.error(
              `Request timeout: ${request.method} ${request.url} exceeded ${this.timeout}ms`,
            );
          }
        },
      }),
    );
  }
}
