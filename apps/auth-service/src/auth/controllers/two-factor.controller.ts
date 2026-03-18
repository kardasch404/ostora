import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from '../services/two-factor.service';
import { OtpService } from '../services/otp.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { Enable2FaDto } from '../dto/enable-2fa.dto';
import { Disable2FaDto } from '../dto/disable-2fa.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { VerifyEmailOtpDto } from '../dto/verify-email-otp.dto';

@ApiTags('Two-Factor Authentication')
@Controller('auth')
export class TwoFactorController {
  constructor(
    private twoFactorService: TwoFactorService,
    private otpService: OtpService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA secret and QR code generated' })
  async enable2fa(@CurrentUser() user: any) {
    return this.twoFactorService.generateSecret(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code and enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2fa(@Body() dto: Enable2FaDto, @CurrentUser() user: any) {
    return this.twoFactorService.verifyAndEnable(user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disable2fa(@Body() dto: Disable2FaDto, @CurrentUser() user: any) {
    return this.twoFactorService.disable(user.userId, dto.password);
  }

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiResponse({ status: 200, description: 'OTP sent if email exists' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP code' })
  @ApiResponse({ status: 429, description: 'Maximum attempts exceeded' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @CurrentUser() user: any) {
    return this.otpService.verifyOtp(user.userId, dto.code);
  }

  @Public()
  @Post('otp/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP code' })
  @ApiResponse({ status: 200, description: 'Email OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP code or invalid request' })
  @ApiResponse({ status: 429, description: 'Maximum attempts exceeded' })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.otpService.verifyOtpByEmail(dto.email, dto.code);
  }
}
