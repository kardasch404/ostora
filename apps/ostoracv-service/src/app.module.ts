import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CvController } from './cv/cv.controller';
import { CvService } from './cv/cv.service';
import { CoverLetterController } from './cover-letter/cover-letter.controller';
import { CoverLetterService } from './cover-letter/cover-letter.service';
import { InternalController } from './internal/internal.controller';
import { InternalAuthGuard } from './internal/internal-auth.guard';
import { PuppeteerService } from './renderer/puppeteer.service';
import { TemplateRegistryService } from './renderer/template-registry.service';
import { S3Service } from './storage/s3.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [CvController, CoverLetterController, InternalController, HealthController],
  providers: [CvService, CoverLetterService, InternalAuthGuard, PuppeteerService, TemplateRegistryService, S3Service],
})
export class AppModule {}
