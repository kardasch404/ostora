import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RedisService } from '../cache/redis.service';

export enum NotificationType {
  AI_TASK_COMPLETED = 'AI_TASK_COMPLETED',
  JOB_MATCH = 'JOB_MATCH',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  APPLICATION_UPDATE = 'APPLICATION_UPDATE',
  TRIAL_EXPIRING = 'TRIAL_EXPIRING',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private prisma = new PrismaClient();

  constructor(private readonly redisService: RedisService) {}

  async createNotification(dto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data || {},
          read: false,
        },
      });

      // Increment unread count in Redis
      await this.redisService.incrementUnreadCount(dto.userId);

      this.logger.log(`Notification created: ${notification.id} for user ${dto.userId}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async create(dto: any) {
    return this.createNotification({
      userId: dto.userId,
      type: dto.type as NotificationType,
      title: dto.title,
      message: dto.message,
      data: dto.metadata,
    });
  }

  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getRecentNotifications(userId: string, limit = 10) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Try Redis first
    const cached = await this.redisService.getUnreadCount(userId);
    if (cached !== null) {
      return cached;
    }

    // Fallback to database
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    // Cache the count
    await this.redisService.setUnreadCount(userId, count);

    return count;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.read) {
      await this.redisService.decrementUnreadCount(userId);
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    // Reset unread count in Redis
    await this.redisService.resetUnreadCount(userId);

    return result;
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async deleteAllNotifications(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  // Notification templates
  async notifyAITaskCompleted(userId: string, taskType: string, result: any) {
    return this.createNotification({
      userId,
      type: NotificationType.AI_TASK_COMPLETED,
      title: 'AI Task Completed',
      message: `Your ${taskType} analysis is ready!`,
      data: { taskType, result },
    });
  }

  async notifyJobMatch(userId: string, jobTitle: string, company: string, jobId: string) {
    return this.createNotification({
      userId,
      type: NotificationType.JOB_MATCH,
      title: 'New Job Match',
      message: `${jobTitle} at ${company} matches your profile!`,
      data: { jobId, jobTitle, company },
      actionUrl: `/jobs/${jobId}`,
    });
  }

  async notifyPaymentSuccess(userId: string, amount: number, plan: string) {
    return this.createNotification({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of ${amount} MAD for ${plan} was successful!`,
      data: { amount, plan },
    });
  }

  async notifyPaymentFailed(userId: string, reason: string) {
    return this.createNotification({
      userId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Your payment failed: ${reason}`,
      data: { reason },
      actionUrl: '/billing',
    });
  }

  async notifyTrialExpiring(userId: string, daysLeft: number) {
    return this.createNotification({
      userId,
      type: NotificationType.TRIAL_EXPIRING,
      title: 'Trial Expiring Soon',
      message: `Your free trial expires in ${daysLeft} days. Upgrade now!`,
      data: { daysLeft },
      actionUrl: '/pricing',
    });
  }
}
