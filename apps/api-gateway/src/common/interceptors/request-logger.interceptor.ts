import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const correlationId = headers['x-correlation-id'] || headers['x-request-id'];
    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent} | Correlation-ID: ${correlationId}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          this.logger.log(
            `← ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms | Correlation-ID: ${correlationId}`,
          );
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
}
