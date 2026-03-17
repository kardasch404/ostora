import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { EmailEventConsumer } from '../../src/kafka/email-event.consumer';
import { TemplateRendererService } from '../../src/template/template-renderer.service';
import { EmailEventEnum } from '../../src/kafka/email-event.enum';
import { EMAIL_QUEUE } from '../../src/queue/email.queue';

describe('EmailEventConsumer', () => {
  let consumer: EmailEventConsumer;
  let templateRenderer: TemplateRendererService;
  let emailQueue: Queue;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'KAFKA_BROKER') return 'localhost:9095';
      return defaultValue;
    }),
  };

  const mockTemplateRenderer = {
    render: jest.fn(),
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailEventConsumer,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TemplateRendererService,
          useValue: mockTemplateRenderer,
        },
        {
          provide: `BullQueue_${EMAIL_QUEUE}`,
          useValue: mockEmailQueue,
        },
      ],
    }).compile();

    consumer = module.get<EmailEventConsumer>(EmailEventConsumer);
    templateRenderer = module.get<TemplateRendererService>(TemplateRendererService);
    emailQueue = module.get<Queue>(`BullQueue_${EMAIL_QUEUE}`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleEmailEvent', () => {
    it('should handle EMAIL_VERIFICATION event', async () => {
      const event = {
        eventType: EmailEventEnum.EMAIL_VERIFICATION,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          verificationUrl: 'https://ostora.com/verify?token=abc',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>Verification Email</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('verification', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith({
        userId: 'user-123',
        to: 'user@example.com',
        subject: 'Verify Your Email Address',
        body: '<html>Verification Email</html>',
        attachments: undefined,
        attempt: 1,
      });
    });

    it('should handle PASSWORD_RESET event', async () => {
      const event = {
        eventType: EmailEventEnum.PASSWORD_RESET,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          resetUrl: 'https://ostora.com/reset?token=xyz',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>Reset Password</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('password-reset', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset Your Password',
        })
      );
    });

    it('should handle OTP_CODE event', async () => {
      const event = {
        eventType: EmailEventEnum.OTP_CODE,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          otpCode: '123456',
          expiryMinutes: '5',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>OTP Code</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('otp', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your OTP Code',
        })
      );
    });

    it('should handle PASSWORD_CHANGED event', async () => {
      const event = {
        eventType: EmailEventEnum.PASSWORD_CHANGED,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          changedAt: '2026-03-17T10:00:00.000Z',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>Password Changed</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('password-changed', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Password Has Been Changed',
        })
      );
    });

    it('should handle NEW_DEVICE_LOGIN event', async () => {
      const event = {
        eventType: EmailEventEnum.NEW_DEVICE_LOGIN,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          device: 'Chrome on Windows',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>New Device Login</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('new-device-login', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'New Device Login Detected',
        })
      );
    });

    it('should handle APPLICATION_SENT event with attachments', async () => {
      const event = {
        eventType: EmailEventEnum.APPLICATION_SENT,
        userId: 'user-123',
        to: 'hr@company.com',
        data: {
          name: 'John Doe',
          jobTitle: 'Senior Developer',
          companyName: 'Tech Corp',
        },
        attachments: ['cv.pdf', 'cover-letter.pdf'],
      };

      mockTemplateRenderer.render.mockReturnValue('<html>Application</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: ['cv.pdf', 'cover-letter.pdf'],
        })
      );
    });

    it('should handle WELCOME event', async () => {
      const event = {
        eventType: EmailEventEnum.WELCOME,
        userId: 'user-123',
        to: 'user@example.com',
        data: {
          name: 'John Doe',
          dashboardUrl: 'https://ostora.com/dashboard',
        },
      };

      mockTemplateRenderer.render.mockReturnValue('<html>Welcome</html>');

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).toHaveBeenCalledWith('welcome', event.data);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Welcome to Ostora',
        })
      );
    });

    it('should handle unknown event type gracefully', async () => {
      const event = {
        eventType: 'UNKNOWN_EVENT' as any,
        userId: 'user-123',
        to: 'user@example.com',
        data: {},
      };

      await (consumer as any).handleEmailEvent(event);

      expect(templateRenderer.render).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });
});
