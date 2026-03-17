import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { EmailProcessor } from '../../src/queue/email.processor';
import { EmailService } from '../../src/email/email.service';
import { EmailJobData } from '../../src/queue/email.queue';

describe('EmailProcessor - Retry Logic', () => {
  let processor: EmailProcessor;
  let emailService: EmailService;

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleEmailJob', () => {
    const createMockJob = (data: EmailJobData): Partial<Job<EmailJobData>> => ({
      id: 'job-123',
      data,
      queue: {
        add: jest.fn(),
      } as any,
    });

    it('should send email successfully on first attempt', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        attempt: 1,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await processor.handleEmailJob(job);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        {
          to: 'user@example.com',
          subject: 'Test Email',
          body: '<html>Test</html>',
          plainText: undefined,
          attachments: undefined,
        },
        'user-123',
        undefined
      );

      expect(result).toEqual({ success: true });
    });

    it('should retry on first failure with 2 minute delay', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        attempt: 1,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP connection failed'));

      await processor.handleEmailJob(job);

      expect(job.queue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 2,
        }),
        expect.objectContaining({
          delay: 120000, // 2^1 * 60 * 1000 = 2 minutes
        })
      );
    });

    it('should retry on second failure with 4 minute delay', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        attempt: 2,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP timeout'));

      await processor.handleEmailJob(job);

      expect(job.queue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 3,
        }),
        expect.objectContaining({
          delay: 240000, // 2^2 * 60 * 1000 = 4 minutes
        })
      );
    });

    it('should not retry after max attempts reached', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        attempt: 3,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockRejectedValue(new Error('Final failure'));

      await expect(processor.handleEmailJob(job)).rejects.toThrow('Final failure');

      expect(job.queue.add).not.toHaveBeenCalled();
    });

    it('should handle email with attachments', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        attachments: ['https://s3.amazonaws.com/cv.pdf'],
        attempt: 1,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      await processor.handleEmailJob(job);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: ['https://s3.amazonaws.com/cv.pdf'],
        }),
        'user-123',
        undefined
      );
    });

    it('should use emailConfigId when provided', async () => {
      const jobData: EmailJobData = {
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Test Email',
        body: '<html>Test</html>',
        emailConfigId: 'config-123',
        attempt: 1,
      };

      const job = createMockJob(jobData) as Job<EmailJobData>;
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      await processor.handleEmailJob(job);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user-123',
        'config-123'
      );
    });
  });
});
