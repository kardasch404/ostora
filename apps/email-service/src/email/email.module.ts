import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { TransportFactoryService } from '../transport/transport-factory.service';
import { SesTransport } from '../transport/ses.transport';
import { EmailLogService } from '../log/email-log.service';
import { TemplateRendererService } from '../template/template-renderer.service';

@Module({
  controllers: [EmailController],
  providers: [
    EmailService,
    TransportFactoryService,
    SesTransport,
    EmailLogService,
    TemplateRendererService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
