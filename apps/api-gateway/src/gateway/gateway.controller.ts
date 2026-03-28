import { Controller, Post, Get, Put, Delete, Body, Param, Query, Inject, UseGuards, Version, Req, UnauthorizedException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

const isDevelopment = (process.env['NODE_ENV'] || 'development') !== 'production';
const authThrottleLimit = parseInt(
  process.env['THROTTLE_AUTH_LIMIT'] || (isDevelopment ? '2000' : '5'),
  10,
);
const authThrottleTtl = parseInt(process.env['THROTTLE_AUTH_TTL'] || '60000', 10);

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @Inject('USER_SERVICE') private readonly userClient: ClientKafka,
    @Inject('JOB_SERVICE') private readonly jobClient: ClientKafka,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientKafka,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientKafka,
    @Inject('AI_SERVICE') private readonly aiClient: ClientKafka,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientKafka,
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Connect to Kafka topics
    const services = [
      this.authClient,
      this.userClient,
      this.jobClient,
      this.emailClient,
      this.paymentClient,
      this.aiClient,
      this.notificationClient,
      this.analyticsClient,
    ];

    for (const service of services) {
      await service.connect();
    }
  }

  // ==================== AUTH ROUTES ====================
  @Post('auth/register')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Throttle({ auth: { limit: authThrottleLimit, ttl: authThrottleTtl } })
  async register(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.register', dto));
  }

  @Post('auth/login')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Throttle({ auth: { limit: authThrottleLimit, ttl: authThrottleTtl } })
  async login(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.login', dto));
  }

  @Post('auth/refresh')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.refresh', dto));
  }

  @Post('auth/logout')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth('JWT-auth')
  async logout(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.logout', dto));
  }

  @Post('auth/forgot-password')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Request password reset' })
  @Throttle({ auth: { limit: authThrottleLimit, ttl: authThrottleTtl } })
  async forgotPassword(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.forgotPassword', dto));
  }

  @Post('auth/reset-password')
  @Version('1')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: any) {
    return firstValueFrom(this.authClient.send('auth.resetPassword', dto));
  }

  // ==================== USER ROUTES ====================
  @Get('users/profile')
  @Version('1')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth('JWT-auth')
  async getUserProfile(@Query('userId') userId: string) {
    return firstValueFrom(this.userClient.send('user.getProfile', { userId }));
  }

  @Get('users/me')
  @Version('1')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  async getCurrentUserProfile(@Req() req: Request, @Query('userId') userId?: string) {
    const resolvedUserId = userId || this.extractUserIdFromAuthHeader(req);

    if (!resolvedUserId) {
      throw new UnauthorizedException('Missing or invalid user identity');
    }

    return firstValueFrom(this.userClient.send('user.getProfile', { userId: resolvedUserId }));
  }

  @Put('users/profile')
  @Version('1')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth('JWT-auth')
  async updateUserProfile(@Body() dto: any) {
    return firstValueFrom(this.userClient.send('user.updateProfile', dto));
  }

  @Post('users/documents')
  @Version('1')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Upload user document (CV, Resume)' })
  @ApiBearerAuth('JWT-auth')
  async uploadDocument(@Body() dto: any) {
    return firstValueFrom(this.userClient.send('user.uploadDocument', dto));
  }

  @Get('users/documents')
  @Version('1')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Get user documents' })
  @ApiBearerAuth('JWT-auth')
  async getUserDocuments(@Query('userId') userId: string) {
    return firstValueFrom(this.userClient.send('user.getDocuments', { userId }));
  }

  // ==================== JOB ROUTES ====================
  @Get('jobs/categories')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Get job categories' })
  async getJobCategories() {
    return firstValueFrom(this.jobClient.send('job.getCategories', {}));
  }

  @Get('jobs')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Search jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async searchJobs(@Query() query: any) {
    return firstValueFrom(this.jobClient.send('job.search', query));
  }

  @Get('jobs/:id')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Get job by ID' })
  async getJobById(@Param('id') id: string) {
    return firstValueFrom(this.jobClient.send('job.getById', { id }));
  }

  @Post('jobs/:id/apply')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Apply to job' })
  @ApiBearerAuth('JWT-auth')
  async applyToJob(@Param('id') jobId: string, @Body() dto: any) {
    return firstValueFrom(this.jobClient.send('job.apply', { jobId, ...dto }));
  }

  @Post('jobs/:id/save')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Save job for later' })
  @ApiBearerAuth('JWT-auth')
  async saveJob(@Param('id') jobId: string, @Body() dto: any) {
    return firstValueFrom(this.jobClient.send('job.save', { jobId, ...dto }));
  }

  @Get('jobs/applications/my')
  @Version('1')
  @ApiTags('Jobs')
  @ApiOperation({ summary: 'Get my job applications' })
  @ApiBearerAuth('JWT-auth')
  async getMyApplications(@Query('userId') userId: string) {
    return firstValueFrom(this.jobClient.send('job.getMyApplications', { userId }));
  }

  // ==================== EMAIL ROUTES ====================
  @Post('email/send')
  @Version('1')
  @ApiTags('Email')
  @ApiOperation({ summary: 'Send email' })
  @ApiBearerAuth('JWT-auth')
  async sendEmail(@Body() dto: any, @Req() req: Request) {
    const userId = this.extractUserIdFromAuthHeader(req) || 'anonymous';
    return firstValueFrom(this.emailClient.send('email.send', { ...dto, userId }));
  }

  // ==================== PAYMENT ROUTES ====================
  @Post('payments/create-intent')
  @Version('1')
  @ApiTags('Payments')
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiBearerAuth('JWT-auth')
  async createPaymentIntent(@Body() dto: any) {
    return firstValueFrom(this.paymentClient.send('payment.createIntent', dto));
  }

  @Post('payments/webhook')
  @Version('1')
  @ApiTags('Payments')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(@Body() dto: any) {
    return firstValueFrom(this.paymentClient.send('payment.webhook', dto));
  }

  @Get('payments/subscriptions')
  @Version('1')
  @ApiTags('Payments')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiBearerAuth('JWT-auth')
  async getSubscriptions(@Query('userId') userId: string) {
    return firstValueFrom(this.paymentClient.send('payment.getSubscriptions', { userId }));
  }

  // ==================== AI ROUTES ====================
  @Post('ai/analyze-cv')
  @Version('1')
  @ApiTags('AI')
  @ApiOperation({ summary: 'Analyze CV with AI' })
  @ApiBearerAuth('JWT-auth')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async analyzeCV(@Body() dto: any) {
    return firstValueFrom(this.aiClient.send('ai.analyzeCV', dto));
  }

  @Post('ai/generate-cover-letter')
  @Version('1')
  @ApiTags('AI')
  @ApiOperation({ summary: 'Generate cover letter with AI' })
  @ApiBearerAuth('JWT-auth')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async generateCoverLetter(@Body() dto: any) {
    return firstValueFrom(this.aiClient.send('ai.generateCoverLetter', dto));
  }

  @Post('ai/match-jobs')
  @Version('1')
  @ApiTags('AI')
  @ApiOperation({ summary: 'AI-powered job matching' })
  @ApiBearerAuth('JWT-auth')
  async matchJobs(@Body() dto: any) {
    return firstValueFrom(this.aiClient.send('ai.matchJobs', dto));
  }

  // ==================== NOTIFICATION ROUTES ====================
  @Get('notifications')
  @Version('1')
  @ApiTags('Notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiBearerAuth('JWT-auth')
  async getNotifications(@Query('userId') userId: string) {
    return firstValueFrom(this.notificationClient.send('notification.getAll', { userId }));
  }

  @Put('notifications/:id/read')
  @Version('1')
  @ApiTags('Notifications')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiBearerAuth('JWT-auth')
  async markAsRead(@Param('id') id: string) {
    return firstValueFrom(this.notificationClient.send('notification.markAsRead', { id }));
  }

  // ==================== ANALYTICS ROUTES ====================
  @Get('analytics/dashboard')
  @Version('1')
  @ApiTags('Analytics')
  @ApiOperation({ summary: 'Get user analytics dashboard' })
  @ApiBearerAuth('JWT-auth')
  async getAnalyticsDashboard(@Query('userId') userId: string) {
    return firstValueFrom(this.analyticsClient.send('analytics.getDashboard', { userId }));
  }

  @Get('analytics/job-stats')
  @Version('1')
  @ApiTags('Analytics')
  @ApiOperation({ summary: 'Get job application statistics' })
  @ApiBearerAuth('JWT-auth')
  async getJobStats(@Query('userId') userId: string) {
    return firstValueFrom(this.analyticsClient.send('analytics.getJobStats', { userId }));
  }

  private extractUserIdFromAuthHeader(req: Request): string | undefined {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || Array.isArray(authHeader)) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return undefined;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return undefined;
      }

      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;
      return (payload.userId as string) || (payload.sub as string) || (payload.id as string);
    } catch {
      return undefined;
    }
  }
}
