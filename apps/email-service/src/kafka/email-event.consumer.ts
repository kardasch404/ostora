import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailEventPayload } from '../email/interfaces/email-event-payload.interface';
import { EmailEventEnum } from './email-event.enum';
import { TemplateRendererService } from '../template/template-renderer.service';
import { EMAIL_QUEUE } from '../queue/email.queue';

@Injectable()
export class EmailEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailEventConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private config: ConfigService,
    private templateRenderer: TemplateRendererService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue
  ) {
    this.kafka = new Kafka({
      clientId: 'email-service',
      brokers: [config.get('KAFKA_BROKER', 'localhost:9095')],
    });
    this.consumer = this.kafka.consumer({ groupId: 'email-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'email.events', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event: EmailEventPayload = JSON.parse(message.value.toString());
          this.logger.log(`Received email event: ${event.eventType}`);
          await this.handleEmailEvent(event);
        } catch (error) {
          this.logger.error('Failed to process email event', error);
        }
      },
    });

    this.logger.log('Email event consumer started');
  }

  private async handleEmailEvent(event: EmailEventPayload) {
    const { eventType, userId, to, data, attachments } = event;

    let templateName: string;
    let subject: string;

    switch (eventType) {
      case EmailEventEnum.EMAIL_VERIFICATION:
        templateName = 'verification';
        subject = 'Verify Your Email Address';
        break;
      case EmailEventEnum.PASSWORD_RESET:
        templateName = 'password-reset';
        subject = 'Reset Your Password';
        break;
      case EmailEventEnum.PASSWORD_CHANGED:
        templateName = 'password-changed';
        subject = 'Your Password Has Been Changed';
        break;
      case EmailEventEnum.NEW_DEVICE_LOGIN:
        templateName = 'new-device-login';
        subject = 'New Device Login Detected';
        break;
      case EmailEventEnum.OTP_CODE:
        templateName = 'otp';
        subject = 'Your OTP Code';
        break;
      case EmailEventEnum.APPLICATION_SENT:
        templateName = 'application';
        subject = 'Job Application Sent Successfully';
        break;
      case EmailEventEnum.WELCOME:
        templateName = 'welcome';
        subject = 'Welcome to Ostora';
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
        return;
    }

    const body = this.templateRenderer.render(templateName, data);

    await this.emailQueue.add({
      userId,
      to,
      subject,
      body,
      attachments,
      attempt: 1,
    });

    this.logger.log(`Email job queued for ${to}`);
  }
}
