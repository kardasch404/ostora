import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus, EmailProvider } from '../email/dto/email-log.response';

@Injectable()
export class EmailLogService {
  private readonly logger = new Logger(EmailLogService.name);

  constructor(private prisma: PrismaService) {}

  async record(
    userId: string,
    to: string,
    subject: string,
    status: EmailStatus,
    provider: EmailProvider,
    errorMessage?: string
  ) {
    try {
      await this.prisma.emailLog.create({
        data: {
          userId,
          to,
          subject,
          status,
          provider,
          errorMessage,
          sentAt: new Date(),
        },
      });
      this.logger.log(`Email log recorded: ${to} - ${status}`);
    } catch (error) {
      this.logger.error('Failed to record email log', error);
    }
  }

  async findByUserId(userId: string, limit = 50) {
    return this.prisma.emailLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  async getStats(userId: string) {
    const [sent, failed, retry] = await Promise.all([
      this.prisma.emailLog.count({ where: { userId, status: EmailStatus.SENT } }),
      this.prisma.emailLog.count({ where: { userId, status: EmailStatus.FAILED } }),
      this.prisma.emailLog.count({ where: { userId, status: EmailStatus.RETRY } }),
    ]);

    return { sent, failed, retry, total: sent + failed + retry };
  }
}
