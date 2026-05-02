import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../../token-router/token-router.service';
import { PromptBuilderService } from '../../prompt-builder/prompt-builder.service';
import { PromptType } from '../../prompt-builder/prompt-type.enum';

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

    try {
      const result = await this.tokenRouter.route(
        TaskType.REALTIME_CHAT,
        TaskPriority.REALTIME,
        prompt,
        { systemPrompt, maxTokens: 300, language },
      );

      return result;
    } catch {
      return 'AI service is currently busy. Please retry in a few seconds.';
    }
  }
}
