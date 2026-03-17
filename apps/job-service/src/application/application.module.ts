import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationProcessor } from './queue/application.processor';
import { APPLICATION_QUEUE } from './queue/application.queue';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: APPLICATION_QUEUE,
    }),
    KafkaModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationProcessor],
  exports: [ApplicationService],
})
export class ApplicationModule {}
