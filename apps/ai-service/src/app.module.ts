import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';
import { PrismaService } from './prisma.service';
import { UnifiedAiController } from './unified-ai/unified-ai.controller';
import { IntentDetectorService } from './unified-ai/intent-detector.service';
import { SessionManagerService } from './unified-ai/session-manager.service';
import { TokenRouterService } from './token-router/token-router.service';
import { BlazeAiProvider } from './token-router/blazeai.provider';
import { OllamaProvider } from './token-router/ollama.provider';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { AiUsageService } from './rate-limiter/ai-usage.service';
import { AiQuotaGuard } from './rate-limiter/ai-quota.guard';
import { FastApplyController } from './fast-apply/fast-apply.controller';
import { FastApplyService } from './fast-apply/fast-apply.service';
import { FastApplyProgressService } from './fast-apply/fast-apply-progress.service';
import { AiResultController } from './result/ai-result.controller';
import { CoverLetterController } from './cover-letter/cover-letter.controller';
import { CvAnalysisProcessor } from './queues/cv-analysis.processor';
import { CoverLetterProcessor } from './queues/cover-letter.processor';
import { JobMatchingProcessor } from './queues/job-matching.processor';
import { ProfileOptimizerProcessor } from './queues/profile-optimizer.processor';
import { FastApplyProcessor } from './fast-apply/fast-apply.processor';
import { CvAnalysisQueue } from './queues/cv-analysis.queue';
import { CoverLetterQueue } from './queues/cover-letter.queue';
import { JobMatchingQueue } from './queues/job-matching.queue';
import { ProfileOptimizerQueue } from './queues/profile-optimizer.queue';
import { AnalyzerMode } from './unified-ai/modes/analyzer.mode';
import { ComparatorMode } from './unified-ai/modes/comparator.mode';
import { AssistantMode } from './unified-ai/modes/assistant.mode';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/ai-service/.env'),
        join(process.cwd(), '.env'),
      ],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6345,
      },
    }),
    BullModule.registerQueue(
      { name: 'cv-analysis' },
      { name: 'cover-letter' },
      { name: 'job-matching' },
      { name: 'profile-optimizer' },
      { name: 'fast-apply' },
    ),
  ],
  controllers: [UnifiedAiController, FastApplyController, AiResultController, CoverLetterController],
  providers: [
    PrismaService,
    BlazeAiProvider,
    OllamaProvider,
    TokenRouterService,
    IntentDetectorService,
    SessionManagerService,
    PromptBuilderService,
    AiUsageService,
    AiQuotaGuard,
    FastApplyService,
    FastApplyProgressService,
    CvAnalysisProcessor,
    CoverLetterProcessor,
    JobMatchingProcessor,
    ProfileOptimizerProcessor,
    FastApplyProcessor,
    CvAnalysisQueue,
    CoverLetterQueue,
    JobMatchingQueue,
    ProfileOptimizerQueue,
    AnalyzerMode,
    ComparatorMode,
    AssistantMode,
  ],
})
export class AppModule {}
