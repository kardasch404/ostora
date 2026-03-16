import { Module } from '@nestjs/common';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { EmailEncryptorService } from './email-encryptor.service';
import { SmtpTesterService } from './smtp-tester.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmailConfigController],
  providers: [EmailConfigService, EmailEncryptorService, SmtpTesterService],
  exports: [EmailConfigService, EmailEncryptorService],
})
export class EmailConfigModule {}
