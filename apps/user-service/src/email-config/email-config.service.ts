import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailEncryptorService } from './email-encryptor.service';
import { SmtpTesterService } from './smtp-tester.service';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { EmailConfigResponse } from './dto/email-config.response';

@Injectable()
export class EmailConfigService {
  constructor(
    private prisma: PrismaService,
    private encryptor: EmailEncryptorService,
    private smtpTester: SmtpTesterService,
  ) {}

  async create(userId: string, dto: CreateEmailConfigDto): Promise<EmailConfigResponse> {
    // Check if email config already exists
    const existing = await this.prisma.emailConfig.findUnique({
      where: {
        userId_email: {
          userId,
          email: dto.email,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Email configuration already exists');
    }

    // Encrypt password
    const passwordEncrypted = this.encryptor.encrypt(dto.password);

    const config = await this.prisma.emailConfig.create({
      data: {
        userId,
        email: dto.email,
        passwordEncrypted,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        encryption: dto.encryption,
        fromName: dto.fromName,
        isActive: dto.isActive ?? true,
      },
    });

    return this.sanitizeResponse(config);
  }

  async findAll(userId: string): Promise<EmailConfigResponse[]> {
    const configs = await this.prisma.emailConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return configs.map(config => this.sanitizeResponse(config));
  }

  async findOne(userId: string, id: string): Promise<EmailConfigResponse> {
    const config = await this.prisma.emailConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.sanitizeResponse(config);
  }

  async update(userId: string, id: string, dto: Partial<CreateEmailConfigDto>): Promise<EmailConfigResponse> {
    await this.findOne(userId, id);

    const updateData: any = { ...dto };

    if (dto.password) {
      updateData.passwordEncrypted = this.encryptor.encrypt(dto.password);
      delete updateData.password;
    }

    const config = await this.prisma.emailConfig.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeResponse(config);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.emailConfig.delete({
      where: { id },
    });
  }

  async testConnection(userId: string, id: string) {
    const config = await this.prisma.emailConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Decrypt password
    const password = this.encryptor.decrypt(config.passwordEncrypted);

    // Test connection
    const result = await this.smtpTester.testConnection(
      config.email,
      password,
      config.smtpHost,
      config.smtpPort,
      config.encryption as any,
    );

    // Update lastTestedAt if successful
    if (result.success) {
      await this.prisma.emailConfig.update({
        where: { id },
        data: { lastTestedAt: new Date() },
      });
    }

    return result;
  }

  async getProviders() {
    return [
      { name: 'Gmail', value: 'gmail' },
      { name: 'Outlook', value: 'outlook' },
      { name: 'Yahoo', value: 'yahoo' },
      { name: 'GMX', value: 'gmx' },
      { name: 'ProtonMail', value: 'protonmail' },
      { name: 'iCloud', value: 'icloud' },
      { name: 'Zoho', value: 'zoho' },
      { name: 'AOL', value: 'aol' },
      { name: 'Mail.com', value: 'mail.com' },
      { name: 'Yandex', value: 'yandex' },
      { name: 'FastMail', value: 'fastmail' },
      { name: 'Mailgun', value: 'mailgun' },
      { name: 'SendGrid', value: 'sendgrid' },
      { name: 'Office 365', value: 'office365' },
      { name: 'IONOS', value: 'ionos' },
      { name: 'Web.de', value: 'web.de' },
    ];
  }

  async getProviderConfig(provider: string) {
    const config = this.smtpTester.getProviderConfig(provider);
    if (!config) {
      throw new NotFoundException('Provider not found');
    }
    return config;
  }

  private sanitizeResponse(config: any): EmailConfigResponse {
    return {
      ...config,
      password: 'REDACTED',
      passwordEncrypted: undefined,
    };
  }
}
