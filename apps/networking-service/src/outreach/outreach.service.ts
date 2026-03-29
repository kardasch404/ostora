import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);
  private prisma = new PrismaClient();

  async createOutreach(data: {
    userId: string;
    recipientEmail: string;
    subject: string;
    message: string;
    type: string;
  }) {
    const outreach = await this.prisma.outreach.create({
      data: {
        userId: data.userId,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        message: data.message,
        type: data.type,
        status: 'PENDING',
      },
    });

    this.logger.log(`Outreach created: ${outreach.id}`);
    return outreach;
  }

  async sendOutreach(outreachId: string) {
    const outreach = await this.prisma.outreach.findUnique({
      where: { id: outreachId },
    });

    if (!outreach) {
      throw new Error('Outreach not found');
    }

    // Integrate with email service via Kafka
    await this.prisma.outreach.update({
      where: { id: outreachId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    this.logger.log(`Outreach sent: ${outreachId}`);
    return outreach;
  }

  async getOutreachHistory(userId: string) {
    return this.prisma.outreach.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackResponse(outreachId: string, response: string) {
    return this.prisma.outreach.update({
      where: { id: outreachId },
      data: {
        status: 'RESPONDED',
        response,
        respondedAt: new Date(),
      },
    });
  }

  async getOutreachStats(userId: string) {
    const total = await this.prisma.outreach.count({ where: { userId } });
    const sent = await this.prisma.outreach.count({
      where: { userId, status: 'SENT' },
    });
    const responded = await this.prisma.outreach.count({
      where: { userId, status: 'RESPONDED' },
    });

    return {
      total,
      sent,
      responded,
      responseRate: sent > 0 ? (responded / sent) * 100 : 0,
    };
  }
}
