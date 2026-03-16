import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions = await this.rbacService.getUserPermissions(user.userId);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = this.rbacService.hasRole(userPermissions, requiredRoles);
      if (!hasRole) {
        throw new ForbiddenException(
          `Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = this.rbacService.hasPermission(
        userPermissions,
        requiredPermissions,
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          `Required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
