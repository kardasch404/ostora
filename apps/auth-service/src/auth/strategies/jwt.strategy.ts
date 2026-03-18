// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionService } from '../../session/session.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { createHash } from 'crypto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'secret',
      algorithms: ['HS256'],
      issuer: 'ostora-auth-service',
      audience: 'ostora-platform',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new Error('Token not found');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const isBlacklisted = await this.sessionService.isTokenBlacklisted(tokenHash);

    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Validate user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
      throw new Error('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Validate fingerprint from request
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = this.extractIp(req);
    const subnet = this.getSubnet(ip);
    const currentFingerprint = createHash('sha256')
      .update(`${userAgent}|${subnet}`)
      .digest('hex');

    if (currentFingerprint !== payload.fingerprint) {
      throw new Error('Invalid device fingerprint');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'USER',
      permissions: payload.permissions,
      fingerprint: payload.fingerprint,
    };
  }

  private extractIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
  }

  private getSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
  }
}
