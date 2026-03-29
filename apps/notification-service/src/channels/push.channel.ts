import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FcmTokenService } from './fcm-token.service';

@Injectable()
export class PushChannel implements OnModuleInit {
  private readonly logger = new Logger(PushChannel.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly fcmTokenService: FcmTokenService) {}

  onModuleInit() {
    try {
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        const serviceAccount = process.env['FIREBASE_SERVICE_ACCOUNT_PATH'];
        
        if (serviceAccount) {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.logger.log('Firebase Admin SDK initialized');
        } else {
          this.logger.warn('Firebase service account not configured');
        }
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  async send(userId: string, notification: any) {
    try {
      // Get user's FCM tokens
      const tokens = await this.fcmTokenService.getUserTokens(userId);

      if (!tokens || tokens.length === 0) {
        this.logger.debug(`No FCM tokens found for user: ${userId}`);
        return { success: false, reason: 'NO_TOKENS' };
      }

      if (!this.firebaseApp) {
        this.logger.warn('Firebase not initialized, skipping push notification');
        return { success: false, reason: 'FIREBASE_NOT_INITIALIZED' };
      }

      // Prepare FCM message
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          type: notification.type,
          notificationId: notification.id || '',
          actionUrl: notification.actionUrl || '',
          ...this.serializeData(notification.data),
        },
        tokens: tokens.map((t) => t.token),
      };

      // Send to multiple devices
      const response = await admin.messaging().sendMulticast(message);

      this.logger.log(
        `Push notification sent to user ${userId}: ${response.successCount}/${tokens.length} successful`,
      );

      // Handle invalid tokens
      if (response.failureCount > 0) {
        await this.handleFailedTokens(tokens, response.responses);
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  private serializeData(data: any): Record<string, string> {
    if (!data) return {};
    
    const serialized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return serialized;
  }

  private async handleFailedTokens(
    tokens: any[],
    responses: admin.messaging.SendResponse[],
  ) {
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (!response.success) {
        const errorCode = response.error?.code;
        
        // Mark token as invalid if it's unregistered or invalid
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          await this.fcmTokenService.markTokenAsInvalid(tokens[i].token);
          this.logger.warn(`Invalid FCM token removed: ${tokens[i].token.substring(0, 20)}...`);
        }
      }
    }
  }
}
