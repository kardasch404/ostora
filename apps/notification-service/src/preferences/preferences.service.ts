import { Injectable, Logger } from '@nestjs/common';
import { NotificationPreference, Prisma, PrismaClient } from '@prisma/client';
import { DigestFrequency, QuietHoursDto } from './dto/update-preferences.dto';
import { RedisService } from '../cache/redis.service';

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  weeklyDigestEnabled: boolean;
  digestFrequency: DigestFrequency;
  quietHours: QuietHoursDto | null;
  types: Partial<{
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
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);
  private prisma = new PrismaClient();

  constructor(private readonly redisService: RedisService) {}

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Try Redis cache first
      const cached = await this.redisService.getCachedPreferences(userId);
      if (cached) {
        this.logger.debug(`Preferences loaded from cache for user: ${userId}`);
        return cached;
      }

      // Load from database
      const prefs = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      const preferences = prefs ? this.mapPreferenceRecord(prefs) : this.getDefaultPreferences(userId);

      // Cache for 1 hour
      await this.redisService.cachePreferences(userId, preferences, 3600);

      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences: ${(error as Error).message}`);
      return this.getDefaultPreferences(userId);
    }
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const quietHoursValue =
      preferences.quietHours === undefined
        ? undefined
        : (preferences.quietHours as unknown as Prisma.InputJsonValue | null);

    const typesValue =
      preferences.types === undefined
        ? undefined
        : (preferences.types as unknown as Prisma.InputJsonValue);

    const updated = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        inAppEnabled: preferences.inAppEnabled ?? true,
        pushEnabled: preferences.pushEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? true,
        weeklyDigestEnabled: preferences.weeklyDigestEnabled ?? true,
        digestFrequency: preferences.digestFrequency || DigestFrequency.INSTANT,
        quietHours:
          quietHoursValue === undefined
            ? (null as Prisma.InputJsonValue | null)
            : quietHoursValue,
        types:
          typesValue === undefined
            ? (this.getDefaultTypes() as unknown as Prisma.InputJsonValue)
            : typesValue,
      },
      update: {
        ...(preferences.inAppEnabled !== undefined && { inAppEnabled: preferences.inAppEnabled }),
        ...(preferences.pushEnabled !== undefined && { pushEnabled: preferences.pushEnabled }),
        ...(preferences.emailEnabled !== undefined && { emailEnabled: preferences.emailEnabled }),
        ...(preferences.weeklyDigestEnabled !== undefined && { weeklyDigestEnabled: preferences.weeklyDigestEnabled }),
        ...(preferences.digestFrequency && { digestFrequency: preferences.digestFrequency }),
        ...(quietHoursValue !== undefined && { quietHours: quietHoursValue }),
        ...(typesValue !== undefined && { types: typesValue }),
      },
    });

    // Invalidate cache
    await this.redisService.invalidatePreferences(userId);

    return this.mapPreferenceRecord(updated);
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

  private mapPreferenceRecord(prefs: NotificationPreference): NotificationPreferences {
    return {
      userId: prefs.userId,
      inAppEnabled: prefs.inAppEnabled,
      pushEnabled: prefs.pushEnabled,
      emailEnabled: prefs.emailEnabled,
      weeklyDigestEnabled: prefs.weeklyDigestEnabled ?? true,
      digestFrequency: this.toDigestFrequency(prefs.digestFrequency),
      quietHours: this.toQuietHours(prefs.quietHours),
      types: (prefs.types as NotificationPreferences['types']) || this.getDefaultTypes(),
      createdAt: prefs.createdAt,
      updatedAt: prefs.updatedAt,
    };
  }

  private toDigestFrequency(value: string | null): DigestFrequency {
    if (value === DigestFrequency.DAILY) return DigestFrequency.DAILY;
    if (value === DigestFrequency.WEEKLY) return DigestFrequency.WEEKLY;
    return DigestFrequency.INSTANT;
  }

  private toQuietHours(value: Prisma.JsonValue | null): QuietHoursDto | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const maybe = value as Record<string, unknown>;
    if (typeof maybe.startHour !== 'number' || typeof maybe.endHour !== 'number') {
      return null;
    }

    return {
      startHour: maybe.startHour,
      endHour: maybe.endHour,
    };
  }
}
