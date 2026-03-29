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

      // Check digest frequency
      if (!this.shouldSendNow(preferences.digestFrequency)) {
        this.logger.debug(`Notification queued for digest: ${userId}`);
        // TODO: Queue for digest batch
        return;
      }

      let pushSent = false;

      // Route to Push channel (priority) - respect quiet hours
      if (preferences.pushEnabled) {
        const inQuietHours = this.preferencesService.isInQuietHours(preferences.quietHours);
        
        if (inQuietHours) {
          this.logger.debug(`User ${userId} in quiet hours, skipping push notification`);
        } else {
          const result = await this.pushChannel.send(userId, notification);
          pushSent = result?.success || false;
          
          if (!pushSent) {
            this.logger.debug(`Push notification failed for user ${userId}: ${result?.reason}`);
          }
        }
      }

      // Fallback to WebSocket (in-app) if push failed or no FCM token
      if (preferences.inAppEnabled && (!preferences.pushEnabled || !pushSent)) {
        await this.websocketChannel.send(userId, notification);
        this.logger.debug(`Fallback to in-app notification for user ${userId}`);
      }

      // Route to Email channel (via Kafka) - respect digest frequency
      if (preferences.emailEnabled && this.shouldSendEmailNow(preferences.digestFrequency)) {
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

  private shouldSendNow(digestFrequency: string): boolean {
    // INSTANT: send immediately
    // DAILY/WEEKLY: queue for digest (handled by cron jobs)
    return digestFrequency === 'INSTANT';
  }

  private shouldSendEmailNow(digestFrequency: string): boolean {
    // For email, respect digest frequency
    return digestFrequency === 'INSTANT';
  }
}
