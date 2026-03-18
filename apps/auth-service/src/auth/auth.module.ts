import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { OAuthController } from './controllers/oauth.controller';
import { RoleManagementController } from './controllers/role-management.controller';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import { OtpService } from './services/otp.service';
import { OAuthService } from './services/oauth.service';
import { RbacService } from './services/rbac.service';
import { RoleManagementService } from './services/role-management.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthEventPublisher } from './events/auth.event-publisher';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SessionModule } from '../session/session.module';
import { AuditModule } from '../audit/audit.module';
import jwtConfig from '../config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m'),
          algorithm: 'HS256',
          issuer: 'ostora-auth-service',
          audience: 'ostora-platform',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    SessionModule,
    AuditModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'auth-service-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AuthController, TwoFactorController, OAuthController, RoleManagementController],
  providers: [
    AuthService,
    TokenService,
    TwoFactorService,
    OtpService,
    OAuthService,
    RbacService,
    RoleManagementService,
    JwtStrategy,
    GoogleStrategy,
    LinkedInStrategy,
    GithubStrategy,
    AuthEventPublisher,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, TokenService, TwoFactorService, OtpService, OAuthService, RbacService, RoleManagementService],
})
export class AuthModule {}
