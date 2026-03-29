import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { ChannelRouterService } from '../channels/channel-router.service';

@Injectable()
export class TrialWarningCron {
  private readonly logger = new Logger(TrialWarningCron.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM) // Daily at 10:00 AM
  async checkTrialExpiry() {
    this.logger.log('Starting trial expiry check...');

    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999);

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 2);
      oneDayFromNow.setHours(0, 0, 0, 0);

      const expiringTrials = await this.prisma.subscription.findMany({
        where: {
          plan: 'TRIAL',
          status: 'ACTIVE',
          endDate: {
            gte: oneDayFromNow,
            lte: twoDaysFromNow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            },
          },
        },
      });

      for (const subscription of expiringTrials) {
        const daysLeft = this.calculateDaysLeft(subscription.endDate);

        const notification = await this.notificationService.createNotification({
          userId: subscription.userId,
          type: 'TRIAL_EXPIRING',
          title: 'Trial Expiring Soon',
          message: `Your free trial expires in ${daysLeft} days. Upgrade now to continue!`,
          data: {
            subscriptionId: subscription.id,
            expiryDate: subscription.endDate,
            daysLeft,
          },
          actionUrl: '/pricing',
        });

        await this.channelRouter.route(subscription.userId, notification);

        this.logger.log(`Trial warning sent to user: ${subscription.userId}`);
      }

      this.logger.log(`Trial expiry check completed. Warnings sent: ${expiringTrials.length}`);
    } catch (error) {
      this.logger.error(`Trial expiry check failed: ${error.message}`);
    }
  }

  private calculateDaysLeft(endDate: Date): number {
    const now = new Date();
    const diff = new Date(endDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
