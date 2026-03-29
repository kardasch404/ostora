import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DigestService {
  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyDigest() {
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      const unreadCount = await this.notificationService.getUnreadCount(user.id);
      
      if (unreadCount > 0) {
        await this.notificationService.create({
          userId: user.id,
          type: 'DIGEST',
          title: 'Daily Summary',
          message: `You have ${unreadCount} unread notifications`,
          metadata: { digestType: 'daily' },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyDigest() {
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      const weeklyStats = await this.getWeeklyStats(user.id);
      
      await this.notificationService.create({
        userId: user.id,
        type: 'DIGEST',
        title: 'Weekly Summary',
        message: `This week: ${weeklyStats.applications} applications, ${weeklyStats.matches} matches`,
        metadata: { digestType: 'weekly', ...weeklyStats },
      });
    }
  }

  private async getActiveUsers() {
    // Mock - integrate with user-service via Kafka/HTTP
    return [];
  }

  private async getWeeklyStats(userId: string) {
    return {
      applications: 0,
      matches: 0,
      messages: 0,
    };
  }
}
