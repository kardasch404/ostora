import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { AuditService } from '../../audit/audit.service';
import { AuthEventPublisher } from '../events/auth.event-publisher';
import { TokenPair } from '../interfaces/token-pair.interface';
import { DeviceInfo } from '../interfaces/device-info.interface';
import * as crypto from 'crypto';
import { AuditEvent } from '../../audit/audit-event.enum';

interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private auditService: AuditService,
    private eventPublisher: AuthEventPublisher,
  ) {}

  async handleOAuthLogin(
    profile: OAuthProfile,
    deviceInfo: DeviceInfo,
  ): Promise<TokenPair> {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: { include: { role: true } } },
    });

    let user;

    if (existingAccount) {
      user = existingAccount.user;
      await this.prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        },
      });
    } else {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
        include: { role: true },
      });

      if (existingUser) {
        user = existingUser;
        await this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
          },
        });

        await this.auditService.log(
          AuditEvent.REGISTER,
          user.id,
          'oauth_account',
          null,
          { provider: profile.provider, action: 'OAUTH_LINKED' },
          deviceInfo.ip,
          deviceInfo.userAgent,
        );
      } else {
        const userRole = await this.prisma.role.findUnique({
          where: { name: 'USER' },
        });

        const randomPassword = crypto.randomBytes(32).toString('hex');

        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: profile.avatar,
            password: randomPassword,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            roleId: userRole?.id,
            oauthAccounts: {
              create: {
                provider: profile.provider,
                providerAccountId: profile.providerAccountId,
                accessToken: profile.accessToken,
                refreshToken: profile.refreshToken,
              },
            },
          },
          include: { role: true },
        });

        await this.auditService.log(
          AuditEvent.REGISTER,
          user.id,
          'user',
          null,
          { provider: profile.provider, action: 'OAUTH_REGISTER' },
          deviceInfo.ip,
          deviceInfo.userAgent,
        );

        await this.eventPublisher.publishUserRegistered({
          userId: user.id,
          email: user.email,
          provider: profile.provider,
        });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: deviceInfo.ip,
      },
    });

    const permissions: string[] = [];
    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role?.name || 'USER',
      permissions,
      deviceInfo.fingerprint,
    );

    await this.auditService.log(
      AuditEvent.LOGIN_SUCCESS,
      user.id,
      'user',
      null,
      { provider: profile.provider, action: 'OAUTH_LOGIN' },
      deviceInfo.ip,
      deviceInfo.userAgent,
    );

    await this.eventPublisher.publishUserLogin({
      userId: user.id,
      email: user.email,
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    return tokens;
  }
}
