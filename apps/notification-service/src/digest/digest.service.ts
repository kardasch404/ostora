import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  async generateWeeklyDigest(userId: string) {
    this.logger.log(`Generating weekly digest for user ${userId}`);
    return { userId, digest: [] };
  }
}
