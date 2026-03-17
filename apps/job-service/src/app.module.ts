import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { JobModule } from './job/job.module';
import { KafkaModule } from './kafka/kafka.module';
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
    PrismaModule,
    RedisModule,
    KafkaModule,
    JobModule,
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
