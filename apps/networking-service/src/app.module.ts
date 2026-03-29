import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LinkedInController } from './linkedin/linkedin.controller';
import { LinkedInService } from './linkedin/linkedin.service';
import { OutreachController } from './outreach/outreach.controller';
import { OutreachService } from './outreach/outreach.service';
import { CampaignController } from './campaign/campaign.controller';
import { CampaignService } from './campaign/campaign.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [LinkedInController, OutreachController, CampaignController],
  providers: [LinkedInService, OutreachService, CampaignService],
})
export class AppModule {}
