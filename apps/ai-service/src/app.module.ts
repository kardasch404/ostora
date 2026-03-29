import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnifiedAiController } from './unified-ai/unified-ai.controller';
import { IntentDetectorService } from './unified-ai/intent-detector.service';
import { SessionManagerService } from './unified-ai/session-manager.service';
import { TokenRouterService } from './token-router/token-router.service';
import { BlazeAiProvider } from './token-router/blazeai.provider';
import { OllamaProvider } from './token-router/ollama.provider';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { AiUsageService } from './rate-limiter/ai-usage.service';
import { AiQuotaGuard } from './rate-limiter/ai-quota.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [UnifiedAiController],
  providers: [
    BlazeAiProvider,
    OllamaProvider,
    TokenRouterService,
    IntentDetectorService,
    SessionManagerService,
    PromptBuilderService,
    AiUsageService,
    AiQuotaGuard,
  ],
})
export class AppModule {}
