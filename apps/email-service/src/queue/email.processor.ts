import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE, EmailJobData } from './email.queue';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly MAX_ATTEMPTS = 3;

  constructor(private emailService: EmailService) {}

  @Process()
  async handleEmailJob(job: Job<EmailJobData>) {
    const { userId, to, subject, body, plainText, attachments, emailConfigId, attempt = 1 } = job.data;

    this.logger.log(`Processing email job ${job.id}, attempt ${attempt}/${this.MAX_ATTEMPTS}`);

    try {
      await this.emailService.sendEmail({
        to,
        subject,
        body,
        plainText,
        attachments,
      }, userId, emailConfigId);

      this.logger.log(`Email sent successfully: ${to}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown email send error';
      this.logger.error(`Email send failed (attempt ${attempt}): ${message}`);

      if (attempt < this.MAX_ATTEMPTS) {
        // Exponential backoff: 2^attempt minutes
        const delay = Math.pow(2, attempt) * 60 * 1000;
        
        await job.queue.add(
          { ...job.data, attempt: attempt + 1 },
          { delay, attempts: 1 }
        );

        this.logger.log(`Scheduled retry in ${delay / 1000}s`);
        return { success: false, retryScheduled: true, nextAttempt: attempt + 1 };
      } else {
        this.logger.error(`Max retry attempts reached for email: ${to}`);
        throw error;
      }
    }
  }
}
