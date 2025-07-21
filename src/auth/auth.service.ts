import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import {
  JwtPayload,
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthUser> {
    const { email, password, name } = registerDto;

    // Kiểm tra email đã tồn tại
    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>('PASSWORD_SALT_SECRET', 12),
    );

    // Tạo user mới
    const user = await this.databaseService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      emailVerified: user.emailVerified ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ip?: string,
  ): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Tìm user
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo session
    const session = await this.databaseService.session.create({
      data: {
        sessionToken: this.generateSessionToken(),
        userId: user.id,
        userAgent,
        ip,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      },
    });

    // Tạo tokens
    const accessToken = await this.generateAccessToken(user, session.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      emailVerified: user.emailVerified ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    const { refreshToken } = refreshTokenDto;

    // Tìm refresh token trong DB
    const tokenRecord = await this.databaseService.refreshToken.findFirst({
      where: {
        revoked: false,
        expires: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Verify refresh token
    const isTokenValid = await bcrypt.compare(
      refreshToken,
      tokenRecord.tokenHash,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Revoke old refresh token
    await this.databaseService.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Tạo tokens mới
    const newAccessToken = await this.generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this.generateRefreshToken(
      tokenRecord.user.id,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: number, sessionId?: number): Promise<void> {
    // Xóa session nếu có
    if (sessionId) {
      await this.databaseService.session.deleteMany({
        where: {
          id: sessionId,
          userId,
        },
      });
    }

    // Revoke tất cả refresh tokens của user
    await this.databaseService.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async logoutAllDevices(userId: number): Promise<void> {
    // Xóa tất cả sessions
    await this.databaseService.session.deleteMany({
      where: { userId },
    });

    // Revoke tất cả refresh tokens
    await this.databaseService.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  private async generateAccessToken(
    user: any,
    sessionId?: number,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      },
    );

    // Hash và lưu vào DB
    const hashedToken = await bcrypt.hash(token, 10);
    await this.databaseService.refreshToken.create({
      data: {
        tokenHash: hashedToken,
        userId,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      },
    });

    return token;
  }

  private generateSessionToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
