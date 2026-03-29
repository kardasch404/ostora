import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private kafka: Kafka;
  private consumer;

  constructor(private readonly notificationService: NotificationService) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [process.env['KAFKA_BROKER'] || 'localhost:9095'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: [
        'job.applied',
        'job.matched',
        'application.status',
        'message.received',
        'payment.success',
      ],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());
        await this.handleEvent(topic, data);
      },
    });
  }

  private async handleEvent(topic: string, data: any) {
    const eventHandlers = {
      'job.applied': () =>
        this.notificationService.create({
          userId: data.userId,
          type: 'JOB_APPLICATION',
          title: 'Application Submitted',
          message: `Your application for ${data.jobTitle} has been submitted`,
          metadata: { jobId: data.jobId },
        }),
      'job.matched': () =>
        this.notificationService.create({
          userId: data.userId,
          type: 'JOB_MATCH',
          title: 'New Job Match',
          message: `${data.jobTitle} matches your profile`,
          metadata: { jobId: data.jobId },
        }),
      'application.status': () =>
        this.notificationService.create({
          userId: data.userId,
          type: 'APPLICATION_UPDATE',
          title: 'Application Update',
          message: `Your application status: ${data.status}`,
          metadata: { applicationId: data.applicationId },
        }),
      'message.received': () =>
        this.notificationService.create({
          userId: data.recipientId,
          type: 'MESSAGE',
          title: 'New Message',
          message: `${data.senderName} sent you a message`,
          metadata: { messageId: data.messageId },
        }),
      'payment.success': () =>
        this.notificationService.create({
          userId: data.userId,
          type: 'PAYMENT',
          title: 'Payment Successful',
          message: `Payment of ${data.amount} processed successfully`,
          metadata: { transactionId: data.transactionId },
        }),
    };

    const handler = eventHandlers[topic];
    if (handler) await handler();
  }
}
