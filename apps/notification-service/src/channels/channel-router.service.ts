import { Injectable, Logger } from '@nestjs/common';
import { WebSocketChannel } from './websocket.channel';
import { EmailChannel } from './email.channel';
import { PushChannel } from './push.channel';
import { PreferencesService } from '../preferences/preferences.service';

@Injectable()
export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);

  constructor(
    private websocketChannel: WebSocketChannel,
    private emailChannel: EmailChannel,
    private pushChannel: PushChannel,
    private preferencesService: PreferencesService,
  ) {}

  async route(userId: string, notification: any): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.preferencesService.getUserPreferences(userId);

      // Check if notification type is enabled
      const notificationType = notification.type;
      if (!this.isNotificationEnabled(preferences, notificationType)) {
        this.logger.debug(`Notification type ${notificationType} disabled for user ${userId}`);
        return;
      }

      // Route to WebSocket channel (in-app)
      if (preferences.inAppEnabled) {
        await this.websocketChannel.send(userId, notification);
      }

      // Route to Push channel
      if (preferences.pushEnabled) {
        await this.pushChannel.send(userId, notification);
      }

      // Route to Email channel (via Kafka)
      if (preferences.emailEnabled) {
        await this.emailChannel.send(userId, notification);
      }

      this.logger.log(`Notification routed to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to route notification: ${error.message}`);
    }
  }

  private isNotificationEnabled(preferences: any, notificationType: string): boolean {
    // Check if specific notification type is enabled in preferences
    const typePreferences = preferences.types || {};
    return typePreferences[notificationType] !== false;
  }
}
