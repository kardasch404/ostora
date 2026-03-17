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
import * as bcrypt from 'bcrypt';

describe('AuthService - Login', () => {
  let service: AuthService;
  let prisma: any;
  let redis: any;
  let tokenService: any;
  let auditService: any;
  let eventPublisher: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    emailVerified: true,
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    deviceFingerprint: null,
    loginAttempts: 0,
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
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
    redis = createMockRedisService();

    tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      }),
    };

    auditService = {
      logLoginFailed: jest.fn(),
      logLoginSuccess: jest.fn(),
      logNewDevice: jest.fn(),
      logAccountLock: jest.fn(),
    };

    eventPublisher = {
      publishUserLogin: jest.fn(),
      publishNewDeviceLogin: jest.fn(),
      publishAccountLocked: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: TokenService, useValue: tokenService },
        { provide: SessionService, useValue: {} },
        { provide: AuditService, useValue: auditService },
        { provide: AuthEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful login', () => {
    it('should login with correct credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.del.mockResolvedValue(1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(
        { email: 'test@example.com', password: 'Password123!' },
        mockRequest,
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            loginAttempts: 0,
          }),
        }),
      );
    });

    it('should clear failed login attempts on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.del.mockResolvedValue(1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login(
        { email: 'test@example.com', password: 'Password123!' },
        mockRequest,
      );

      expect(redis.del).toHaveBeenCalledWith('failed-login:user-123');
    });

    it('should publish login event', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login(
        { email: 'test@example.com', password: 'Password123!' },
        mockRequest,
      );

      expect(eventPublisher.publishUserLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
        }),
      );
    });
  });

  describe('Failed login - wrong password', () => {
    it('should reject wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'WrongPassword!' },
          mockRequest,
        ),
      ).rejects.toThrow();
    });

    it('should increment failed login attempts', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'WrongPassword!' },
          mockRequest,
        ),
      ).rejects.toThrow();

      expect(redis.incr).toHaveBeenCalledWith('failed-login:user-123');
    });

    it('should log failed login attempt', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'WrongPassword!' },
          mockRequest,
        ),
      ).rejects.toThrow();

      expect(auditService.logLoginFailed).toHaveBeenCalled();
    });
  });

  describe('Account lockout', () => {
    it('should lock account after 5 failed attempts', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(5);
      redis.set.mockResolvedValue('OK');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'WrongPassword!' },
          mockRequest,
        ),
      ).rejects.toThrow();

      expect(redis.set).toHaveBeenCalledWith('lockout:user-123', '1', 900);
      expect(eventPublisher.publishAccountLocked).toHaveBeenCalled();
    });

    it('should reject login when account is locked', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.exists.mockResolvedValue(true);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow();
    });
  });

  describe('User not found', () => {
    it('should reject login for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(
          { email: 'nonexistent@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow();
    });
  });

  describe('Email not verified', () => {
    it('should reject login if email not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      prisma.user.findUnique.mockResolvedValue(unverifiedUser);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow('Please verify your email before logging in');
    });
  });

  describe('Account status', () => {
    it('should reject login for inactive account', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow('Account is not active');
    });

    it('should reject login for suspended account', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      prisma.user.findUnique.mockResolvedValue(suspendedUser);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow('Account is not active');
    });
  });

  describe('2FA flow', () => {
    it('should require 2FA code when enabled', async () => {
      const user2FA = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'secret' };
      prisma.user.findUnique.mockResolvedValue(user2FA);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!' },
          mockRequest,
        ),
      ).rejects.toThrow();
    });

    it('should reject invalid 2FA code', async () => {
      const user2FA = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'secret' };
      prisma.user.findUnique.mockResolvedValue(user2FA);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const speakeasy = require('speakeasy');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'Password123!', totpCode: '123456' },
          mockRequest,
        ),
      ).rejects.toThrow('Invalid 2FA code');
    });

    it('should accept valid 2FA code', async () => {
      const user2FA = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'secret' };
      prisma.user.findUnique.mockResolvedValue(user2FA);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const speakeasy = require('speakeasy');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.login(
        { email: 'test@example.com', password: 'Password123!', totpCode: '123456' },
        mockRequest,
      );

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('New device detection', () => {
    it('should detect new device login', async () => {
      const userWithDevice = { ...mockUser, deviceFingerprint: 'old-fingerprint' };
      prisma.user.findUnique.mockResolvedValue(userWithDevice);
      redis.exists.mockResolvedValue(false);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login(
        { email: 'test@example.com', password: 'Password123!' },
        mockRequest,
      );

      expect(eventPublisher.publishNewDeviceLogin).toHaveBeenCalled();
      expect(auditService.logNewDevice).toHaveBeenCalled();
    });
  });
});
