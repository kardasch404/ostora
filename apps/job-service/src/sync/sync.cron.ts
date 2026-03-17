import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobSyncService } from './job-sync.service';

@Injectable()
export class SyncCron {
  private readonly logger = new Logger(SyncCron.name);

  constructor(private jobSync: JobSyncService) {}

  @Cron('*/30 * * * *') // Every 30 minutes
  async handleSync() {
    this.logger.log('Running scheduled job sync');
    try {
      await this.jobSync.syncAll();
      this.logger.log('Scheduled job sync completed successfully');
    } catch (error) {
      this.logger.error('Scheduled job sync failed', error);
    }
  }
}
