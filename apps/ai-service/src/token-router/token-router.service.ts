import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlazeAiProvider } from './blazeai.provider';
import { OllamaProvider } from './ollama.provider';
import { IAiProvider, GenerateOptions } from './provider.interface';

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
    userPlan: UserPlan,
    prompt: string,
    options?: GenerateOptions,
  ): Promise<string> {
    const provider = await this.selectProvider(taskType, userPlan);
    this.logger.log(`Routing ${taskType} to ${provider.constructor.name}`);

    try {
      const result = await provider.generate(prompt, options);

      if (provider instanceof BlazeAiProvider) {
        await this.incrementCredits();
      }

      return result;
    } catch (error) {
      // Fallback to Ollama on BlazeAI errors (429, 5xx)
      if (provider instanceof BlazeAiProvider && this.shouldFallback(error)) {
        this.logger.warn(`BlazeAI failed (${error.message}), falling back to Ollama`);
        return await this.ollamaProvider.generate(prompt, options);
      }
      throw error;
    }
  }

  private async selectProvider(taskType: TaskType, userPlan: UserPlan): Promise<IAiProvider> {
    const usedCredits = await this.getUsedCredits();

    // Force Ollama if quota exceeded
    if (usedCredits >= this.quotaThreshold) {
      this.logger.warn(`BlazeAI quota threshold reached (${usedCredits}/${this.dailyQuota}). Using Ollama.`);
      return this.ollamaProvider;
    }

    // BlazeAI for real-time tasks
    const realtimeTasks = [
      TaskType.REALTIME_CHAT,
      TaskType.INTENT_DETECTION,
      TaskType.EMAIL_GENERATION,
      TaskType.CV_QUICK_SCORE,
    ];

    if (realtimeTasks.includes(taskType)) {
      return this.blazeAiProvider;
    }

    // Ollama for bulk/background tasks
    return this.ollamaProvider;
  }

  private async getUsedCredits(): Promise<number> {
    const date = new Date().toISOString().split('T')[0];
    const key = `blazeai:credits:used:${date}`;
    const credits = await this.redis.get(key);
    return credits ? parseInt(credits, 10) : 0;
  }

  private async incrementCredits(): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `blazeai:credits:used:${date}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // 24 hours
  }

  private shouldFallback(error: any): boolean {
    const message = error.message || '';
    return message.includes('429') || message.includes('5') && (message.includes('500') || message.includes('502') || message.includes('503'));
  }

  async getRemainingCredits(): Promise<number> {
    const used = await this.getUsedCredits();
    return Math.max(0, this.dailyQuota - used);
  }
}
