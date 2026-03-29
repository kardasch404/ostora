import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Controller('ai/result')
export class AiResultController {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  @Get(':jobId')
  async getResult(@Param('jobId') jobId: string) {
    const key = `result:${jobId}`;
    const result = await this.redis.get(key);

    if (!result) {
      return { error: 'Result not found or expired' };
    }

    return JSON.parse(result);
  }
}
