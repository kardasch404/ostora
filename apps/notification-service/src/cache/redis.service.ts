import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env['REDIS_URL'] || 'redis://localhost:6345',
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    await this.client.connect();
  }

  // Preferences caching
  async cachePreferences(userId: string, preferences: any, ttl: number = 3600) {
    const key = `notif-prefs:${userId}`;
    await this.client.setEx(key, ttl, JSON.stringify(preferences));
  }

  async getCachedPreferences(userId: string): Promise<any | null> {
    const key = `notif-prefs:${userId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidatePreferences(userId: string) {
    const key = `notif-prefs:${userId}`;
    await this.client.del(key);
  }

  // Unread count caching
  async setUnreadCount(userId: string, count: number) {
    const key = `unread-count:${userId}`;
    await this.client.set(key, count.toString());
  }

  async getUnreadCount(userId: string): Promise<number | null> {
    const key = `unread-count:${userId}`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : null;
  }

  async incrementUnreadCount(userId: string): Promise<number> {
    const key = `unread-count:${userId}`;
    return await this.client.incr(key);
  }

  async decrementUnreadCount(userId: string): Promise<number> {
    const key = `unread-count:${userId}`;
    const current = await this.getUnreadCount(userId);
    if (current && current > 0) {
      return await this.client.decr(key);
    }
    return 0;
  }

  async resetUnreadCount(userId: string) {
    const key = `unread-count:${userId}`;
    await this.client.set(key, '0');
  }

  // Generic cache operations
  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Cleanup on module destroy
  async onModuleDestroy() {
    await this.client.quit();
  }
}
