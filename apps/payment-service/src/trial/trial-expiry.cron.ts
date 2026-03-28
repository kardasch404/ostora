import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialService } from './trial.service';

@Injectable()
export class TrialExpiryCron {
  private readonly logger = new Logger(TrialExpiryCron.name);

  constructor(private trialService: TrialService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredTrials() {
    this.logger.log('Running trial expiry check...');

    try {
      await this.trialService.checkExpiredTrials();
      this.logger.log('Trial expiry check completed successfully');
    } catch (error) {
      this.logger.error('Failed to process expired trials', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleTrialReminders() {
    this.logger.log('Checking for trial expiry reminders...');
    // TODO: Send reminders to users whose trials expire in 1-2 days
  }
}
