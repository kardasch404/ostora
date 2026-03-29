import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, UserPlan } from '../../token-router/token-router.service';
import { PromptBuilderService } from '../../prompt-builder/prompt-builder.service';
import { PromptType } from '../../prompt-builder/system-prompts.config';

@Injectable()
export class AssistantMode {
  private readonly logger = new Logger(AssistantMode.name);

  constructor(
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  async chat(message: string, context: string = '', language: 'en' | 'fr' | 'de' = 'en') {
    this.logger.log('Running assistant chat mode');

    const systemPrompt = this.promptBuilder.getSystemPrompt(PromptType.ASSISTANT, language);
    const prompt = context ? `${context}\n\nUser: ${message}` : message;

    const result = await this.tokenRouter.route(
      TaskType.REALTIME_CHAT,
      UserPlan.FREE,
      prompt,
      { systemPrompt, maxTokens: 500, language },
    );

    return result;
  }
}
