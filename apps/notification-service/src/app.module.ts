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
import { ChannelRouterService } from './channels/channel-router.service';
import { NotificationConsumer } from './consumers/notification.consumer';
import { DigestService } from './digest/digest.service';

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
    WebSocketChannel,
    ChannelRouterService,
    NotificationConsumer,
    DigestService,
  ],
})
export class AppModule {}
