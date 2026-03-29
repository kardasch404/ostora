import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AiUsageService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async checkLimit(userId: string, plan: string): Promise<boolean> {
    const limits = {
      FREE: this.configService.get('RATE_LIMIT_FREE', 10),
      PREMIUM: this.configService.get('RATE_LIMIT_PREMIUM', 100),
      B2B: this.configService.get('RATE_LIMIT_B2B', 1000),
    };

    const limit = limits[plan] || limits.FREE;
    const key = `ai:usage:${userId}:${new Date().toISOString().split('T')[0]}`;
    
    const usage = await this.redis.get(key);
    const currentUsage = usage ? parseInt(usage, 10) : 0;

    return currentUsage < limit;
  }

  async incrementUsage(userId: string): Promise<void> {
    const key = `ai:usage:${userId}:${new Date().toISOString().split('T')[0]}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400);
  }

  async getUsage(userId: string): Promise<number> {
    const key = `ai:usage:${userId}:${new Date().toISOString().split('T')[0]}`;
    const usage = await this.redis.get(key);
    return usage ? parseInt(usage, 10) : 0;
  }
}
