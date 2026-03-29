import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';

export enum AiMode {
  ANALYZE_CV = 'ANALYZE_CV',
  COMPARE_JOB = 'COMPARE_JOB',
  CHAT_ASSIST = 'CHAT_ASSIST',
  FAST_APPLY_SUGGEST = 'FAST_APPLY_SUGGEST',
  MISSING_SKILLS = 'MISSING_SKILLS',
  GENERATE_COVER_LETTER = 'GENERATE_COVER_LETTER',
  OPTIMIZE_PROFILE = 'OPTIMIZE_PROFILE',
}

export interface IntentResult {
  mode: AiMode;
  confidence: number;
}

@Injectable()
export class IntentDetectorService {
  private readonly logger = new Logger(IntentDetectorService.name);

  constructor(private tokenRouter: TokenRouterService) {}

  async detectIntent(message: string): Promise<IntentResult> {
    const prompt = `Classify this message as one of: ANALYZE_CV | COMPARE_JOB | CHAT_ASSIST | FAST_APPLY_SUGGEST | MISSING_SKILLS | GENERATE_COVER_LETTER | OPTIMIZE_PROFILE. Message: ${message}. Return JSON only.`;

    const result = await this.tokenRouter.route(
      TaskType.INTENT_DETECTION,
      TaskPriority.REALTIME,
      prompt,
      { temperature: 0.2, maxTokens: 50 },
    );

    try {
      const parsed = JSON.parse(result);
      return {
        mode: parsed.mode || this.fallbackDetection(message),
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      return {
        mode: this.fallbackDetection(message),
        confidence: 0.5,
      };
    }
  }

  private fallbackDetection(message: string): AiMode {
    const lower = message.toLowerCase();
    
    if (lower.includes('analyze') && (lower.includes('cv') || lower.includes('resume'))) {
      return AiMode.ANALYZE_CV;
    }
    if (lower.includes('compare') && lower.includes('job')) {
      return AiMode.COMPARE_JOB;
    }
    if (lower.includes('missing') && lower.includes('skill')) {
      return AiMode.MISSING_SKILLS;
    }
    if (lower.includes('cover') && lower.includes('letter')) {
      return AiMode.GENERATE_COVER_LETTER;
    }
    if (lower.includes('optimize') && lower.includes('profile')) {
      return AiMode.OPTIMIZE_PROFILE;
    }
    if (lower.includes('apply') && (lower.includes('fast') || lower.includes('bulk'))) {
      return AiMode.FAST_APPLY_SUGGEST;
    }
    
    return AiMode.CHAT_ASSIST;
  }
}
