import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { MySQLModule } from '../mysql/mysql.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [MySQLModule, RedisModule],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
