import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  types: {
    AI_TASK_COMPLETED: boolean;
    JOB_MATCH: boolean;
    PAYMENT_SUCCESS: boolean;
    PAYMENT_FAILED: boolean;
    APPLICATION_UPDATE: boolean;
    TRIAL_EXPIRING: boolean;
    SUBSCRIPTION_RENEWED: boolean;
    SYSTEM_ALERT: boolean;
  };
}

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);
  private prisma = new PrismaClient();

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const prefs = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!prefs) {
        return this.getDefaultPreferences(userId);
      }

      return {
        userId: prefs.userId,
        inAppEnabled: prefs.inAppEnabled,
        pushEnabled: prefs.pushEnabled,
        emailEnabled: prefs.emailEnabled,
        types: prefs.types as any,
      };
    } catch (error) {
      this.logger.error(`Failed to get preferences: ${error.message}`);
      return this.getDefaultPreferences(userId);
    }
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        inAppEnabled: preferences.inAppEnabled ?? true,
        pushEnabled: preferences.pushEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? true,
        types: preferences.types || this.getDefaultTypes(),
      },
      update: {
        inAppEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled,
        types: preferences.types,
      },
    });
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
      types: this.getDefaultTypes(),
    };
  }

  private getDefaultTypes() {
    return {
      AI_TASK_COMPLETED: true,
      JOB_MATCH: true,
      PAYMENT_SUCCESS: true,
      PAYMENT_FAILED: true,
      APPLICATION_UPDATE: true,
      TRIAL_EXPIRING: true,
      SUBSCRIPTION_RENEWED: true,
      SYSTEM_ALERT: true,
    };
  }
}
