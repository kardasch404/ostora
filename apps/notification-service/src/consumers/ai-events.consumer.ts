import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { ChannelRouterService } from '../channels/channel-router.service';

@Injectable()
export class AiEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(AiEventsConsumer.name);
  private kafka: Kafka;
  private consumer;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly channelRouter: ChannelRouterService,
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service-ai',
      brokers: [process.env['KAFKA_BROKER'] || 'localhost:9095'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-ai-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['ai.cv.analyzed', 'ai.cover.generated', 'ai.task.completed'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          await this.handleAiEvent(topic, data);
        } catch (error) {
          this.logger.error(`Error processing AI event: ${error.message}`);
        }
      },
    });

    this.logger.log('AI Events Consumer initialized');
  }

  private async handleAiEvent(topic: string, data: any) {
    const notification = await this.notificationService.createNotification({
      userId: data.userId,
      type: 'AI_TASK_COMPLETED',
      title: this.getTitle(topic),
      message: this.getMessage(topic, data),
      data: { taskId: data.taskId, result: data.result },
    });

    await this.channelRouter.route(data.userId, notification);
  }

  private getTitle(topic: string): string {
    const titles = {
      'ai.cv.analyzed': 'CV Analysis Complete',
      'ai.cover.generated': 'Cover Letter Ready',
      'ai.task.completed': 'AI Task Completed',
    };
    return titles[topic] || 'AI Task Completed';
  }

  private getMessage(topic: string, data: any): string {
    const messages = {
      'ai.cv.analyzed': `Your CV has been analyzed successfully`,
      'ai.cover.generated': `Your cover letter for ${data.jobTitle || 'the position'} is ready`,
      'ai.task.completed': `Your AI task has been completed`,
    };
    return messages[topic] || 'Your AI task has been completed';
  }
}
