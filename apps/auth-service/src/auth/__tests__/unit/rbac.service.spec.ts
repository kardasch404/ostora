import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from '../../services/rbac.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { createMockPrismaService } from '../mocks/prisma.mock';
import { createMockRedisService } from '../mocks/redis.mock';

describe('RbacService', () => {
  let service: RbacService;
  let prisma: any;
  let redis: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: {
      name: 'USER',
      rolePermissions: [
        {
          permission: {
            resource: 'jobs',
            action: 'read',
          },
        },
        {
          permission: {
            resource: 'applications',
            action: 'create',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    redis = createMockRedisService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return cached permissions if available', async () => {
      const cachedData = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read', 'applications:create'],
      };
      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getUserPermissions('user-123');

      expect(result).toEqual(cachedData);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache miss', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      const result = await service.getUserPermissions('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.roles).toEqual(['USER']);
      expect(result.permissions).toContain('jobs:read');
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should cache permissions with 5min TTL', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      await service.getUserPermissions('user-123');

      expect(redis.set).toHaveBeenCalledWith(
        'rbac:user-123',
        expect.any(String),
        300,
      );
    });

    it('should format permissions as resource:action', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      const result = await service.getUserPermissions('user-123');

      expect(result.permissions).toEqual(['jobs:read', 'applications:create']);
    });

    it('should return empty permissions for user without role', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: null });
      redis.set.mockResolvedValue('OK');

      const result = await service.getUserPermissions('user-123');

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should return empty permissions for non-existent user', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserPermissions('non-existent');

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });
  });

  describe('invalidateUserCache', () => {
    it('should delete user cache from Redis', async () => {
      redis.del.mockResolvedValue(1);

      await service.invalidateUserCache('user-123');

      expect(redis.del).toHaveBeenCalledWith('rbac:user-123');
    });
  });

  describe('invalidateRoleCache', () => {
    it('should invalidate cache for all users with role', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ]);
      redis.del.mockResolvedValue(1);

      await service.invalidateRoleCache('USER');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { name: 'USER' } },
        select: { id: true },
      });
      expect(redis.del).toHaveBeenCalledTimes(3);
    });

    it('should handle role with no users', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.invalidateRoleCache('EMPTY_ROLE');

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has required role', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER', 'PREMIUM'],
        permissions: [],
      };

      const result = service.hasRole(userPermissions, ['USER']);

      expect(result).toBe(true);
    });

    it('should return true if user has one of multiple required roles', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: [],
      };

      const result = service.hasRole(userPermissions, ['ADMIN', 'USER']);

      expect(result).toBe(true);
    });

    it('should return false if user lacks required role', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: [],
      };

      const result = service.hasRole(userPermissions, ['ADMIN']);

      expect(result).toBe(false);
    });

    it('should return false for empty roles', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: [],
        permissions: [],
      };

      const result = service.hasRole(userPermissions, ['USER']);

      expect(result).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has all required permissions', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read', 'jobs:apply', 'profile:update'],
      };

      const result = service.hasPermission(userPermissions, ['jobs:read', 'jobs:apply']);

      expect(result).toBe(true);
    });

    it('should return false if user lacks one permission', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      };

      const result = service.hasPermission(userPermissions, ['jobs:read', 'jobs:delete']);

      expect(result).toBe(false);
    });

    it('should return true for empty required permissions', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      };

      const result = service.hasPermission(userPermissions, []);

      expect(result).toBe(true);
    });

    it('should return false for user with no permissions', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: [],
      };

      const result = service.hasPermission(userPermissions, ['jobs:read']);

      expect(result).toBe(false);
    });

    it('should be case-sensitive for permissions', () => {
      const userPermissions = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      };

      const result = service.hasPermission(userPermissions, ['Jobs:Read']);

      expect(result).toBe(false);
    });
  });

  describe('Cache key format', () => {
    it('should use rbac: prefix for cache keys', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      await service.getUserPermissions('user-123');

      expect(redis.get).toHaveBeenCalledWith('rbac:user-123');
    });
  });

  describe('Performance', () => {
    it('should not query database on cache hit', async () => {
      const cachedData = {
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      };
      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      await service.getUserPermissions('user-123');
      await service.getUserPermissions('user-123');
      await service.getUserPermissions('user-123');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(redis.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    it('should handle Redis errors gracefully', async () => {
      redis.get.mockRejectedValue(new Error('Redis error'));
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.getUserPermissions('user-123')).rejects.toThrow('Redis error');
    });

    it('should handle database errors gracefully', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserPermissions('user-123')).rejects.toThrow('Database error');
    });
  });
});
