import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { EducationModule } from './education/education.module';
import { MessageTemplateModule } from './message-template/template.module';
import { EmailConfigModule } from './email-config/email-config.module';
import { BundleModule } from './bundle/bundle.module';
import { RedisModule } from './redis/redis.module';
import { SocialModule } from './social/social.module';
import { ProfileSettingsModule } from './profile-settings/profile-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    ProfileModule,
    EducationModule,
    MessageTemplateModule,
    EmailConfigModule,
    BundleModule,
    SocialModule,
    ProfileSettingsModule,
    // ExperienceModule,
    // SkillModule,
    // LanguageModule,
    // SocialLinkModule,
  ],
})
export class AppModule {}
