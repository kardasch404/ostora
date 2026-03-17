import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobDedupService } from './job-dedup.service';
import { ElasticsearchService } from '../search/elasticsearch.service';

@Module({
  controllers: [JobController],
  providers: [JobService, JobDedupService, ElasticsearchService],
  exports: [JobService, JobDedupService],
})
export class JobModule {}
