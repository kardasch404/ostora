import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../services/token.service';
import { RedisService } from '../../../redis/redis.service';
import { createMockRedisService } from '../mocks/redis.mock';

describe.skip('TokenService', () => {
  let service: TokenService;
  let jwtService: any;
  let redis: any;
  let configService: any;

  beforeEach(async () => {
    redis = createMockRedisService();
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_ACCESS_EXPIRY: '15m',
          JWT_REFRESH_EXPIRY: '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      redis.set.mockResolvedValue('OK');

      const result = await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should include user roles in JWT payload', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER',
        }),
        expect.any(Object),
      );
    });

    it('should include permissions in JWT payload', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: ['jobs:read'],
        }),
        expect.any(Object),
      );
    });

    it('should include fingerprint in JWT payload', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          fingerprint: 'fingerprint-123',
        }),
        expect.any(Object),
      );
    });

    it('should store refresh token in Redis with 7d TTL', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:user-123:'),
        expect.any(String),
        604800,
      );
    });

    it('should hash refresh token with SHA-256', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      const storedData = JSON.parse(redis.set.mock.calls[0][1]);
      expect(storedData.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return refresh token in format tokenId.token', async () => {
      redis.set.mockResolvedValue('OK');

      const result = await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(result.refreshToken).toMatch(/^[a-f0-9-]+\.[a-f0-9-]+$/);
    });

    it('should use RS256 algorithm for JWT', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          algorithm: 'RS256',
        }),
      );
    });

    it('should set JWT issuer', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          issuer: 'ostora-auth-service',
        }),
      );
    });

    it('should set JWT audience', async () => {
      redis.set.mockResolvedValue('OK');

      await service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          audience: 'ostora-platform',
        }),
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate valid refresh token', async () => {
      const token = 'token-id.refresh-token';
      redis.scan.mockResolvedValue(['0', ['refresh:user-123:token-id']]);
      redis.get.mockResolvedValue(
        JSON.stringify({
          hash: 'a'.repeat(64),
          fingerprint: 'fingerprint-123',
        }),
      );

      const crypto = require('crypto');
      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('a'.repeat(64)),
      });

      const result = await service.validateRefreshToken(token, 'fingerprint-123');

      expect(result).toEqual({
        userId: 'user-123',
        tokenId: 'token-id',
      });
    });

    it('should reject malformed token', async () => {
      const result = await service.validateRefreshToken('malformed', 'fingerprint-123');

      expect(result).toBeNull();
    });

    it('should reject token with wrong fingerprint', async () => {
      const token = 'token-id.refresh-token';
      redis.scan.mockResolvedValue(['0', ['refresh:user-123:token-id']]);
      redis.get.mockResolvedValue(
        JSON.stringify({
          hash: 'a'.repeat(64),
          fingerprint: 'different-fingerprint',
        }),
      );

      const result = await service.validateRefreshToken(token, 'fingerprint-123');

      expect(result).toBeNull();
    });

    it('should reject token not found in Redis', async () => {
      const token = 'token-id.refresh-token';
      redis.scan.mockResolvedValue(['0', []]);

      const result = await service.validateRefreshToken(token, 'fingerprint-123');

      expect(result).toBeNull();
    });

    it('should reject token with invalid hash', async () => {
      const token = 'token-id.refresh-token';
      redis.scan.mockResolvedValue(['0', ['refresh:user-123:token-id']]);
      redis.get.mockResolvedValue(
        JSON.stringify({
          hash: 'wrong-hash',
          fingerprint: 'fingerprint-123',
        }),
      );

      const result = await service.validateRefreshToken(token, 'fingerprint-123');

      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete token from Redis', async () => {
      redis.del.mockResolvedValue(1);

      await service.revokeRefreshToken('user-123', 'token-id');

      expect(redis.del).toHaveBeenCalledWith('refresh:user-123:token-id');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all user tokens from Redis', async () => {
      redis.scan.mockResolvedValue([
        '0',
        ['refresh:user-123:token-1', 'refresh:user-123:token-2'],
      ]);
      redis.del.mockResolvedValue(1);

      await service.revokeAllUserTokens('user-123');

      expect(redis.del).toHaveBeenCalledTimes(2);
    });

    it('should handle no tokens gracefully', async () => {
      redis.scan.mockResolvedValue(['0', []]);

      await service.revokeAllUserTokens('user-123');

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should scan with correct pattern', async () => {
      redis.scan.mockResolvedValue(['0', []]);

      await service.revokeAllUserTokens('user-123');

      expect(redis.scan).toHaveBeenCalledWith('0', 'refresh:user-123:*', 100);
    });
  });

  describe('Edge cases', () => {
    it('should handle Redis connection errors', async () => {
      redis.set.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.generateTokenPair('user-123', 'test@example.com', 'USER', ['jobs:read'], 'fingerprint-123'),
      ).rejects.toThrow('Redis error');
    });
  });
});
