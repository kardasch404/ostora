import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorDto } from '@ostora/shared-dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string;
    let error: string | undefined;
    let validationErrors: Record<string, string[]> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || 'Internal server error';
      error = responseObj.error;

      // Handle validation errors
      if (Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        validationErrors = this.formatValidationErrors(responseObj.message);
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      message = 'Internal server error';
    }

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string);

    const errorResponse = new ErrorDto(
      status,
      message,
      error,
      request.url,
      request.method,
      correlationId,
      validationErrors,
    );

    // Log error with Winston
    const logContext = {
      statusCode: status,
      method: request.method,
      url: request.url,
      correlationId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
        JSON.stringify(logContext),
      );
    }

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(errors: any[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (typeof error === 'string') {
        formatted['general'] = formatted['general'] || [];
        formatted['general'].push(error);
      } else if (error.property && error.constraints) {
        formatted[error.property] = Object.values(error.constraints);
      }
    });

    return formatted;
  }
}
