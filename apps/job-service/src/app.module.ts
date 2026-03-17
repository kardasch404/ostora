import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { JobModule } from './job/job.module';
import { KafkaModule } from './kafka/kafka.module';
import { ApplicationModule } from './application/application.module';
import { FavoriteController } from './favorite/favorite.controller';
import { FavoriteService } from './favorite/favorite.service';
import { CompanyService } from './company/company.service';
import { MySQLReaderService } from './sync/mysql-reader.service';
import { JobSyncService } from './sync/job-sync.service';
import { SyncCron } from './sync/sync.cron';
import { ElasticsearchService } from './search/elasticsearch.service';
import { JobIndexingService } from './search/job-indexing.service';
import { JobEventListener } from './kafka/job-event.listener';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6345,
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    KafkaModule,
    JobModule,
    ApplicationModule,
  ],
  controllers: [FavoriteController],
  providers: [
    FavoriteService,
    CompanyService,
    MySQLReaderService,
    JobSyncService,
    SyncCron,
    ElasticsearchService,
    JobIndexingService,
    JobEventListener,
  ],
})
export class AppModule {}
