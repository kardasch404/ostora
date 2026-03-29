import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TokenRouterService, TaskType, UserPlan } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';

export interface JobMatchingJob {
  userId: string;
  cvText: string;
  jobs: Array<{ id: string; title: string; company: string; description: string }>;
}

@Processor('job-matching')
export class JobMatchingProcessor {
  private readonly logger = new Logger(JobMatchingProcessor.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  @Process()
  async handleJobMatching(job: Job<JobMatchingJob>) {
    this.logger.log(`Matching jobs for user ${job.data.userId}`);

    const prompt = this.promptBuilder.buildJobMatchPrompt(
      job.data.cvText,
      job.data.jobs,
    );

    const result = await this.tokenRouter.route(
      TaskType.JOB_MATCHING,
      UserPlan.FREE,
      prompt,
      { maxTokens: 1500 },
    );

    return {
      userId: job.data.userId,
      matches: result,
      timestamp: Date.now(),
    };
  }
}
