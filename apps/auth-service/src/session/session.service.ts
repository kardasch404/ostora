import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';

export interface SessionInfo {
  tokenId: string;
  fingerprint: string;
  device: string;
  browser: string;
  ip: string;
  lastSeenAt: Date;
  createdAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private redis: RedisService) {}

  async getAllUserSessions(userId: string): Promise<SessionInfo[]> {
    const pattern = `refresh:${userId}:*`;
    const keys: string[] = [];
    let cursor = '0';

    do {
      const result = await this.redis.scan(cursor, pattern, 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    const sessions: SessionInfo[] = [];

    for (const key of keys) {
      const tokenId = key.split(':')[2];
      const data = await this.redis.get(key);

      if (data) {
        const parsed = JSON.parse(data);

        sessions.push({
          tokenId,
          fingerprint: parsed.fingerprint,
          device: this.extractDevice(parsed.fingerprint),
          browser: this.extractBrowser(parsed.fingerprint),
          ip: parsed.ip || 'unknown',
          lastSeenAt: new Date(),
          createdAt: new Date(parsed.createdAt),
        });
      }
    }

    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async revokeSession(userId: string, tokenId: string): Promise<boolean> {
    const key = `refresh:${userId}:${tokenId}`;
    const exists = await this.redis.exists(key);

    if (exists) {
      await this.redis.del(key);
      return true;
    }

    return false;
  }

  async revokeAllSessions(userId: string): Promise<number> {
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

    return keys.length;
  }

  async blacklistToken(tokenHash: string, ttl: number): Promise<void> {
    await this.redis.set(`blacklist:${tokenHash}`, '1', ttl);
  }

  async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    return this.redis.exists(`blacklist:${tokenHash}`);
  }

  private extractDevice(fingerprint: string): string {
    return 'Desktop';
  }

  private extractBrowser(fingerprint: string): string {
    return 'Chrome';
  }
}
