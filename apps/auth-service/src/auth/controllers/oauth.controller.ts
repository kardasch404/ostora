import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GoogleAuthGuard, LinkedInAuthGuard, GithubAuthGuard } from '../guards/oauth.guard';
import { OAuthService } from '../services/oauth.service';
import { Public } from '../decorators/public.decorator';
import { DeviceFingerprint } from '../value-objects/device-fingerprint.vo';
import { DeviceInfo } from '../interfaces/device-info.interface';

@ApiTags('OAuth')
@Controller('auth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const deviceInfo: DeviceInfo = {
      ip: req.ip || req.socket.remoteAddress || '0.0.0.0',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      fingerprint: new DeviceFingerprint(req).hash,
    };

    const tokens = await this.oauthService.handleOAuthLogin(req.user as any, deviceInfo);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080/dashboard');
  }

  @Public()
  @Get('linkedin')
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'Initiate LinkedIn OAuth login' })
  async linkedinAuth() {}

  @Public()
  @Get('linkedin/callback')
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  async linkedinAuthCallback(@Req() req: Request, @Res() res: Response) {
    const deviceInfo: DeviceInfo = {
      ip: req.ip || req.socket.remoteAddress || '0.0.0.0',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      fingerprint: new DeviceFingerprint(req).hash,
    };

    const tokens = await this.oauthService.handleOAuthLogin(req.user as any, deviceInfo);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080/dashboard');
  }

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  async githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const deviceInfo: DeviceInfo = {
      ip: req.ip || req.socket.remoteAddress || '0.0.0.0',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      fingerprint: new DeviceFingerprint(req).hash,
    };

    const tokens = await this.oauthService.handleOAuthLogin(req.user as any, deviceInfo);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080/dashboard');
  }
}
