import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY, ROLES_KEY, PERMISSIONS_KEY } from '@ostora/shared-decorators';

// ==================== JWT AUTH GUARD ====================

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // TODO: Implement JWT validation logic
    // This will be filled in Day 2 when auth-service is implemented
    // For now, return true to allow development
    const request = context.switchToHttp().getRequest();
    
    // Stub: Extract token from header
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      // In development, allow requests without token
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }

    // TODO: Validate JWT token with auth-service
    // TODO: Attach user to request object
    // request.user = decodedToken;

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// ==================== ROLES GUARD ====================

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // TODO: Implement role checking logic
    // This will be filled in Day 2 when auth-service is implemented
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // In development, allow requests without user
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }

    // TODO: Check if user has required roles
    // return requiredRoles.some((role) => user.roles?.includes(role));

    return true;
  }
}

// ==================== PERMISSIONS GUARD ====================

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // TODO: Implement permission checking logic
    // This will be filled in Day 2 when auth-service is implemented
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // In development, allow requests without user
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }

    // TODO: Check if user has required permissions
    // return requiredPermissions.every((permission) => user.permissions?.includes(permission));

    return true;
  }
}

// ==================== API KEY GUARD ====================

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return false;
    }

    // TODO: Validate API key with database
    // This will be filled when B2B service is implemented
    
    // In development, accept any API key
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return false;
  }
}
