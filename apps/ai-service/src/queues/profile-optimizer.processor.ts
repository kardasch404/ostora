import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TokenRouterService, TaskType, UserPlan } from '../token-router/token-router.service';

export interface ProfileOptimizationJob {
  userId: string;
  profileData: any;
  targetRole: string;
}

@Processor('profile-optimizer')
export class ProfileOptimizerProcessor {
  private readonly logger = new Logger(ProfileOptimizerProcessor.name);

  constructor(private tokenRouter: TokenRouterService) {}

  @Process({ concurrency: 1 })
  async handleProfileOptimization(job: Job<ProfileOptimizationJob>) {
    this.logger.log(`[Ollama] Optimizing profile for user ${job.data.userId}`);

    const prompt = `Optimize this profile for ${job.data.targetRole}:\n${JSON.stringify(job.data.profileData, null, 2)}`;

    const result = await this.tokenRouter.route(
      TaskType.PROFILE_OPTIMIZATION,
      UserPlan.FREE,
      prompt,
      { maxTokens: 1500 },
    );

    this.logger.log(`[Ollama] Profile optimization completed for user ${job.data.userId}`);

    return {
      userId: job.data.userId,
      optimizedProfile: result,
      targetRole: job.data.targetRole,
      timestamp: Date.now(),
    };
  }
}
