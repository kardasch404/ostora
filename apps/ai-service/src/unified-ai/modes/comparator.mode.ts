import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, UserPlan } from '../../token-router/token-router.service';

@Injectable()
export class ComparatorMode {
  private readonly logger = new Logger(ComparatorMode.name);

  constructor(private tokenRouter: TokenRouterService) {}

  async compare(cvText: string, jobs: any[]) {
    this.logger.log(`Comparing CV against ${jobs.length} jobs`);

    const prompt = `Compare this CV against these jobs and rank them:\n\nCV:\n${cvText}\n\nJobs:\n${jobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company}`).join('\n')}\n\nProvide ranking with match scores.`;

    const result = await this.tokenRouter.route(
      TaskType.JOB_MATCHING,
      UserPlan.PREMIUM,
      prompt,
      { maxTokens: 1500 },
    );

    return {
      ranking: result,
      jobCount: jobs.length,
      timestamp: Date.now(),
    };
  }
}
