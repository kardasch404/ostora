import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FcmTokenService } from '../channels/fcm-token.service';

@Injectable()
export class FcmTokenCleanupCron {
  private readonly logger = new Logger(FcmTokenCleanupCron.name);

  constructor(private readonly fcmTokenService: FcmTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupInactiveTokens() {
    this.logger.log('Starting FCM token cleanup job...');

    try {
      const count = await this.fcmTokenService.cleanupInactiveTokens();
      this.logger.log(`FCM token cleanup completed. Removed ${count} tokens`);
    } catch (error) {
      this.logger.error(`FCM token cleanup failed: ${error.message}`);
    }
  }
}
