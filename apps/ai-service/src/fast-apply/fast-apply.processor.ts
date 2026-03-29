import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FastApplyProgressService } from './fast-apply-progress.service';

export interface FastApplyJob {
  batchId: string;
  userId: string;
  jobId: string;
  cvText: string;
  jobDescription: string;
  companyName: string;
}

@Processor('fast-apply')
export class FastApplyProcessor {
  private readonly logger = new Logger(FastApplyProcessor.name);

  constructor(private progressService: FastApplyProgressService) {}

  @Process({ concurrency: 1 })
  async handleFastApply(job: Job<FastApplyJob>) {
    this.logger.log(`Processing fast apply for job ${job.data.jobId}`);

    try {
      // Simulate processing (replace with actual logic)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.progressService.incrementCompleted(job.data.batchId);

      return {
        success: true,
        jobId: job.data.jobId,
        timestamp: Date.now(),
      };
    } catch (error) {
      await this.progressService.incrementFailed(job.data.batchId);
      throw error;
    }
  }
}
