import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../../token-router/token-router.service';
import { PromptBuilderService } from '../../prompt-builder/prompt-builder.service';
import { PromptType } from '../../prompt-builder/system-prompts.config';

@Injectable()
export class AnalyzerMode {
  private readonly logger = new Logger(AnalyzerMode.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  async analyze(cvText: string, jobDescription: string, language: 'en' | 'fr' | 'de' = 'en') {
    this.logger.log('Running CV analysis mode');

    const systemPrompt = this.promptBuilder.getSystemPrompt(PromptType.CV_ANALYZER, language);
    const prompt = this.promptBuilder.buildCvAnalysisPrompt(cvText, jobDescription);

    const result = await this.tokenRouter.route(
      TaskType.CV_QUICK_SCORE,
      TaskPriority.REALTIME,
      prompt,
      { systemPrompt, maxTokens: 1000, language },
    );

    return this.parseAnalysis(result);
  }

  async analyzeGapOnly(cvText: string, jobDescription: string, language: 'en' | 'fr' | 'de' = 'en') {
    this.logger.log('Running missing skills analysis');

    const prompt = `Identify missing skills between CV and job requirements.\n\nCV:\n${cvText}\n\nJob:\n${jobDescription}\n\nList only missing skills.`;

    const result = await this.tokenRouter.route(
      TaskType.CV_QUICK_SCORE,
      TaskPriority.REALTIME,
      prompt,
      { maxTokens: 500, language },
    );

    return {
      missingSkills: result.split('\n').filter(s => s.trim()),
      raw: result,
    };
  }

  private parseAnalysis(rawResult: string) {
    return {
      raw: rawResult,
      matchScore: this.extractScore(rawResult),
      strengths: this.extractSection(rawResult, 'strengths'),
      missingSkills: this.extractSection(rawResult, 'missing'),
      suggestions: this.extractSection(rawResult, 'suggestions'),
    };
  }

  private extractScore(text: string): number {
    const match = text.match(/(\d+)\/100|score[:\s]+(\d+)/i);
    return match ? parseInt(match[1] || match[2], 10) : 0;
  }

  private extractSection(text: string, keyword: string): string[] {
    const lines = text.split('\n');
    const section = [];
    let capturing = false;

    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        capturing = true;
        continue;
      }
      if (capturing && line.trim().startsWith('-')) {
        section.push(line.trim().substring(1).trim());
      } else if (capturing && section.length > 0) {
        break;
      }
    }

    return section;
  }
}
