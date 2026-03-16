import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BundleController } from './bundle.controller';
import { BundleService } from './bundle.service';
import { S3Service } from './s3.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [BundleController],
  providers: [BundleService, S3Service],
  exports: [BundleService, S3Service],
})
export class BundleModule {}
