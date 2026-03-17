import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ApplicationService } from '../application.service';
import { APPLICATION_QUEUE, ApplicationJobData } from './application.queue';

@Processor(APPLICATION_QUEUE)
export class ApplicationProcessor {
  private readonly logger = new Logger(ApplicationProcessor.name);

  constructor(private applicationService: ApplicationService) {}

  @Process()
  async handleApplicationJob(job: Job<ApplicationJobData>) {
    const { jobPostId, userId, bundleId, emailConfigId, templateId, recipientEmail, placeholders } = job.data;

    this.logger.log(`Processing application job ${job.id} for job ${jobPostId}`);

    try {
      await this.applicationService.processApplication({
        jobPostId,
        userId,
        bundleId,
        emailConfigId,
        templateId,
        recipientEmail,
        placeholders,
      });

      this.logger.log(`Application sent successfully for job ${jobPostId}`);
      return { success: true, jobPostId };
    } catch (error) {
      this.logger.error(`Application failed for job ${jobPostId}: ${error.message}`);
      throw error;
    }
  }
}
