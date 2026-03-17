import { Module } from '@nestjs/common';
import { MessageTemplateController } from './template.controller';
import { MessageTemplateService } from './template.service';
import { TemplateRendererService } from './template-renderer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessageTemplateController],
  providers: [MessageTemplateService, TemplateRendererService],
  exports: [MessageTemplateService, TemplateRendererService],
})
export class MessageTemplateModule {}
