import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlazeAiProvider } from './blazeai.provider';
import { OllamaProvider } from './ollama.provider';
import { GenerateOptions } from './provider.interface';

export enum TaskPriority {
  REALTIME = 'realtime',
  BACKGROUND = 'background',
}

export enum TaskType {
  REALTIME_CHAT = 'realtime_chat',
  INTENT_DETECTION = 'intent_detection',
  EMAIL_GENERATION = 'email_generation',
  CV_QUICK_SCORE = 'cv_quick_score',
  BULK_CV_ANALYSIS = 'bulk_cv_analysis',
  COVER_LETTER_BATCH = 'cover_letter_batch',
  JOB_MATCHING = 'job_matching',
  PROFILE_OPTIMIZATION = 'profile_optimization',
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  B2B = 'B2B',
}

@Injectable()
export class TokenRouterService {
  private readonly logger = new Logger(TokenRouterService.name);
  private readonly redis: Redis;
  private readonly dailyQuota: number;
  private readonly quotaThreshold: number;

  constructor(
    private configService: ConfigService,
    private blazeAiProvider: BlazeAiProvider,
    private ollamaProvider: OllamaProvider,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
    this.dailyQuota = this.configService.get('BLAZEAI_DAILY_QUOTA', 1000);
    this.quotaThreshold = this.configService.get('BLAZEAI_QUOTA_THRESHOLD', 950);
  }

  async route(
    taskType: TaskType,
    priority: TaskPriority,
    prompt: string,
    options?: GenerateOptions,
  ): Promise<string> {
    // Background tasks always use Ollama
    if (priority === TaskPriority.BACKGROUND) {
      this.logger.log(`Background task ${taskType} → OllamaProvider`);
      return await this.ollamaProvider.generate(prompt, options);
    }

    // Check quota for realtime tasks
    const usedToday = await this.getUsedCredits();
    if (usedToday >= this.quotaThreshold) {
      this.logger.warn(`Quota protection: ${usedToday}/${this.dailyQuota} → OllamaProvider`);
      return await this.ollamaProvider.generate(prompt, options);
    }

    // Try BlazeAI for realtime tasks
    try {
      this.logger.log(`Realtime task ${taskType} → BlazeAIProvider`);
      const result = await this.blazeAiProvider.generate(prompt, options);
      
      // Increment credits and set expiry
      const today = new Date().toISOString().split('T')[0];
      const key = `blazeai:credits:used:${today}`;
      await this.redis.incr(key);
      
      // Set expiry to end of day
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const secondsUntilEndOfDay = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      await this.redis.expire(key, secondsUntilEndOfDay);
      
      return result;
    } catch (error: unknown) {
      // Fallback on 429 or 5xx errors
      if (this.shouldFallback(error)) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`BlazeAI unavailable (${errorMessage}), routing to Ollama`);
        return await this.ollamaProvider.generate(prompt, options);
      }
      throw error;
    }
  }

  private async getUsedCredits(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `blazeai:credits:used:${today}`;
    const credits = await this.redis.get(key);
    return credits ? parseInt(credits, 10) : 0;
  }

private shouldFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
    return message.includes('429') || message.includes('5') && (message.includes('500') || message.includes('502') || message.includes('503'));
  }

  async getRemainingCredits(): Promise<number> {
    const used = await this.getUsedCredits();
    return Math.max(0, this.dailyQuota - used);
  }
}
