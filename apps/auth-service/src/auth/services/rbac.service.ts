// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RbacService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'rbac:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return { userId, roles: [], permissions: [] };
    }

    const permissions = user.role.rolePermissions.map(
      (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    const result: UserPermissions = {
      userId,
      roles: [user.role.name],
      permissions,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

    return result;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
  }

  async invalidateRoleCache(roleName: string): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { role: { name: roleName } },
      select: { id: true },
    });

    const deletePromises = users.map((user: any) =>
      this.invalidateUserCache(user.id),
    );

    await Promise.all(deletePromises);
  }

  hasRole(userPermissions: UserPermissions, requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => userPermissions.roles.includes(role));
  }

  hasPermission(
    userPermissions: UserPermissions,
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      userPermissions.permissions.includes(permission),
    );
  }
}
