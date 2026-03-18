import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Password } from '../value-objects/password.vo';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Ostora (${user.email})`,
      issuer: 'Ostora',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Store temporary secret in Redis (10 minutes)
    await this.redis.set(
      `2fa-setup:${userId}`,
      JSON.stringify({
        secret: secret.base32,
        backupCodes,
      }),
      600,
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  async verifyAndEnable(userId: string, code: string): Promise<{ message: string }> {
    const setupData = await this.redis.get(`2fa-setup:${userId}`);

    if (!setupData) {
      throw new BadRequestException('2FA setup not initiated or expired');
    }

    const { secret } = JSON.parse(setupData);

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Save secret to database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    // Delete setup data from Redis
    await this.redis.del(`2fa-setup:${userId}`);

    return { message: '2FA enabled successfully' };
  }

  async disable(userId: string, password: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify password
    const passwordVO = Password.fromHash(user.password);
    const isValid = await passwordVO.compare(password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
