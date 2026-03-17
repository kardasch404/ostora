// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenPair } from '../interfaces/token-pair.interface';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

@Injectable()
export class TokenService {
  private readonly REFRESH_TOKEN_TTL = 604800; // 7 days
  private readonly ACCESS_TOKEN_TTL = 900; // 15 minutes

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    permissions: string[],
    fingerprint: string,
  ): Promise<TokenPair> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      permissions,
      fingerprint,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
      algorithm: 'RS256',
      issuer: 'ostora-auth-service',
      audience: 'ostora-platform',
    });

    // Generate opaque refresh token (UUID v4)
    const refreshToken = uuidv4();
    const tokenId = uuidv4();

    // Hash refresh token with SHA-256
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Store hashed token in Redis with 7d TTL
    await this.redis.set(
      `refresh:${userId}:${tokenId}`,
      JSON.stringify({
        hash: tokenHash,
        fingerprint,
        createdAt: new Date().toISOString(),
      }),
      this.REFRESH_TOKEN_TTL,
    );

    return {
      accessToken,
      refreshToken: `${tokenId}.${refreshToken}`,
      expiresIn: this.ACCESS_TOKEN_TTL,
    };
  }

  async validateRefreshToken(
    token: string,
    fingerprint: string,
  ): Promise<{ userId: string; tokenId: string } | null> {
    // Parse token (format: tokenId.refreshToken)
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [tokenId, refreshToken] = parts;

    // Hash the provided refresh token
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Find token in Redis by scanning keys
    const pattern = `refresh:*:${tokenId}`;
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await this.redis.scan(cursor, pattern, 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return null;
    }

    const key = keys[0];
    const userId = key.split(':')[1];

    const storedData = await this.redis.get(key);
    if (!storedData) {
      return null;
    }

    const { hash, fingerprint: storedFingerprint } = JSON.parse(storedData);

    // Validate hash
    if (hash !== tokenHash) {
      return null;
    }

    // Validate fingerprint
    if (storedFingerprint !== fingerprint) {
      return null;
    }

    return { userId, tokenId };
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh:${userId}:*`;
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await this.redis.scan(cursor, pattern, 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)));
    }
  }
}
