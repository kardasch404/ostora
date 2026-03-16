import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== PAGINATION DTO ====================

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ==================== RESPONSE DTO ====================

export class ResponseDto<T> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Request correlation ID' })
  correlationId?: string;

  constructor(success: boolean, message: string, data?: T, correlationId?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.correlationId = correlationId;
  }

  static success<T>(message: string, data?: T, correlationId?: string): ResponseDto<T> {
    return new ResponseDto<T>(true, message, data, correlationId);
  }

  static error<T>(message: string, data?: T, correlationId?: string): ResponseDto<T> {
    return new ResponseDto<T>(false, message, data, correlationId);
  }
}

// ==================== PAGINATED RESPONSE DTO ====================

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total items' })
  total: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', type: 'array' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Request correlation ID' })
  correlationId?: string;

  constructor(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success',
    correlationId?: string,
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.pagination = new PaginationMetaDto(page, limit, total);
    this.timestamp = new Date().toISOString();
    this.correlationId = correlationId;
  }
}

// ==================== ERROR DTO ====================

export class ErrorDto {
  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Error type' })
  error?: string;

  @ApiPropertyOptional({ description: 'Request path' })
  path?: string;

  @ApiPropertyOptional({ description: 'Request method' })
  method?: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;

  @ApiPropertyOptional({ description: 'Request correlation ID' })
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Validation errors', type: 'object' })
  errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    error?: string,
    path?: string,
    method?: string,
    correlationId?: string,
    errors?: Record<string, string[]>,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.path = path;
    this.method = method;
    this.timestamp = new Date().toISOString();
    this.correlationId = correlationId;
    this.errors = errors;
  }
}

// ==================== ID PARAM DTO ====================

export class IdParamDto {
  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  id: string;
}
