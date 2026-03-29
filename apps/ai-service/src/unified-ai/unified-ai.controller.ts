import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChatRequestDto, FastApplyRequestDto } from '../dto/ai-request.dto';
import { IntentDetectorService } from './intent-detector.service';
import { SessionManagerService } from './session-manager.service';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { PromptType } from '../prompt-builder/system-prompts.config';

@Controller('ai')
export class UnifiedAiController {
  constructor(
    private intentDetector: IntentDetectorService,
    private sessionManager: SessionManagerService,
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
  ) {}

  @Post('chat')
  async chat(@Body() dto: ChatRequestDto) {
    const sessionId = dto.sessionId || await this.sessionManager.createSession();

    await this.sessionManager.addMessage(sessionId, 'user', dto.message);

    const intent = await this.intentDetector.detectIntent(dto.message);
    const context = await this.sessionManager.getContext(sessionId);

    const systemPrompt = this.promptBuilder.getSystemPrompt(PromptType.ASSISTANT, dto.language);
    const prompt = context ? `${context}\nuser: ${dto.message}` : dto.message;

    const response = await this.tokenRouter.route(
      TaskType.REALTIME_CHAT,
      TaskPriority.REALTIME,
      prompt,
      { systemPrompt, language: dto.language },
    );

    await this.sessionManager.addMessage(sessionId, 'assistant', response);

    return {
      sessionId,
      intent,
      response,
      timestamp: Date.now(),
    };
  }

  @Post('fast-apply')
  async fastApply(@Body() dto: FastApplyRequestDto) {
    // TODO: Implement fast apply orchestration
    return {
      batchId: 'batch-' + Date.now(),
      jobCount: dto.jobIds.length,
      status: 'processing',
    };
  }

  @Get('credits')
  async getCredits() {
    const remaining = await this.tokenRouter.getRemainingCredits();
    return { remaining, total: 1000 };
  }
}
