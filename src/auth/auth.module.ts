import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtTokenService, TwoFactorService, OAuthService } from './services';
import {
  JwtAuthGuard,
  RolesGuard,
  TwoFactorGuard,
  OptionalTwoFactorGuard,
} from './guards';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtTokenService,
    TwoFactorService,
    OAuthService,
    JwtAuthGuard,
    RolesGuard,
    TwoFactorGuard,
    OptionalTwoFactorGuard,
  ],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
