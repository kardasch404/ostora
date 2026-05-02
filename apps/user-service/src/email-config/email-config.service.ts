import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
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
    // Support both 'password' and 'appPassword' field names
    const password = dto.password || dto.appPassword;
    if (!password) {
      throw new BadRequestException('Password or appPassword is required');
    }

    // Auto-detect SMTP settings if not provided
    const smtpConfig = this.autoDetectSmtpConfig(dto.email, dto);

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
      throw new ConflictException('Email configuration already exists');
    }

    // Encrypt password
    const passwordEncrypted = this.encryptor.encrypt(password);

    const config = await this.prisma.emailConfig.create({
      data: {
        userId,
        email: dto.email,
        passwordEncrypted,
        smtpHost: smtpConfig.smtpHost,
        smtpPort: smtpConfig.smtpPort,
        encryption: smtpConfig.encryption,
        fromName: smtpConfig.fromName,
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
    const normalizedProvider = dto.provider?.toLowerCase().trim();
    delete updateData.provider;

    if (normalizedProvider && normalizedProvider !== 'custom' && !dto.smtpHost && !dto.smtpPort && !dto.encryption) {
      const providerConfig = this.smtpTester.getProviderConfig(normalizedProvider);
      if (!providerConfig) {
        throw new BadRequestException(`Unsupported provider: ${normalizedProvider}`);
      }
      updateData.smtpHost = providerConfig.host;
      updateData.smtpPort = providerConfig.port;
      updateData.encryption = providerConfig.encryption;
    }

    const password = dto.password || dto.appPassword;
    if (password) {
      updateData.passwordEncrypted = this.encryptor.encrypt(password);
      delete updateData.password;
      delete updateData.appPassword;
    }

    const config = await this.prisma.emailConfig.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeResponse(config);
  }

  async remove(userId: string, id: string): Promise<void> {
    const toDelete = await this.findOne(userId, id);

    await this.prisma.emailConfig.delete({
      where: { id },
    });

    if (toDelete.isActive) {
      const fallback = await this.prisma.emailConfig.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (fallback) {
        await this.prisma.emailConfig.update({
          where: { id: fallback.id },
          data: { isActive: true },
        });
      }
    }
  }

  async setDefault(userId: string, id: string): Promise<EmailConfigResponse> {
    await this.findOne(userId, id);

    await this.prisma.$transaction([
      this.prisma.emailConfig.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.emailConfig.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    const config = await this.prisma.emailConfig.findUnique({ where: { id } });
    return this.sanitizeResponse(config);
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
    return this.smtpTester.getSupportedProviders();
  }

  async getProviderConfig(provider: string) {
    const config = this.smtpTester.getProviderConfig(provider);
    if (!config) {
      throw new NotFoundException('Provider not found');
    }
    return config;
  }

  async resolveSenderSmtpConfig(userId: string, email?: string) {
    const config = email
      ? await this.prisma.emailConfig.findFirst({
          where: { userId, email },
        })
      : await this.prisma.emailConfig.findFirst({
          where: { userId, isActive: true },
          orderBy: { updatedAt: 'desc' },
        });

    if (!config) {
      throw new NotFoundException(email ? 'Sender email configuration not found' : 'No active sender email configuration found');
    }

    const smtpPassword = this.encryptor.decrypt(config.passwordEncrypted);

    return {
      emailConfigId: config.id,
      provider: this.smtpTester.inferProvider(config.email, config.smtpHost),
      fromEmail: config.email,
      fromName: config.fromName,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.encryption === 'SSL',
      smtpUser: config.email,
      smtpPassword,
    };
  }

  private autoDetectSmtpConfig(email: string, dto: CreateEmailConfigDto) {
    const username = email.split('@')[0];
    const domain = email.split('@')[1]?.toLowerCase();
    const normalizedProvider = dto.provider?.toLowerCase().trim();

    // Use provided values when custom SMTP is fully supplied.
    if (dto.smtpHost && dto.smtpPort && dto.encryption) {
      return {
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        encryption: dto.encryption,
        fromName: dto.fromName || username,
      };
    }

    let detected = null;

    if (normalizedProvider && normalizedProvider !== 'custom') {
      detected = this.smtpTester.getProviderConfig(normalizedProvider);
      if (!detected) {
        throw new BadRequestException(`Unsupported provider: ${normalizedProvider}`);
      }
    }

    if (!detected) {
      if (!domain) {
        throw new BadRequestException('Invalid sender email domain');
      }
      detected = this.smtpTester.getProviderConfigByDomain(domain);
    }

    if (!detected) {
      throw new BadRequestException(
        `Unable to auto-detect SMTP settings for ${domain}. Please provide smtpHost, smtpPort, and encryption manually.`
      );
    }

    return {
      smtpHost: dto.smtpHost || detected.host,
      smtpPort: dto.smtpPort || detected.port,
      encryption: dto.encryption || detected.encryption,
      fromName: dto.fromName || username,
    };
  }

  private sanitizeResponse(config: any): EmailConfigResponse {
    return {
      ...config,
      provider: this.smtpTester.inferProvider(config.email, config.smtpHost),
      password: 'REDACTED',
      passwordEncrypted: undefined,
    };
  }
}
