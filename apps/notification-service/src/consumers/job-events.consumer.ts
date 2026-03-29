import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { ChannelRouterService } from '../channels/channel-router.service';

@Injectable()
export class JobEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(JobEventsConsumer.name);
  private kafka: Kafka;
  private consumer;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly channelRouter: ChannelRouterService,
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service-job',
      brokers: [process.env['KAFKA_BROKER'] || 'localhost:9095'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-job-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['job.matched', 'job.applied', 'application.status.changed'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          await this.handleJobEvent(topic, data);
        } catch (error) {
          this.logger.error(`Error processing job event: ${error.message}`);
        }
      },
    });

    this.logger.log('Job Events Consumer initialized');
  }

  private async handleJobEvent(topic: string, data: any) {
    const notification = await this.notificationService.createNotification({
      userId: data.userId,
      type: this.getNotificationType(topic),
      title: this.getTitle(topic),
      message: this.getMessage(topic, data),
      data: {
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        company: data.company,
        applicationId: data.applicationId,
        status: data.status,
      },
      actionUrl: data.jobId ? `/jobs/${data.jobId}` : undefined,
    });

    await this.channelRouter.route(data.userId, notification);
  }

  private getNotificationType(topic: string): any {
    const types = {
      'job.matched': 'JOB_MATCH',
      'job.applied': 'JOB_APPLICATION',
      'application.status.changed': 'APPLICATION_UPDATE',
    };
    return types[topic] || 'JOB_MATCH';
  }

  private getTitle(topic: string): string {
    const titles = {
      'job.matched': 'New Job Match',
      'job.applied': 'Application Submitted',
      'application.status.changed': 'Application Update',
    };
    return titles[topic] || 'Job Update';
  }

  private getMessage(topic: string, data: any): string {
    const messages = {
      'job.matched': `${data.jobTitle} at ${data.company} matches your profile!`,
      'job.applied': `Your application for ${data.jobTitle} has been submitted`,
      'application.status.changed': `Your application status: ${data.status}`,
    };
    return messages[topic] || 'Job update';
  }
}
