import { Module } from '@nestjs/common';
import { ProfileSettingsController } from './profile-settings.controller';
import { ProfileSettingsService } from './profile-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ProfileSettingsController],
  providers: [ProfileSettingsService],
  exports: [ProfileSettingsService],
})
export class ProfileSettingsModule {}
