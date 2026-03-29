import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  private prisma = new PrismaClient();

  async createCampaign(data: {
    userId: string;
    name: string;
    type: string;
    targetList: string[];
    template: string;
    schedule?: Date;
  }) {
    return this.prisma.campaign.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        targetList: data.targetList,
        template: data.template,
        schedule: data.schedule,
        status: 'DRAFT',
      },
    });
  }

  async startCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    this.logger.log(`Campaign started: ${campaignId}`);
    return campaign;
  }

  async pauseCampaign(campaignId: string) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });
  }

  async getCampaigns(userId: string) {
    return this.prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignStats(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      total: campaign.targetList.length,
      sent: 0, // Calculate from outreach records
      responded: 0,
      status: campaign.status,
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledCampaigns() {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        schedule: { lte: new Date() },
      },
    });

    for (const campaign of campaigns) {
      this.logger.log(`Processing campaign: ${campaign.id}`);
      // Process campaign outreach
    }
  }
}
