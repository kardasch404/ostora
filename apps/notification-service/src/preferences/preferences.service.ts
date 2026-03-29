import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DigestFrequency, QuietHoursDto } from './dto/update-preferences.dto';

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  weeklyDigestEnabled: boolean;
  digestFrequency: DigestFrequency;
  quietHours: QuietHoursDto | null;
  types: {
    AI_TASK_COMPLETED: boolean;
    JOB_MATCH: boolean;
    PAYMENT_SUCCESS: boolean;
    PAYMENT_FAILED: boolean;
    APPLICATION_UPDATE: boolean;
    TRIAL_EXPIRING: boolean;
    SUBSCRIPTION_RENEWED: boolean;
    SYSTEM_ALERT: boolean;
    JOB_APPLICATION: boolean;
    MESSAGE: boolean;
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
        weeklyDigestEnabled: prefs.weeklyDigestEnabled ?? true,
        digestFrequency: (prefs.digestFrequency as DigestFrequency) || DigestFrequency.INSTANT,
        quietHours: prefs.quietHours as QuietHoursDto | null,
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
        weeklyDigestEnabled: preferences.weeklyDigestEnabled ?? true,
        digestFrequency: preferences.digestFrequency || DigestFrequency.INSTANT,
        quietHours: preferences.quietHours || null,
        types: preferences.types || this.getDefaultTypes(),
      },
      update: {
        ...(preferences.inAppEnabled !== undefined && { inAppEnabled: preferences.inAppEnabled }),
        ...(preferences.pushEnabled !== undefined && { pushEnabled: preferences.pushEnabled }),
        ...(preferences.emailEnabled !== undefined && { emailEnabled: preferences.emailEnabled }),
        ...(preferences.weeklyDigestEnabled !== undefined && { weeklyDigestEnabled: preferences.weeklyDigestEnabled }),
        ...(preferences.digestFrequency && { digestFrequency: preferences.digestFrequency }),
        ...(preferences.quietHours !== undefined && { quietHours: preferences.quietHours }),
        ...(preferences.types && { types: preferences.types }),
      },
    });
  }

  isInQuietHours(quietHours: QuietHoursDto | null): boolean {
    if (!quietHours) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    // Handle same-day quiet hours (e.g., 13:00 - 14:00)
    return currentHour >= startHour && currentHour < endHour;
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
      weeklyDigestEnabled: true,
      digestFrequency: DigestFrequency.INSTANT,
      quietHours: { startHour: 22, endHour: 8 },
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
      JOB_APPLICATION: true,
      MESSAGE: true,
    };
  }
}
