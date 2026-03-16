import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint - checks all downstream services' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more services are unhealthy' })
  check() {
    return this.health.check([
      // Check memory heap
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB

      // Check memory RSS
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB

      // Check disk storage
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9, // 90%
        }),

      // Check Auth Service
      () =>
        this.http.pingCheck(
          'auth-service',
          process.env.AUTH_SERVICE_URL?.replace('/graphql', '/health') ||
            'http://localhost:4718/health',
        ),

      // Check User Service
      () =>
        this.http.pingCheck(
          'user-service',
          process.env.USER_SERVICE_URL?.replace('/graphql', '/health') ||
            'http://localhost:4719/health',
        ),

      // Check Job Service
      () =>
        this.http.pingCheck(
          'job-service',
          process.env.JOB_SERVICE_URL?.replace('/graphql', '/health') ||
            'http://localhost:4720/health',
        ),

      // Check Email Service
      () =>
        this.http.pingCheck(
          'email-service',
          process.env.EMAIL_SERVICE_URL || 'http://localhost:4721/health',
        ),

      // Check Payment Service
      () =>
        this.http.pingCheck(
          'payment-service',
          process.env.PAYMENT_SERVICE_URL?.replace('/graphql', '/health') ||
            'http://localhost:4724/health',
        ),

      // Check Redis
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6345'),
            password: process.env.REDIS_PASSWORD,
          },
        }),

      // Check Kafka
      () =>
        this.microservice.pingCheck('kafka', {
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
            },
          },
        }),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api-gateway',
      version: '1.0.0',
    };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  readiness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () =>
        this.http.pingCheck(
          'auth-service',
          process.env.AUTH_SERVICE_URL?.replace('/graphql', '/health') ||
            'http://localhost:4718/health',
        ),
    ]);
  }
}
