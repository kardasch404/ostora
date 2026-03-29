import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  async handleNotification(data: any) {
    try {
      await this.notificationService.create(data);
    } catch (error) {
      this.logger.error(`Failed to handle notification: ${(error as Error).message}`);
    }
  }
}
