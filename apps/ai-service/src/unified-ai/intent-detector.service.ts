import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';

export enum Intent {
  CV_ANALYSIS = 'cv_analysis',
  JOB_SEARCH = 'job_search',
  COVER_LETTER = 'cover_letter',
  PROFILE_HELP = 'profile_help',
  GENERAL_QUESTION = 'general_question',
}

@Injectable()
export class IntentDetectorService {
  private readonly logger = new Logger(IntentDetectorService.name);

  constructor(private tokenRouter: TokenRouterService) {}

  async detectIntent(message: string): Promise<Intent> {
    const prompt = `Classify this user message into one category: cv_analysis, job_search, cover_letter, profile_help, general_question.\nMessage: "${message}"\nCategory:`;

    const result = await this.tokenRouter.route(
      TaskType.INTENT_DETECTION,
      TaskPriority.REALTIME,
      prompt,
      { temperature: 0.2, maxTokens: 20 },
    );

    const intent = result.toLowerCase().trim();
    
    if (intent.includes('cv') || intent.includes('resume')) return Intent.CV_ANALYSIS;
    if (intent.includes('job') || intent.includes('search')) return Intent.JOB_SEARCH;
    if (intent.includes('cover') || intent.includes('letter')) return Intent.COVER_LETTER;
    if (intent.includes('profile')) return Intent.PROFILE_HELP;
    
    return Intent.GENERAL_QUESTION;
  }
}
