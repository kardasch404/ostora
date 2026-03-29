import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';

@Injectable()
export class AiQuotaGuard implements CanActivate {
  constructor(private aiUsageService: AiUsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous';
    const plan = request.user?.plan || 'FREE';

    const canProceed = await this.aiUsageService.checkLimit(userId, plan);

    if (!canProceed) {
      throw new HttpException('AI quota exceeded for today', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.aiUsageService.incrementUsage(userId);
    return true;
  }
}
