import { Injectable, BadRequestException, TooManyRequestsException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuthEventPublisher } from '../events/auth.event-publisher';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 600; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventPublisher: AuthEventPublisher,
  ) {}

  async sendOtp(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, an OTP has been sent' };
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Store OTP in Redis with attempts counter
    await this.redis.set(
      `otp:${user.id}`,
      JSON.stringify({
        code: otp,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      this.OTP_TTL,
    );

    // Emit Kafka event for email-service
    this.eventPublisher.publishOtpRequested({
      userId: user.id,
      email: user.email,
      code: otp,
      firstName: user.firstName,
    });

    return { message: 'If the email exists, an OTP has been sent' };
  }

  async verifyOtp(userId: string, code: string): Promise<{ message: string }> {
    const otpData = await this.redis.get(`otp:${userId}`);

    if (!otpData) {
      throw new BadRequestException('OTP not found or expired');
    }

    const { code: storedCode, attempts } = JSON.parse(otpData);

    // Check max attempts
    if (attempts >= this.MAX_ATTEMPTS) {
      await this.redis.del(`otp:${userId}`);
      throw new TooManyRequestsException('Maximum OTP attempts exceeded');
    }

    // Verify code
    if (code !== storedCode) {
      // Increment attempts
      await this.redis.set(
        `otp:${userId}`,
        JSON.stringify({
          code: storedCode,
          attempts: attempts + 1,
          createdAt: new Date().toISOString(),
        }),
        this.OTP_TTL,
      );

      throw new BadRequestException('Invalid OTP code');
    }

    // Delete OTP after successful verification
    await this.redis.del(`otp:${userId}`);

    return { message: 'OTP verified successfully' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
