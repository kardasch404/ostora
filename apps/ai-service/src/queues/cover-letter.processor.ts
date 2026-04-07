import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { PromptType } from '../prompt-builder/prompt-type.enum';

export interface CoverLetterJob {
  userId: string;
  cvText?: string;
  jobDescription: string;
  companyName: string;
  jobTitle?: string;
  language?: 'en' | 'fr' | 'de';
  tone?: string;
  bundleId?: string;
  renderPdf?: boolean;
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
    this.logger.log(`[AI] Generating cover letter for user ${job.data.userId}`);

    try {
      // Step 1: Generate cover letter text using AI
      const systemPrompt = this.promptBuilder.getSystemPrompt(
        PromptType.GENERATE_COVER_LETTER,
        job.data.language || 'en',
      );

      const prompt = this.promptBuilder.buildGenerateCoverLetterPrompt(
        {
          job: {
            title: job.data.jobTitle || 'Position',
            company: job.data.companyName,
            description: job.data.jobDescription,
          },
          userProfile: {
            firstName: 'Candidate',
            lastName: '',
          },
          cvText: job.data.cvText,
        },
        job.data.language || 'en',
      );

      const generatedText = await this.tokenRouter.route(
        TaskType.COVER_LETTER_BATCH,
        TaskPriority.BACKGROUND,
        prompt,
        { systemPrompt, maxTokens: 1000 },
      );

      this.logger.log(`[AI] Cover letter text generated for user ${job.data.userId}`);

      // Step 2: If renderPdf is true, call ostoracv-service to render PDF
      let pdfResult = null;
      if (job.data.renderPdf !== false) {
        try {
          pdfResult = await this.renderCoverLetterPdf(
            job.data.userId,
            generatedText,
            job.data.language || 'en',
            job.data.bundleId,
          );
          this.logger.log(`[AI] PDF rendered for user ${job.data.userId}: ${pdfResult.s3Key}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`[AI] PDF rendering failed for user ${job.data.userId}: ${errorMessage}`);
        }
      }

      return {
        userId: job.data.userId,
        coverLetterText: generatedText,
        wordCount: generatedText.split(' ').length,
        timestamp: Date.now(),
        pdf: pdfResult,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[AI] Cover letter generation failed for user ${job.data.userId}: ${errorMessage}`);
      throw error;
    }
  }

  private async renderCoverLetterPdf(
    userId: string,
    generatedText: string,
    language: string,
    bundleId?: string,
  ): Promise<any> {
    const ostoracvUrl = process.env.OSTORACV_SERVICE_URL || 'http://ostoracv-service:4731';
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

    const response = await axios.post(
      `${ostoracvUrl}/api/v1/internal/render-cover-letter`,
      {
        userId,
        lang: language,
        generatedText,
        bundleId,
        mode: 'ai-assisted',
      },
      {
        headers: {
          'x-internal-secret': internalSecret,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    return response.data;
  }
}
