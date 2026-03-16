import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  TooManyRequestsException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from './services/token.service';
import { AuthEventPublisher } from './events/auth.event-publisher';
import { LoginDto } from './dto/login.dto';
import { Email } from './value-objects/email.vo';
import { Password } from './value-objects/password.vo';
import { DeviceFingerprint } from './value-objects/device-fingerprint.vo';
import { AuthTokenResponse, UserSummaryResponse } from './responses/auth-token.response';
import { Request } from 'express';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutes
  private readonly FAILED_ATTEMPT_TTL = 1800; // 30 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private tokenService: TokenService,
    private eventPublisher: AuthEventPublisher,
  ) {}

  async login(dto: LoginDto, req: Request): Promise<AuthTokenResponse> {
    // Validate email format
    const email = new Email(dto.email);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.value },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    const lockKey = `lockout:${user.id}`;
    const isLocked = await this.redis.exists(lockKey);

    if (isLocked) {
      throw new TooManyRequestsException('Account temporarily locked due to too many failed attempts');
    }

    // Validate password
    const password = Password.fromHash(user.password);
    const isValidPassword = await password.compare(dto.password);

    if (!isValidPassword) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Validate 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        throw new BadRequestException('2FA code required');
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: dto.totpCode,
        window: 2,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Generate device fingerprint
    const fingerprint = new DeviceFingerprint(req);

    // Detect new device
    if (user.deviceFingerprint && user.deviceFingerprint !== fingerprint.hash) {
      await this.eventPublisher.publishNewDeviceLogin({
        userId: user.id,
        email: user.email,
        ip: this.extractIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        fingerprint: fingerprint.hash,
      });
    }

    // Get permissions
    const permissions = user.role?.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`) || [];

    // Generate token pair
    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role?.name || 'USER',
      permissions,
      fingerprint.hash,
    );

    // Update user last login and fingerprint
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: this.extractIp(req),
        deviceFingerprint: fingerprint.hash,
        loginAttempts: 0,
      },
    });

    // Clear failed attempts
    await this.redis.del(`failed-login:${user.id}`);

    // Emit login event
    await this.eventPublisher.publishUserLogin({
      userId: user.id,
      email: user.email,
      ip: this.extractIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role?.name || 'USER',
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async refresh(refreshToken: string, req: Request): Promise<AuthTokenResponse> {
    // Generate fingerprint
    const fingerprint = new DeviceFingerprint(req);

    // Validate refresh token
    const validation = await this.tokenService.validateRefreshToken(refreshToken, fingerprint.hash);

    if (!validation) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { userId, tokenId } = validation;

    // Get user with role and permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Revoke old refresh token (rotation)
    await this.tokenService.revokeRefreshToken(userId, tokenId);

    // Get permissions
    const permissions = user.role?.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`) || [];

    // Generate new token pair
    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role?.name || 'USER',
      permissions,
      fingerprint.hash,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role?.name || 'USER',
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    const failKey = `failed-login:${userId}`;
    const attempts = await this.redis.incr(failKey);

    if (attempts === 1) {
      await this.redis.expire(failKey, this.FAILED_ATTEMPT_TTL);
    }

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockKey = `lockout:${userId}`;
      await this.redis.set(lockKey, '1', this.LOCKOUT_DURATION);
      await this.redis.del(failKey);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await this.eventPublisher.publishAccountLocked({
          userId: user.id,
          email: user.email,
          reason: 'Too many failed login attempts',
        });
      }
    }
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '0.0.0.0';
  }
}
