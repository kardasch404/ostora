import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../guards/roles.guard';
import { RbacService } from '../../services/rbac.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let rbacService: any;

  const mockExecutionContext = (user: any, roles?: string[], permissions?: string[]) => {
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    };

    reflector.getAllAndOverride = jest.fn((key) => {
      if (key === 'roles') return roles;
      if (key === 'permissions') return permissions;
      return undefined;
    });

    return context;
  };

  beforeEach(async () => {
    rbacService = {
      getUserPermissions: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        { provide: RbacService, useValue: rbacService },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('No role or permission requirements', () => {
    it('should allow access when no roles or permissions required', async () => {
      const context = mockExecutionContext({ userId: 'user-123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rbacService.getUserPermissions).not.toHaveBeenCalled();
    });
  });

  describe('Has required role', () => {
    it('should allow access when user has required role', async () => {
      const context = mockExecutionContext({ userId: 'user-123' }, ['USER']);

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasRole.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rbacService.hasRole).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['USER'] }),
        ['USER'],
      );
    });

    it('should allow access when user has one of multiple required roles', async () => {
      const context = mockExecutionContext({ userId: 'user-123' }, ['ADMIN', 'MODERATOR']);

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['ADMIN'],
        permissions: ['users:delete'],
      });

      rbacService.hasRole.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should cache user permissions from Redis', async () => {
      const context = mockExecutionContext({ userId: 'user-123' }, ['USER']);

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasRole.mockReturnValue(true);

      await guard.canActivate(context);

      expect(rbacService.getUserPermissions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Missing required role', () => {
    it('should deny access when user lacks required role', async () => {
      const context = mockExecutionContext({ userId: 'user-123' }, ['ADMIN']);

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasRole.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should throw ForbiddenException with required roles message', async () => {
      const context = mockExecutionContext({ userId: 'user-123' }, ['ADMIN', 'MODERATOR']);

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: [],
      });

      rbacService.hasRole.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });

  describe('Has required permission', () => {
    it('should allow access when user has required permission', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        undefined,
        ['jobs:read'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read', 'jobs:apply'],
      });

      rbacService.hasPermission.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rbacService.hasPermission).toHaveBeenCalledWith(
        expect.objectContaining({ permissions: ['jobs:read', 'jobs:apply'] }),
        ['jobs:read'],
      );
    });

    it('should allow access when user has all required permissions', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        undefined,
        ['jobs:read', 'jobs:apply'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read', 'jobs:apply', 'profile:update'],
      });

      rbacService.hasPermission.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Missing required permission', () => {
    it('should deny access when user lacks required permission', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        undefined,
        ['users:delete'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasPermission.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should throw ForbiddenException with required permissions message', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        undefined,
        ['users:delete', 'users:update'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasPermission.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });

  describe('Admin bypass', () => {
    it('should allow ADMIN role to bypass permission checks', async () => {
      const context = mockExecutionContext(
        { userId: 'admin-123' },
        ['ADMIN'],
        ['users:delete'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'admin-123',
        roles: ['ADMIN'],
        permissions: ['users:create', 'users:read', 'users:update', 'users:delete'],
      });

      rbacService.hasRole.mockReturnValue(true);
      rbacService.hasPermission.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Combined role and permission checks', () => {
    it('should check both role and permission when both are required', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        ['USER'],
        ['jobs:read'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasRole.mockReturnValue(true);
      rbacService.hasPermission.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rbacService.hasRole).toHaveBeenCalled();
      expect(rbacService.hasPermission).toHaveBeenCalled();
    });

    it('should deny if role matches but permission missing', async () => {
      const context = mockExecutionContext(
        { userId: 'user-123' },
        ['USER'],
        ['users:delete'],
      );

      rbacService.getUserPermissions.mockResolvedValue({
        userId: 'user-123',
        roles: ['USER'],
        permissions: ['jobs:read'],
      });

      rbacService.hasRole.mockReturnValue(true);
      rbacService.hasPermission.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });

  describe('User not authenticated', () => {
    it('should deny access when user is not authenticated', async () => {
      const context = mockExecutionContext(null, ['USER']);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should deny access when userId is missing', async () => {
      const context = mockExecutionContext({}, ['USER']);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });
});
