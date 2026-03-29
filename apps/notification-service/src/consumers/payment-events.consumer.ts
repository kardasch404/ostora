import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { ChannelRouterService } from '../channels/channel-router.service';

@Injectable()
export class PaymentEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventsConsumer.name);
  private kafka: Kafka;
  private consumer;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly channelRouter: ChannelRouterService,
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service-payment',
      brokers: [process.env['KAFKA_BROKER'] || 'localhost:9095'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-payment-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['payment.success', 'payment.failed', 'subscription.renewed', 'subscription.cancelled'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          await this.handlePaymentEvent(topic, data);
        } catch (error) {
          this.logger.error(`Error processing payment event: ${error.message}`);
        }
      },
    });

    this.logger.log('Payment Events Consumer initialized');
  }

  private async handlePaymentEvent(topic: string, data: any) {
    const notificationType = this.getNotificationType(topic);
    const notification = await this.notificationService.createNotification({
      userId: data.userId,
      type: notificationType,
      title: this.getTitle(topic),
      message: this.getMessage(topic, data),
      data: {
        transactionId: data.transactionId,
        amount: data.amount,
        plan: data.plan,
      },
    });

    await this.channelRouter.route(data.userId, notification);
  }

  private getNotificationType(topic: string): any {
    const types = {
      'payment.success': 'PAYMENT_SUCCESS',
      'payment.failed': 'PAYMENT_FAILED',
      'subscription.renewed': 'SUBSCRIPTION_RENEWED',
      'subscription.cancelled': 'SUBSCRIPTION_CANCELLED',
    };
    return types[topic] || 'PAYMENT_SUCCESS';
  }

  private getTitle(topic: string): string {
    const titles = {
      'payment.success': 'Payment Successful',
      'payment.failed': 'Payment Failed',
      'subscription.renewed': 'Subscription Renewed',
      'subscription.cancelled': 'Subscription Cancelled',
    };
    return titles[topic] || 'Payment Update';
  }

  private getMessage(topic: string, data: any): string {
    const messages = {
      'payment.success': `Payment of ${data.amount} MAD processed successfully for ${data.plan}`,
      'payment.failed': `Payment failed: ${data.reason || 'Please update your payment method'}`,
      'subscription.renewed': `Your ${data.plan} subscription has been renewed`,
      'subscription.cancelled': `Your subscription has been cancelled`,
    };
    return messages[topic] || 'Payment update';
  }
}
