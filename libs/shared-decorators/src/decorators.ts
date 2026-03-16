import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

// ==================== CURRENT USER DECORATOR ====================

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});

// ==================== ROLES DECORATOR ====================

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ==================== PUBLIC DECORATOR ====================

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ==================== API VERSION DECORATOR ====================

export const API_VERSION_KEY = 'apiVersion';
export const ApiVersion = (version: string) => SetMetadata(API_VERSION_KEY, version);

// ==================== CORRELATION ID DECORATOR ====================

export const CorrelationId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return (
    request.headers['x-correlation-id'] ||
    request.headers['x-request-id'] ||
    'unknown'
  );
});

// ==================== IP ADDRESS DECORATOR ====================

export const IpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.ip || request.connection.remoteAddress || 'unknown';
});

// ==================== USER AGENT DECORATOR ====================

export const UserAgent = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers['user-agent'] || 'unknown';
});

// ==================== API KEY DECORATOR ====================

export const API_KEY_HEADER = 'x-api-key';

export function ApiKeyAuth() {
  return applyDecorators(
    ApiHeader({
      name: API_KEY_HEADER,
      description: 'API Key for authentication',
      required: true,
    }),
  );
}

export const ApiKey = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers[API_KEY_HEADER] || '';
});

// ==================== PERMISSIONS DECORATOR ====================

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// ==================== RATE LIMIT DECORATOR ====================

export const RATE_LIMIT_KEY = 'rateLimit';
export interface RateLimitOptions {
  limit: number;
  ttl: number;
}
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

// ==================== CACHE DECORATOR ====================

export const CACHE_KEY_METADATA = 'cacheKey';
export const CACHE_TTL_METADATA = 'cacheTTL';

export function CacheKey(key: string) {
  return SetMetadata(CACHE_KEY_METADATA, key);
}

export function CacheTTL(ttl: number) {
  return SetMetadata(CACHE_TTL_METADATA, ttl);
}

// ==================== AUDIT LOG DECORATOR ====================

export const AUDIT_LOG_KEY = 'auditLog';
export interface AuditLogOptions {
  action: string;
  resource: string;
}
export const AuditLog = (options: AuditLogOptions) => SetMetadata(AUDIT_LOG_KEY, options);
