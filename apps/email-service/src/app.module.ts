import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { EmailEventConsumer } from './kafka/email-event.consumer';
import { EmailProcessor } from './queue/email.processor';
import { EMAIL_QUEUE } from './queue/email.queue';
import { TemplateRendererService } from './template/template-renderer.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6345,
        },
      }),
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
    PrismaModule,
    EmailModule,
  ],
  providers: [EmailEventConsumer, EmailProcessor, TemplateRendererService],
})
export class AppModule {}
