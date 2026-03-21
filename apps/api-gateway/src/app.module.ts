import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { redisStore } from 'cache-manager-ioredis-yet';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose } from '@apollo/gateway';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { JobProxyController } from './proxy/job-proxy.controller';
import { UserProxyController } from './proxy/user-proxy.controller';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

const graphqlGatewayEnabled = process.env['ENABLE_GRAPHQL_GATEWAY'] === 'true';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate Limiting / Throttling
    // Global: 100 requests per minute
    // Auth endpoints: 5 requests per minute (configured in controller)
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute for auth endpoints
      },
    ]),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env['REDIS_HOST'] || 'localhost',
          port: parseInt(process.env['REDIS_PORT'] || '6345'),
          password: process.env['REDIS_PASSWORD'],
          ttl: parseInt(process.env['REDIS_TTL'] || '3600'),
        }),
      }),
    }),

    ...(graphqlGatewayEnabled
      ? [
          // GraphQL Federation Gateway (Apollo Federation v2)
          GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
            driver: ApolloGatewayDriver,
            server: {
              path: '/graphql',
            },
            gateway: {
              supergraphSdl: new IntrospectAndCompose({
                subgraphs: [
                  {
                    name: 'auth',
                    url: process.env['AUTH_SERVICE_URL'] || 'http://localhost:4718/graphql',
                  },
                  {
                    name: 'users',
                    url: process.env['USER_SERVICE_URL'] || 'http://localhost:4719/graphql',
                  },
                  {
                    name: 'jobs',
                    url: process.env['JOB_SERVICE_URL'] || 'http://localhost:4720/graphql',
                  },
                  {
                    name: 'payments',
                    url: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:4724/graphql',
                  },
                ],
              }),
            },
          }),
        ]
      : []),

    // Feature Modules
    HttpModule,
    GatewayModule,
    HealthModule,
  ],
  controllers: [JobProxyController, UserProxyController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Request ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
