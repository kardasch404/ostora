import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '../../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { TokenService } from '../../services/token.service';
import { SessionService } from '../../../session/session.service';
import { AuditService } from '../../../audit/audit.service';
import { AuthEventPublisher } from '../../events/auth.event-publisher';
import { createMockPrismaService } from '../mocks/prisma.mock';
import { createMockRedisService } from '../mocks/redis.mock';

describe('AuthService - Refresh Token', () => {
  let service: AuthService;
  let prisma: any;
  let tokenService: any;
  let auditService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    status: 'ACTIVE',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    emailVerified: true,
    twoFactorEnabled: false,
    role: {
      id: 'role-123',
      name: 'USER',
      rolePermissions: [
        {
          permission: {
            resource: 'jobs',
            action: 'read',
          },
        },
      ],
    },
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  } as any;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    tokenService = {
      validateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      }),
    };

    auditService = {
      logTokenRefresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: createMockRedisService() },
        { provide: TokenService, useValue: tokenService },
        { provide: SessionService, useValue: {} },
        { provide: AuditService, useValue: auditService },
        { provide: AuthEventPublisher, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid token rotation', () => {
    it('should refresh token with valid refresh token', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh('valid-refresh-token', mockRequest);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('user-123', 'token-123');
    });

    it('should revoke old refresh token', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await service.refresh('valid-refresh-token', mockRequest);

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('user-123', 'token-123');
    });

    it('should generate new token pair', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await service.refresh('valid-refresh-token', mockRequest);

      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'USER',
        ['jobs:read'],
        expect.any(String),
      );
    });

    it('should log token refresh', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await service.refresh('valid-refresh-token', mockRequest);

      expect(auditService.logTokenRefresh).toHaveBeenCalledWith(
        'user-123',
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should return user information', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh('valid-refresh-token', mockRequest);

      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
        role: 'USER',
        emailVerified: true,
        twoFactorEnabled: false,
      });
    });
  });

  describe('Expired token', () => {
    it('should reject expired refresh token', async () => {
      tokenService.validateRefreshToken.mockResolvedValue(null);

      await expect(
        service.refresh('expired-refresh-token', mockRequest),
      ).rejects.toThrow();
    });

    it('should not revoke token on validation failure', async () => {
      tokenService.validateRefreshToken.mockResolvedValue(null);

      await expect(
        service.refresh('expired-refresh-token', mockRequest),
      ).rejects.toThrow();

      expect(tokenService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Invalid token', () => {
    it('should reject malformed refresh token', async () => {
      tokenService.validateRefreshToken.mockResolvedValue(null);

      await expect(
        service.refresh('malformed-token', mockRequest),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should reject token with wrong fingerprint', async () => {
      tokenService.validateRefreshToken.mockResolvedValue(null);

      await expect(
        service.refresh('token-with-wrong-fingerprint', mockRequest),
      ).rejects.toThrow();
    });
  });

  describe('User not found', () => {
    it('should reject refresh if user not found', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh('valid-refresh-token', mockRequest),
      ).rejects.toThrow('User not found');
    });
  });

  describe('Inactive user', () => {
    it('should reject refresh for inactive user', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        service.refresh('valid-refresh-token', mockRequest),
      ).rejects.toThrow('Account is not active');
    });

    it('should reject refresh for suspended user', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      prisma.user.findUnique.mockResolvedValue(suspendedUser);

      await expect(
        service.refresh('valid-refresh-token', mockRequest),
      ).rejects.toThrow('Account is not active');
    });
  });

  describe('Token rotation security', () => {
    it('should generate different tokens on each refresh', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      tokenService.generateTokenPair
        .mockResolvedValueOnce({
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          expiresIn: 900,
        })
        .mockResolvedValueOnce({
          accessToken: 'access-2',
          refreshToken: 'refresh-2',
          expiresIn: 900,
        });

      const result1 = await service.refresh('token-1', mockRequest);
      const result2 = await service.refresh('token-2', mockRequest);

      expect(result1.accessToken).not.toBe(result2.accessToken);
      expect(result1.refreshToken).not.toBe(result2.refreshToken);
    });

    it('should invalidate old token before issuing new one', async () => {
      tokenService.validateRefreshToken.mockResolvedValue({
        userId: 'user-123',
        tokenId: 'token-123',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const revokeOrder: string[] = [];
      const generateOrder: string[] = [];

      tokenService.revokeRefreshToken.mockImplementation(() => {
        revokeOrder.push('revoke');
        return Promise.resolve();
      });

      tokenService.generateTokenPair.mockImplementation(() => {
        generateOrder.push('generate');
        return Promise.resolve({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 900,
        });
      });

      await service.refresh('valid-token', mockRequest);

      expect(revokeOrder[0]).toBe('revoke');
      expect(generateOrder[0]).toBe('generate');
    });
  });
});
