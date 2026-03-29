import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { EmailChannel } from '../channels/email.channel';

@Injectable()
export class WeeklyDigestCron {
  private readonly logger = new Logger(WeeklyDigestCron.name);
  private prisma = new PrismaClient();

  constructor(private readonly emailChannel: EmailChannel) {}

  @Cron('0 9 * * 1') // Every Monday at 9:00 AM
  async sendWeeklyDigest() {
    this.logger.log('Starting weekly digest job...');

    try {
      const users = await this.getActiveUsers();

      for (const user of users) {
        const preferences = await this.getUserPreferences(user.id);

        if (!preferences.emailEnabled || !preferences.weeklyDigestEnabled) {
          continue;
        }

        const weeklyStats = await this.getWeeklyStats(user.id);

        await this.emailChannel.send(user.id, {
          type: 'WEEKLY_DIGEST',
          title: 'Your Weekly Summary',
          message: this.buildWeeklyMessage(weeklyStats),
          data: {
            ...weeklyStats,
            period: 'weekly',
            generatedAt: new Date().toISOString(),
          },
        });

        this.logger.log(`Weekly digest sent to user: ${user.id}`);
      }

      this.logger.log('Weekly digest job completed');
    } catch (error) {
      this.logger.error(`Weekly digest job failed: ${error.message}`);
    }
  }

  private async getActiveUsers() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });
  }

  private async getUserPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return prefs || {
      emailEnabled: true,
      weeklyDigestEnabled: true,
    };
  }

  private async getWeeklyStats(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [applications, jobMatches, notifications] = await Promise.all([
      this.prisma.application.count({
        where: {
          userId,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          type: 'JOB_MATCH',
          createdAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: oneWeekAgo },
        },
      }),
    ]);

    return {
      applications,
      jobMatches,
      totalNotifications: notifications,
      weekStart: oneWeekAgo.toISOString(),
      weekEnd: new Date().toISOString(),
    };
  }

  private buildWeeklyMessage(stats: any): string {
    return `This week: ${stats.applications} applications submitted, ${stats.jobMatches} new job matches, ${stats.totalNotifications} total updates`;
  }
}
