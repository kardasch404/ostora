import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RegisterFcmTokenDto } from '../notification/dto/register-fcm-token.dto';

@Injectable()
export class FcmTokenService {
  private readonly logger = new Logger(FcmTokenService.name);
  private prisma = new PrismaClient();

  async registerToken(dto: RegisterFcmTokenDto) {
    try {
      // Check if token already exists
      const existing = await this.prisma.fcmToken.findFirst({
        where: {
          userId: dto.userId,
          token: dto.fcmToken,
        },
      });

      if (existing) {
        // Update last used timestamp
        return this.prisma.fcmToken.update({
          where: { id: existing.id },
          data: {
            lastUsedAt: new Date(),
            isActive: true,
          },
        });
      }

      // Create new token
      const token = await this.prisma.fcmToken.create({
        data: {
          userId: dto.userId,
          token: dto.fcmToken,
          platform: dto.platform,
          deviceName: dto.deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });

      this.logger.log(`FCM token registered for user: ${dto.userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to register FCM token: ${error.message}`);
      throw error;
    }
  }

  async getUserTokens(userId: string) {
    return this.prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async revokeToken(userId: string, token: string) {
    try {
      await this.prisma.fcmToken.updateMany({
        where: {
          userId,
          token,
        },
        data: {
          isActive: false,
        },
      });

      this.logger.log(`FCM token revoked for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke FCM token: ${error.message}`);
      throw error;
    }
  }

  async markTokenAsInvalid(token: string) {
    try {
      await this.prisma.fcmToken.updateMany({
        where: { token },
        data: { isActive: false },
      });

      this.logger.log(`FCM token marked as invalid: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error(`Failed to mark token as invalid: ${error.message}`);
    }
  }

  async cleanupInactiveTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const result = await this.prisma.fcmToken.deleteMany({
        where: {
          OR: [
            { isActive: false },
            { lastUsedAt: { lt: thirtyDaysAgo } },
          ],
        },
      });

      this.logger.log(`Cleaned up ${result.count} inactive FCM tokens`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to cleanup tokens: ${error.message}`);
      throw error;
    }
  }
}
