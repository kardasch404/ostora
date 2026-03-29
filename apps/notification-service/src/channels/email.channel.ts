import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'notification-service-email',
      brokers: [process.env['KAFKA_BROKER'] || 'localhost:9095'],
    });
    this.producer = this.kafka.producer();
    this.connect();
  }

  private async connect() {
    try {
      await this.producer.connect();
      this.logger.log('Email channel connected to Kafka');
    } catch (error) {
      this.logger.error(`Failed to connect email channel: ${error.message}`);
    }
  }

  async send(userId: string, notification: any) {
    try {
      await this.producer.send({
        topic: 'email.notification',
        messages: [
          {
            key: userId,
            value: JSON.stringify({
              userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      this.logger.log(`Email notification sent to Kafka for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  async sendBulk(notifications: Array<{ userId: string; notification: any }>) {
    try {
      const messages = notifications.map((item) => ({
        key: item.userId,
        value: JSON.stringify({
          userId: item.userId,
          type: item.notification.type,
          title: item.notification.title,
          message: item.notification.message,
          data: item.notification.data,
          timestamp: new Date().toISOString(),
        }),
      }));

      await this.producer.send({
        topic: 'email.notification',
        messages,
      });

      this.logger.log(`Bulk email notifications sent: ${notifications.length}`);
    } catch (error) {
      this.logger.error(`Failed to send bulk email notifications: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
