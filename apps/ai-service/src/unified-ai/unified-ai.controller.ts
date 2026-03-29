import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatRequestDto, FastApplyRequestDto } from '../dto/ai-request.dto';
import { IntentDetectorService, AiMode } from './intent-detector.service';
import { SessionManagerService } from './session-manager.service';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { PromptType } from '../prompt-builder/system-prompts.config';
import { AnalyzerMode } from './modes/analyzer.mode';
import { ComparatorMode } from './modes/comparator.mode';
import { AssistantMode } from './modes/assistant.mode';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('ai')
export class UnifiedAiController {
  constructor(
    private intentDetector: IntentDetectorService,
    private sessionManager: SessionManagerService,
    private tokenRouter: TokenRouterService,
    private promptBuilder: PromptBuilderService,
    private analyzerMode: AnalyzerMode,
    private comparatorMode: ComparatorMode,
    private assistantMode: AssistantMode,
    @InjectQueue('cover-letter') private coverLetterQueue: Queue,
    @InjectQueue('profile-optimizer') private profileOptimizerQueue: Queue,
  ) {}

  @Post('chat')
  async chat(@Body() dto: ChatRequestDto) {
    // Step 1: Intent Detection (BlazeAI, tiny prompt, <10 tokens input)
    const sessionId = dto.sessionId || await this.sessionManager.createSession();
    const intentResult = await this.intentDetector.detectIntent(dto.message);

    // Step 2: Context loading
    const session = await this.sessionManager.getSession(sessionId);
    let cvData = await this.sessionManager.getCachedCV(sessionId);
    
    // TODO: Load CV from S3 if needed and not cached
    // TODO: Load job post from PostgreSQL if needed

    // Store user message
    await this.sessionManager.addMessage(sessionId, 'user', dto.message, intentResult.mode);

    // Step 3: Mode routing
    let response: any;
    
    switch (intentResult.mode) {
      case AiMode.ANALYZE_CV:
        response = await this.analyzerMode.analyze(
          cvData?.text || 'No CV loaded',
          'Job description placeholder',
          dto.language,
        );
        break;

      case AiMode.COMPARE_JOB:
        response = await this.comparatorMode.compare(
          cvData?.text || 'No CV loaded',
          [], // TODO: Load jobs
        );
        break;

      case AiMode.MISSING_SKILLS:
        response = await this.analyzerMode.analyzeGapOnly(
          cvData?.text || 'No CV loaded',
          'Job description placeholder',
          dto.language,
        );
        break;

      case AiMode.GENERATE_COVER_LETTER:
        // Enqueue async job
        const coverLetterJob = await this.coverLetterQueue.add({
          userId: session.userId,
          cvText: cvData?.text || '',
          jobDescription: 'Job description',
          companyName: 'Company',
          language: dto.language,
        });
        response = {
          message: 'Cover letter generation started',
          jobId: coverLetterJob.id,
          status: 'processing',
        };
        break;

      case AiMode.OPTIMIZE_PROFILE:
        // Enqueue async job
        const profileJob = await this.profileOptimizerQueue.add({
          userId: session.userId,
          profileData: cvData || {},
          targetRole: 'Target role',
        });
        response = {
          message: 'Profile optimization started',
          jobId: profileJob.id,
          status: 'processing',
        };
        break;

      case AiMode.FAST_APPLY_SUGGEST:
        response = {
          message: 'Fast apply feature available. Use POST /ai/fast-apply to start.',
          suggestion: 'Would you like to apply to multiple jobs at once?',
        };
        break;

      case AiMode.CHAT_ASSIST:
      default:
        const context = await this.sessionManager.getContext(sessionId);
        response = await this.assistantMode.chat(dto.message, context, dto.language);
        break;
    }

    // Step 4: Store conversation turn
    const responseText = typeof response === 'string' ? response : JSON.stringify(response);
    await this.sessionManager.addMessage(sessionId, 'assistant', responseText, intentResult.mode);

    return {
      response,
      mode: intentResult.mode,
      confidence: intentResult.confidence,
      sessionId,
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
