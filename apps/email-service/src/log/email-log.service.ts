import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus, EmailProvider } from '../email/dto/email-log.response';

@Injectable()
export class EmailLogService {
  private readonly logger = new Logger(EmailLogService.name);

  constructor(private prisma: PrismaService) {}

  private get emailLogModel() {
    const model = (this.prisma as any).emailLog;
    if (!model) {
      this.logger.warn('Prisma model emailLog is not available; skipping email log persistence');
      return null;
    }
    return model;
  }

  async record(
    userId: string,
    to: string,
    subject: string,
    status: EmailStatus,
    provider: EmailProvider,
    errorMessage?: string
  ) {
    const emailLog = this.emailLogModel;
    if (!emailLog) {
      return;
    }

    try {
      await emailLog.create({
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
    const emailLog = this.emailLogModel;
    if (!emailLog) {
      return [];
    }

    return emailLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  async getStats(userId: string) {
    const emailLog = this.emailLogModel;
    if (!emailLog) {
      return { sent: 0, failed: 0, retry: 0, total: 0 };
    }

    const [sent, failed, retry] = await Promise.all([
      emailLog.count({ where: { userId, status: EmailStatus.SENT } }),
      emailLog.count({ where: { userId, status: EmailStatus.FAILED } }),
      emailLog.count({ where: { userId, status: EmailStatus.RETRY } }),
    ]);

    return { sent, failed, retry, total: sent + failed + retry };
  }
}
