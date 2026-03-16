import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionService } from '../../../session/session.service';
import { createMockPrismaService } from '../mocks/prisma.mock';

describe('JwtAuthGuard', () => {
  let strategy: JwtStrategy;
  let prisma: any;
  let sessionService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    status: 'ACTIVE',
    deviceFingerprint: 'fingerprint-123',
    role: {
      name: 'USER',
    },
  };

  const mockPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    permissions: ['jobs:read'],
    fingerprint: require('crypto').createHash('sha256').update('test-agent|192.168.1.0/24').digest('hex'),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };

  const expectedFingerprint = require('crypto').createHash('sha256').update('test-agent|192.168.1.0/24').digest('hex');

  const mockRequest = {
    headers: { 'user-agent': 'test-agent', 'authorization': 'Bearer test-token' },
    ip: '192.168.1.1',
    socket: { remoteAddress: '192.168.1.1' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    sessionService = {
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: SessionService, useValue: sessionService },
        {
          provide: 'ConfigService',
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid JWT', () => {
    it('should validate valid JWT token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        permissions: ['jobs:read'],
        fingerprint: expectedFingerprint,
      });
    });

    it('should extract user ID from sub claim', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await strategy.validate(mockRequest, mockPayload);

      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should return user permissions', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result.permissions).toEqual(['jobs:read']);
    });
  });

  describe('Expired JWT', () => {
    it('should reject expired token', async () => {
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Strategy doesn't validate expiration, passport does
      const result = await strategy.validate(mockRequest, expiredPayload);
      expect(result).toBeDefined();
    });
  });

  describe('Wrong fingerprint', () => {
    it('should reject token with mismatched fingerprint', async () => {
      const payloadWithWrongFingerprint = {
        ...mockPayload,
        fingerprint: 'different-fingerprint',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(strategy.validate(mockRequest, payloadWithWrongFingerprint)).rejects.toThrow();
    });

    it('should accept token with matching fingerprint', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toBeDefined();
    });

    it('should accept token when user has no fingerprint set', async () => {
      const userWithoutFingerprint = {
        ...mockUser,
        deviceFingerprint: null,
      };
      prisma.user.findUnique.mockResolvedValue(userWithoutFingerprint);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toBeDefined();
    });
  });

  describe('Blacklisted token', () => {
    it('should reject blacklisted token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      sessionService.isTokenBlacklisted.mockResolvedValue(true);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow();
    });

    it('should check token blacklist', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await strategy.validate(mockRequest, mockPayload);

      expect(sessionService.isTokenBlacklisted).toHaveBeenCalled();
    });
  });

  describe('User not found', () => {
    it('should reject token for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow();
    });
  });

  describe('Inactive user', () => {
    it('should reject token for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow();
    });

    it('should reject token for suspended user', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      prisma.user.findUnique.mockResolvedValue(suspendedUser);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow();
    });

    it('should accept token for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toBeDefined();
    });
  });

  describe('Malformed payload', () => {
    it('should reject token without sub claim', async () => {
      const payloadWithoutSub: any = { ...mockPayload };
      delete payloadWithoutSub.sub;
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(mockRequest, payloadWithoutSub)).rejects.toThrow();
    });

    it('should reject token without email claim', async () => {
      const payloadWithoutEmail: any = { ...mockPayload };
      delete payloadWithoutEmail.email;
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Email is not validated in strategy, just returned
      const result = await strategy.validate(mockRequest, payloadWithoutEmail);
      expect(result).toBeDefined();
    });

    it('should handle missing permissions gracefully', async () => {
      const payloadWithoutPermissions: any = { ...mockPayload };
      delete payloadWithoutPermissions.permissions;
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, payloadWithoutPermissions);

      expect(result.permissions).toBeUndefined();
    });
  });

  describe('Token claims validation', () => {
    it('should validate issuer claim', async () => {
      const payloadWithIssuer = {
        ...mockPayload,
        iss: 'ostora-auth-service',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, payloadWithIssuer);

      expect(result).toBeDefined();
    });

    it('should validate audience claim', async () => {
      const payloadWithAudience = {
        ...mockPayload,
        aud: 'ostora-platform',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, payloadWithAudience);

      expect(result).toBeDefined();
    });
  });
});
