import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CvAnalysisQueue {
  constructor(@InjectQueue('cv-analysis') private queue: Queue) {}

  async addJob(data: any) {
    return await this.queue.add(data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }

  async getJob(jobId: string) {
    return await this.queue.getJob(jobId);
  }
}
