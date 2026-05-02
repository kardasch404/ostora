import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateApplicationHistoryDto,
  ApplicationHistoryResponseDto,
  ApplicationHistoryStatsDto,
} from './dto/application-history.dto';

@Injectable()
export class ApplicationHistoryService {
  private readonly logger = new Logger(ApplicationHistoryService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateApplicationHistoryDto,
  ): Promise<ApplicationHistoryResponseDto> {
    try {
      const history = await this.prisma.applicationHistory.create({
        data: {
          userId,
          jobId: dto.jobId,
          jobTitle: dto.jobTitle,
          company: dto.company,
          senderEmail: dto.senderEmail,
          contactEmail: dto.contactEmail,
          subject: dto.subject,
          message: dto.message,
          status: dto.status,
          templateName: dto.templateName,
          sourceUrl: dto.sourceUrl,
          attachments: dto.attachments || [],
          errorMessage: dto.errorMessage,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Application history created: ${history.id} for user ${userId}`);
      return this.mapToResponse(history);
    } catch (error) {
      this.logger.error(`Failed to create application history: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string): Promise<ApplicationHistoryResponseDto[]> {
    const histories = await this.prisma.applicationHistory.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });

    return histories.map((h) => this.mapToResponse(h));
  }

  async findOne(id: string, userId: string): Promise<ApplicationHistoryResponseDto | null> {
    const history = await this.prisma.applicationHistory.findFirst({
      where: { id, userId },
    });

    return history ? this.mapToResponse(history) : null;
  }

  async getStats(userId: string): Promise<ApplicationHistoryStatsDto> {
    const [total, sent, failed, emailAccountsResult, companiesResult] = await Promise.all([
      this.prisma.applicationHistory.count({ where: { userId } }),
      this.prisma.applicationHistory.count({ where: { userId, status: 'sent' } }),
      this.prisma.applicationHistory.count({ where: { userId, status: 'failed' } }),
      this.prisma.applicationHistory.findMany({
        where: { userId },
        select: { senderEmail: true },
        distinct: ['senderEmail'],
      }),
      this.prisma.applicationHistory.findMany({
        where: { userId },
        select: { company: true },
        distinct: ['company'],
      }),
    ]);

    return {
      total,
      sent,
      failed,
      emailAccounts: emailAccountsResult.length,
      companies: companiesResult.length,
    };
  }

  async deleteAll(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.applicationHistory.deleteMany({
      where: { userId },
    });

    this.logger.log(`Deleted ${result.count} application histories for user ${userId}`);
    return { count: result.count };
  }

  private mapToResponse(history: any): ApplicationHistoryResponseDto {
    return {
      id: history.id,
      userId: history.userId,
      jobId: history.jobId,
      jobTitle: history.jobTitle,
      company: history.company,
      senderEmail: history.senderEmail,
      contactEmail: history.contactEmail,
      subject: history.subject,
      message: history.message,
      status: history.status,
      sentAt: history.sentAt,
      templateName: history.templateName,
      sourceUrl: history.sourceUrl,
      attachments: history.attachments,
      errorMessage: history.errorMessage,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    };
  }
}
