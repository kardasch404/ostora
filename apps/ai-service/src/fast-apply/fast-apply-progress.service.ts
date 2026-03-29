import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class FastApplyProgressService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async initBatch(batchId: string, totalJobs: number): Promise<void> {
    const key = `batch:${batchId}`;
    await this.redis.hset(key, {
      total: totalJobs,
      completed: 0,
      failed: 0,
      status: 'processing',
      startTime: Date.now(),
    });
    await this.redis.expire(key, 86400);
  }

  async incrementCompleted(batchId: string): Promise<void> {
    const key = `batch:${batchId}`;
    await this.redis.hincrby(key, 'completed', 1);
    
    const total = parseInt(await this.redis.hget(key, 'total'), 10);
    const completed = parseInt(await this.redis.hget(key, 'completed'), 10);
    
    if (completed >= total) {
      await this.redis.hset(key, 'status', 'completed');
      await this.redis.hset(key, 'endTime', Date.now());
    }
  }

  async incrementFailed(batchId: string): Promise<void> {
    const key = `batch:${batchId}`;
    await this.redis.hincrby(key, 'failed', 1);
  }

  async getProgress(batchId: string) {
    const key = `batch:${batchId}`;
    const data = await this.redis.hgetall(key);
    
    if (!data || !data.total) {
      return null;
    }

    return {
      batchId,
      total: parseInt(data.total, 10),
      completed: parseInt(data.completed, 10),
      failed: parseInt(data.failed, 10),
      status: data.status,
      progress: Math.round((parseInt(data.completed, 10) / parseInt(data.total, 10)) * 100),
      startTime: parseInt(data.startTime, 10),
      endTime: data.endTime ? parseInt(data.endTime, 10) : null,
    };
  }
}
