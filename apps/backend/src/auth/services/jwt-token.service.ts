import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../interfaces/auth.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: number;
  email: string;
  sessionId?: number;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {}

  /**
   * Tạo Access Token (Stateless JWT)
   * - Chứa thông tin user cơ bản
   * - Thời gian sống ngắn (15 phút)
   * - Không cần query database để verify
   */
  async generateAccessToken(
    user: { id: number; email: string },
    sessionId?: number,
  ): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    });
  }

  /**
   * Tạo Refresh Token (Stateful)
   * - Hash và lưu vào database
   * - Thời gian sống dài (7 ngày)
   * - Cần query database để verify
   */
  async generateRefreshToken(userId: number): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });

    // Hash token và lưu vào database
    const hashedToken = await bcrypt.hash(token, 10);

    await this.databaseService.refreshToken.create({
      data: {
        tokenHash: hashedToken,
        userId,
        expires: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
      },
    });

    return token;
  }

  /**
   * Tạo cặp tokens (Access + Refresh)
   */
  async generateTokenPair(
    user: { id: number; email: string },
    sessionId?: number,
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user, sessionId),
      this.generateRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify Access Token (Stateless)
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      return this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Access token không hợp lệ');
    }
  }

  /**
   * Verify Refresh Token (Stateful)
   */
  async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: number; tokenRecord: any }> {
    try {
      // Verify JWT structure
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token type không hợp lệ');
      }

      // Tìm token trong database
      const tokenRecords = await this.databaseService.refreshToken.findMany({
        where: {
          userId: payload.sub,
          revoked: false,
          expires: { gt: new Date() },
        },
      });

      // So sánh hash
      for (const record of tokenRecords) {
        const isTokenValid = await bcrypt.compare(token, record.tokenHash);
        if (isTokenValid) {
          return {
            userId: payload.sub,
            tokenRecord: record,
          };
        }
      }

      throw new UnauthorizedException(
        'Refresh token không tồn tại hoặc đã hết hạn',
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  /**
   * Refresh Access Token bằng Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const { userId, tokenRecord } = await this.verifyRefreshToken(refreshToken);

    // Lấy thông tin user
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Revoke refresh token cũ
    await this.databaseService.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Tạo tokens mới
    return this.generateTokenPair(user);
  }

  /**
   * Revoke tất cả refresh tokens của user
   */
  async revokeAllRefreshTokens(userId: number): Promise<void> {
    await this.databaseService.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  /**
   * Revoke refresh token cụ thể
   */
  async revokeRefreshToken(tokenId: number): Promise<void> {
    await this.databaseService.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });
  }

  /**
   * Lấy danh sách refresh tokens active của user
   */
  async getActiveRefreshTokens(userId: number) {
    return this.databaseService.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expires: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.databaseService.refreshToken.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Tạo session token (không phải JWT)
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Helper: Lấy thời gian hết hạn refresh token (ms)
   */
  private getRefreshTokenExpiryMs(): number {
    const expiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    // Parse thời gian (7d, 24h, 60m, etc.)
    const timeRegex = /^(\d+)([dhm])$/;
    const match = expiresIn.match(timeRegex);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default 7 ngày
    }

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'd':
        return num * 24 * 60 * 60 * 1000; // days
      case 'h':
        return num * 60 * 60 * 1000; // hours
      case 'm':
        return num * 60 * 1000; // minutes
      default:
        return 7 * 24 * 60 * 60 * 1000; // default
    }
  }

  /**
   * Decode token mà không verify (để debug)
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Kiểm tra token có hết hạn chưa
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }
}
