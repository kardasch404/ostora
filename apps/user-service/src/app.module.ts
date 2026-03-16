import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { EducationModule } from './education/education.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ProfileModule,
    EducationModule,
    // ExperienceModule,
    // SkillModule,
    // LanguageModule,
    // SocialLinkModule,
  ],
})
export class AppModule {}
