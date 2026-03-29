import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TokenRouterService, TaskType, UserPlan } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { PromptType } from '../prompt-builder/system-prompts.config';

export interface CoverLetterJob {
  userId: string;
  cvText: string;
  jobDescription: string;
  companyName: string;
  language?: 'en' | 'fr' | 'de';
}

@Processor('cover-letter')
export class CoverLetterProcessor {
  private readonly logger = new Logger(CoverLetterProcessor.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  @Process({ concurrency: 1 })
  async handleCoverLetter(job: Job<CoverLetterJob>) {
    this.logger.log(`[Ollama] Generating cover letter for user ${job.data.userId}`);

    const systemPrompt = this.promptBuilder.getSystemPrompt(
      PromptType.COVER_LETTER,
      job.data.language || 'en',
    );

    const prompt = this.promptBuilder.buildCoverLetterPrompt(
      job.data.cvText,
      job.data.jobDescription,
      job.data.companyName,
    );

    const result = await this.tokenRouter.route(
      TaskType.COVER_LETTER_BATCH,
      UserPlan.FREE,
      prompt,
      { systemPrompt, maxTokens: 1000 },
    );

    this.logger.log(`[Ollama] Cover letter completed for user ${job.data.userId}`);

    return {
      userId: job.data.userId,
      coverLetter: result,
      wordCount: result.split(' ').length,
      timestamp: Date.now(),
    };
  }
}
