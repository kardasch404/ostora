import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { JobIndexingService } from '../search/job-indexing.service';

@Injectable()
export class JobEventListener implements OnModuleInit {
  private readonly logger = new Logger(JobEventListener.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private config: ConfigService,
    private jobIndexing: JobIndexingService
  ) {
    this.kafka = new Kafka({
      clientId: 'job-service-consumer',
      brokers: [config.get('KAFKA_BROKER', 'localhost:9095')],
    });
    this.consumer = this.kafka.consumer({ groupId: 'job-indexing-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'job.upserted', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          this.logger.log(`Received event: ${event.jobId}`);
          await this.jobIndexing.indexJob(event.jobId);
        } catch (error) {
          this.logger.error('Failed to process job event', error);
        }
      },
    });

    this.logger.log('Job event listener started');
  }
}
