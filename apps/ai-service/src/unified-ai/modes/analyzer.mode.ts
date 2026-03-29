import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../../token-router/token-router.service';
import { PromptBuilderService } from '../../prompt-builder/prompt-builder.service';
import { ParsedCV, JobPost, AnalyzeFitResult, AnalyzeStandaloneResult } from '../../interfaces/analyzer.interface';

@Injectable()
export class AnalyzerMode {
  private readonly logger = new Logger(AnalyzerMode.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  async run(cv: ParsedCV, jobPost?: JobPost): Promise<AnalyzeFitResult | AnalyzeStandaloneResult> {
    if (jobPost) {
      return await this.analyzeFit(cv, jobPost);
    } else {
      return await this.analyzeStandalone(cv);
    }
  }

  private async analyzeFit(cv: ParsedCV, jobPost: JobPost): Promise<AnalyzeFitResult> {
    this.logger.log(`Analyzing CV fit for job: ${jobPost.title}`);

    const prompt = this.buildAnalyzeFitPrompt(cv, jobPost);

    const result = await this.tokenRouter.route(
      TaskType.CV_QUICK_SCORE,
      TaskPriority.REALTIME,
      prompt,
      { temperature: 0.3, maxTokens: 1500 },
    );

    return this.parseAnalyzeFitResult(result);
  }

  private async analyzeStandalone(cv: ParsedCV): Promise<AnalyzeStandaloneResult> {
    this.logger.log('Analyzing CV standalone');

    const prompt = this.buildAnalyzeStandalonePrompt(cv);

    const result = await this.tokenRouter.route(
      TaskType.CV_QUICK_SCORE,
      TaskPriority.REALTIME,
      prompt,
      { temperature: 0.3, maxTokens: 1500 },
    );

    return this.parseAnalyzeStandaloneResult(result);
  }

  private buildAnalyzeFitPrompt(cv: ParsedCV, jobPost: JobPost): string {
    return `You are a senior HR expert. Analyze this CV against the job offer.

CV: ${cv.text}

Job requirements: ${jobPost.description}\n${jobPost.requirements}

Return STRICT JSON:
{
  "matchScore": number 0-100,
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "verdict": string
}`;
  }

  private buildAnalyzeStandalonePrompt(cv: ParsedCV): string {
    return `You are a senior HR expert. Analyze this CV comprehensively.

CV: ${cv.text}

Return STRICT JSON:
{
  "overallScore": number 0-100,
  "skills": string[],
  "experience": string[],
  "suggestions": string[],
  "profileCompleteness": number 0-100
}`;
  }

  private parseAnalyzeFitResult(result: string): AnalyzeFitResult {
    try {
      const parsed = JSON.parse(result);
      return {
        matchScore: parsed.matchScore || 0,
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        missingSkills: parsed.missingSkills || [],
        verdict: parsed.verdict || 'No verdict provided',
      };
    } catch (error) {
      this.logger.error(`Failed to parse analyze fit result: ${error.message}`);
      return this.fallbackParseFit(result);
    }
  }

  private parseAnalyzeStandaloneResult(result: string): AnalyzeStandaloneResult {
    try {
      const parsed = JSON.parse(result);
      return {
        overallScore: parsed.overallScore || 0,
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        suggestions: parsed.suggestions || [],
        profileCompleteness: parsed.profileCompleteness || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to parse standalone result: ${error.message}`);
      return this.fallbackParseStandalone(result);
    }
  }

  private fallbackParseFit(text: string): AnalyzeFitResult {
    return {
      matchScore: this.extractScore(text),
      strengths: this.extractSection(text, 'strength'),
      weaknesses: this.extractSection(text, 'weakness'),
      missingSkills: this.extractSection(text, 'missing'),
      verdict: this.extractVerdict(text),
    };
  }

  private fallbackParseStandalone(text: string): AnalyzeStandaloneResult {
    return {
      overallScore: this.extractScore(text),
      skills: this.extractSection(text, 'skill'),
      experience: this.extractSection(text, 'experience'),
      suggestions: this.extractSection(text, 'suggestion'),
      profileCompleteness: this.extractScore(text),
    };
  }

  private extractScore(text: string): number {
    const match = text.match(/(\d+)\s*\/\s*100|score[:\s]+(\d+)|"matchScore"[:\s]+(\d+)|"overallScore"[:\s]+(\d+)/i);
    if (match) {
      return parseInt(match[1] || match[2] || match[3] || match[4], 10);
    }
    return 0;
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
      if (capturing && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
        section.push(line.trim().substring(1).trim());
      } else if (capturing && section.length > 0 && !line.trim()) {
        break;
      }
    }

    return section;
  }

  private extractVerdict(text: string): string {
    const match = text.match(/verdict[:\s]+"?([^"\n]+)"?/i);
    return match ? match[1].trim() : 'Analysis completed';
  }
}
