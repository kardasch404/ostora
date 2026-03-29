import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationGateway } from './gateway/notification.gateway';
import { WsAuthGuard } from './gateway/ws-auth.guard';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { PreferencesController } from './preferences/preferences.controller';
import { PreferencesService } from './preferences/preferences.service';
import { WebSocketChannel } from './channels/websocket.channel';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { ChannelRouterService } from './channels/channel-router.service';
import { NotificationConsumer } from './consumers/notification.consumer';
import { AiEventsConsumer } from './consumers/ai-events.consumer';
import { PaymentEventsConsumer } from './consumers/payment-events.consumer';
import { JobEventsConsumer } from './consumers/job-events.consumer';
import { DigestService } from './digest/digest.service';
import { WeeklyDigestCron } from './digest/weekly-digest.cron';
import { TrialWarningCron } from './digest/trial-warning.cron';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationController, PreferencesController],
  providers: [
    NotificationGateway,
    WsAuthGuard,
    NotificationService,
    PreferencesService,
    // Channels
    WebSocketChannel,
    EmailChannel,
    PushChannel,
    ChannelRouterService,
    // Consumers
    NotificationConsumer,
    AiEventsConsumer,
    PaymentEventsConsumer,
    JobEventsConsumer,
    // Digest & Cron
    DigestService,
    WeeklyDigestCron,
    TrialWarningCron,
  ],
})
export class AppModule {}
