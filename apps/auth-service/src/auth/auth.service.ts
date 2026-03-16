import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthEventPublisher } from './events/auth.event-publisher';
import { RegisterDto } from './dto/register.dto';
import { Email } from './value-objects/email.vo';
import { Password } from './value-objects/password.vo';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly EMAIL_VERIFY_TTL = 86400; // 24 hours

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventPublisher: AuthEventPublisher,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
    // Validate hCaptcha
    if (this.configService.get('HCAPTCHA_ENABLED', 'true') === 'true') {
      await this.validateHCaptcha(dto.hCaptchaToken);
    }

    // Validate email format
    const email = new Email(dto.email);

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with bcrypt cost 12
    const password = await Password.create(dto.password);

    // Get USER role
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      throw new Error('USER role not found in database');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.value,
        password: password.hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: userRole.id,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Generate email verification token (UUID v4)
    const verificationToken = uuidv4();

    // Store token in Redis with 24h TTL
    await this.redis.set(
      `email-verify:${verificationToken}`,
      user.id,
      this.EMAIL_VERIFY_TTL,
    );

    // Emit Kafka event for email service
    await this.eventPublisher.publishEmailVerificationRequested({
      userId: user.id,
      email: user.email,
      token: verificationToken,
      firstName: user.firstName,
    });

    // Emit user registered event
    await this.eventPublisher.publishUserRegistered({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Validate token from Redis
    const userId = await this.redis.get(`email-verify:${token}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    // Delete token from Redis
    await this.redis.del(`email-verify:${token}`);

    // Emit email verified event
    await this.eventPublisher.publishEmailVerified({
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  private async validateHCaptcha(token?: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('hCaptcha token is required');
    }

    const secret = this.configService.get('HCAPTCHA_SECRET');
    if (!secret) {
      throw new Error('HCAPTCHA_SECRET not configured');
    }

    try {
      const response = await axios.post(
        'https://hcaptcha.com/siteverify',
        new URLSearchParams({
          secret,
          response: token,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      if (!response.data.success) {
        throw new BadRequestException('Invalid hCaptcha token');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('hCaptcha verification failed');
    }
  }
}
