import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TokenRouterService, TaskType, UserPlan } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { PromptType } from '../prompt-builder/system-prompts.config';

export interface CvAnalysisJob {
  userId: string;
  cvText: string;
  jobDescription: string;
  language?: 'en' | 'fr' | 'de';
}

@Processor('cv-analysis')
export class CvAnalysisProcessor {
  private readonly logger = new Logger(CvAnalysisProcessor.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  @Process({ concurrency: 1 })
  async handleCvAnalysis(job: Job<CvAnalysisJob>) {
    this.logger.log(`[Ollama] Processing CV analysis for user ${job.data.userId}`);

    const systemPrompt = this.promptBuilder.getSystemPrompt(
      PromptType.CV_ANALYZER,
      job.data.language || 'en',
    );

    const prompt = this.promptBuilder.buildCvAnalysisPrompt(
      job.data.cvText,
      job.data.jobDescription,
    );

    const result = await this.tokenRouter.route(
      TaskType.BULK_CV_ANALYSIS,
      UserPlan.FREE,
      prompt,
      { systemPrompt, maxTokens: 1500 },
    );

    this.logger.log(`[Ollama] CV analysis completed for user ${job.data.userId}`);

    return {
      userId: job.data.userId,
      analysis: result,
      timestamp: Date.now(),
    };
  }
}
