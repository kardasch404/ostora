import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';
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

  @Process({ concurrency: 1 })
  async handleJobMatching(job: Job<JobMatchingJob>) {
    this.logger.log(`[Ollama] Matching jobs for user ${job.data.userId}`);

    const prompt = this.promptBuilder.buildJobMatchPrompt({
      cvText: job.data.cvText,
      jobs: job.data.jobs,
    });

    const result = await this.tokenRouter.route(
      TaskType.JOB_MATCHING,
      TaskPriority.BACKGROUND,
      prompt,
      { maxTokens: 2000 },
    );

    this.logger.log(`[Ollama] Job matching completed for user ${job.data.userId}`);

    return {
      userId: job.data.userId,
      matches: result,
      jobCount: job.data.jobs.length,
      timestamp: Date.now(),
    };
  }
}
