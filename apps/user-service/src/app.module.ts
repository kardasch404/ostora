import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { EducationModule } from './education/education.module';
import { MessageTemplateModule } from './message-template/template.module';
import { EmailConfigModule } from './email-config/email-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ProfileModule,
    EducationModule,
    MessageTemplateModule,
    EmailConfigModule,
    // ExperienceModule,
    // SkillModule,
    // LanguageModule,
    // SocialLinkModule,
  ],
})
export class AppModule {}
