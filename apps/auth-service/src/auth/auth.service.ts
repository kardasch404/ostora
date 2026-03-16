import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  TooManyRequestsException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from './services/token.service';
import { SessionService } from '../session/session.service';
import { AuditService } from '../audit/audit.service';
import { AuthEventPublisher } from './events/auth.event-publisher';
import { LoginDto } from './dto/login.dto';
import { Email } from './value-objects/email.vo';
import { Password } from './value-objects/password.vo';
import { DeviceFingerprint } from './value-objects/device-fingerprint.vo';
import { AuthTokenResponse } from './responses/auth-token.response';
import { SessionListResponse, SessionResponse } from './responses/session-list.response';
import { Request } from 'express';
import * as speakeasy from 'speakeasy';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutes
  private readonly FAILED_ATTEMPT_TTL = 1800; // 30 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private auditService: AuditService,
    private eventPublisher: AuthEventPublisher,
  ) {}

  async login(dto: LoginDto, req: Request): Promise<AuthTokenResponse> {
    const email = new Email(dto.email);
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

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
      await this.auditService.logLoginFailed(dto.email, ip, userAgent, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const lockKey = `lockout:${user.id}`;
    const isLocked = await this.redis.exists(lockKey);

    if (isLocked) {
      await this.auditService.logLoginFailed(dto.email, ip, userAgent, 'Account locked');
      throw new TooManyRequestsException('Account temporarily locked due to too many failed attempts');
    }

    const password = Password.fromHash(user.password);
    const isValidPassword = await password.compare(dto.password);

    if (!isValidPassword) {
      await this.handleFailedLogin(user.id, dto.email, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.auditService.logLoginFailed(dto.email, ip, userAgent, 'Email not verified');
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.logLoginFailed(dto.email, ip, userAgent, 'Account not active');
      throw new UnauthorizedException('Account is not active');
    }

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
        await this.auditService.logLoginFailed(dto.email, ip, userAgent, 'Invalid 2FA code');
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const fingerprint = new DeviceFingerprint(req);

    if (user.deviceFingerprint && user.deviceFingerprint !== fingerprint.hash) {
      await this.eventPublisher.publishNewDeviceLogin({
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        fingerprint: fingerprint.hash,
      });
      await this.auditService.logNewDevice(user.id, ip, userAgent, fingerprint.hash);
    }

    const permissions = user.role?.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`) || [];

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role?.name || 'USER',
      permissions,
      fingerprint.hash,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        deviceFingerprint: fingerprint.hash,
        loginAttempts: 0,
      },
    });

    await this.redis.del(`failed-login:${user.id}`);

    await this.eventPublisher.publishUserLogin({
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
    });

    await this.auditService.logLoginSuccess(user.id, ip, userAgent, fingerprint.hash);

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

  async logout(refreshToken: string, userId: string, req: Request): Promise<{ message: string }> {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Parse token
    const parts = refreshToken.split('.');
    if (parts.length === 2) {
      const [tokenId, token] = parts;
      const tokenHash = createHash('sha256').update(token).digest('hex');

      // Blacklist the refresh token
      await this.sessionService.blacklistToken(tokenHash, 604800); // 7 days

      // Revoke the session
      await this.sessionService.revokeSession(userId, tokenId);

      await this.auditService.logTokenBlacklist(userId, tokenHash, ip, userAgent);
    }

    await this.auditService.logLogout(userId, ip, userAgent);

    return { message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string, req: Request): Promise<AuthTokenResponse> {
    const fingerprint = new DeviceFingerprint(req);
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const validation = await this.tokenService.validateRefreshToken(refreshToken, fingerprint.hash);

    if (!validation) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { userId, tokenId } = validation;

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

    await this.tokenService.revokeRefreshToken(userId, tokenId);

    const permissions = user.role?.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`) || [];

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role?.name || 'USER',
      permissions,
      fingerprint.hash,
    );

    await this.auditService.logTokenRefresh(userId, ip, userAgent);

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

  async getSessions(userId: string, currentFingerprint: string): Promise<SessionListResponse> {
    const sessions = await this.sessionService.getAllUserSessions(userId);

    const sessionResponses: SessionResponse[] = sessions.map((session) => ({
      id: session.tokenId,
      device: session.device,
      browser: session.browser,
      ip: session.ip,
      lastSeenAt: session.lastSeenAt,
      isCurrent: session.fingerprint === currentFingerprint,
    }));

    return {
      sessions: sessionResponses,
      total: sessionResponses.length,
    };
  }

  async revokeSession(userId: string, sessionId: string, req: Request): Promise<{ message: string }> {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const revoked = await this.sessionService.revokeSession(userId, sessionId);

    if (!revoked) {
      throw new NotFoundException('Session not found');
    }

    await this.auditService.logSessionRevoke(userId, sessionId, ip, userAgent);

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string, req: Request): Promise<{ message: string; count: number }> {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const count = await this.sessionService.revokeAllSessions(userId);

    await this.auditService.logLogoutAll(userId, ip, userAgent);

    return {
      message: 'All sessions revoked successfully',
      count,
    };
  }

  private async handleFailedLogin(userId: string, email: string, ip: string, userAgent: string): Promise<void> {
    const failKey = `failed-login:${userId}`;
    const attempts = await this.redis.incr(failKey);

    if (attempts === 1) {
      await this.redis.expire(failKey, this.FAILED_ATTEMPT_TTL);
    }

    await this.auditService.logLoginFailed(email, ip, userAgent, `Failed attempt ${attempts}`);

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockKey = `lockout:${userId}`;
      await this.redis.set(lockKey, '1', this.LOCKOUT_DURATION);
      await this.redis.del(failKey);

      await this.eventPublisher.publishAccountLocked({
        userId,
        email,
        reason: 'Too many failed login attempts',
      });

      await this.auditService.logAccountLock(userId, ip, userAgent, 'Too many failed login attempts');
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
