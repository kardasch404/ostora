import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from '../gateway/notification.gateway';

@Injectable()
export class WebSocketChannel {
  private readonly logger = new Logger(WebSocketChannel.name);

  constructor(private notificationGateway: NotificationGateway) {}

  async send(userId: string, notification: any): Promise<boolean> {
    try {
      // Check if user is online
      if (!this.notificationGateway.isUserOnline(userId)) {
        this.logger.debug(`User ${userId} is offline, skipping WebSocket notification`);
        return false;
      }

      // Send notification via WebSocket
      await this.notificationGateway.sendToUser(userId, 'notification', notification);

      // Update unread count
      const unreadCount = notification.unreadCount || 0;
      await this.notificationGateway.sendToUser(userId, 'unread_count', { count: unreadCount });

      this.logger.log(`WebSocket notification sent to user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WebSocket notification: ${error.message}`);
      return false;
    }
  }

  async sendBatch(userIds: string[], notification: any): Promise<void> {
    for (const userId of userIds) {
      await this.send(userId, notification);
    }
  }

  async broadcast(notification: any): Promise<void> {
    this.notificationGateway.broadcastToAll('notification', notification);
  }
}
