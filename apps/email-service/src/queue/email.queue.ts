import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

export const EMAIL_QUEUE = 'email-queue';

export interface EmailJobData {
  userId: string;
  to: string;
  subject: string;
  body: string;
  plainText?: string;
  attachments?: string[];
  emailConfigId?: string;
  attempt?: number;
}

@Processor(EMAIL_QUEUE)
export class EmailQueue {
  private readonly logger = new Logger(EmailQueue.name);

  @Process()
  async process(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job: ${job.id}`);
    // Processing logic is in email.processor.ts
  }
}
