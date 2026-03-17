import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobDedupService } from './job-dedup.service';
import { ElasticsearchService } from '../search/elasticsearch.service';
import { JobIndexingService } from '../search/job-indexing.service';

@Module({
  controllers: [JobController],
  providers: [JobService, JobDedupService, ElasticsearchService, JobIndexingService],
  exports: [JobService, JobDedupService, JobIndexingService],
})
export class JobModule {}
