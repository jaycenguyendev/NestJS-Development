import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { JwtTokenService } from './services';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Enable2FADto,
  Disable2FADto,
  VerifyOTPDto,
  OAuthLoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto';
import {
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
  Enable2FAResponse,
  Verify2FAResponse,
  OAuthResponse,
  EmailVerificationResponse,
  PasswordResetResponse,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private jwtTokenService: JwtTokenService,
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
        sessionToken: this.jwtTokenService.generateSessionToken(),
        userId: user.id,
        userAgent,
        ip,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      },
    });

    // Tạo tokens
    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokenPair(user, session.id);

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

    // Sử dụng JwtTokenService để refresh token
    const { accessToken, refreshToken: newRefreshToken } =
      await this.jwtTokenService.refreshAccessToken(refreshToken);

    return {
      accessToken,
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
    await this.jwtTokenService.revokeAllRefreshTokens(userId);
  }

  async logoutAllDevices(userId: number): Promise<void> {
    // Xóa tất cả sessions
    await this.databaseService.session.deleteMany({
      where: { userId },
    });

    // Revoke tất cả refresh tokens
    await this.jwtTokenService.revokeAllRefreshTokens(userId);
  }

  // Password Management Methods
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Tìm user
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      this.configService.get<number>('PASSWORD_SALT_SECRET', 12),
    );

    // Cập nhật mật khẩu
    await this.databaseService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revoke tất cả refresh tokens để buộc đăng nhập lại
    await this.jwtTokenService.revokeAllRefreshTokens(userId);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponse> {
    const { email } = forgotPasswordDto;

    // Tìm user
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Không tiết lộ thông tin user có tồn tại hay không
      return {
        message: 'Nếu email tồn tại, link reset sẽ được gửi đến email của bạn',
      };
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    // Lưu token vào VerificationToken table
    await this.databaseService.verificationToken.create({
      data: {
        identifier: email,
        token: hashedResetToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 giờ
      },
    });

    // TODO: Gửi email với resetToken
    // await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message: 'Nếu email tồn tại, link reset sẽ được gửi đến email của bạn',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponse> {
    const { token, newPassword } = resetPasswordDto;

    // Tìm token trong database
    const verificationTokens =
      await this.databaseService.verificationToken.findMany({
        where: {
          expires: { gt: new Date() },
        },
      });

    let validToken: any = null;
    for (const vToken of verificationTokens) {
      const isTokenValid = await bcrypt.compare(token, vToken.token);
      if (isTokenValid) {
        validToken = vToken;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Tìm user bằng email
    const user = await this.databaseService.user.findUnique({
      where: { email: validToken.identifier },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      this.configService.get<number>('PASSWORD_SALT_SECRET', 12),
    );

    // Cập nhật mật khẩu
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    // Xóa token đã sử dụng
    await this.databaseService.verificationToken.delete({
      where: { id: validToken.id },
    });

    // Revoke tất cả refresh tokens để buộc đăng nhập lại
    await this.jwtTokenService.revokeAllRefreshTokens(user.id);

    return { message: 'Reset mật khẩu thành công' };
  }

  // Email Verification Methods
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponse> {
    const { token } = verifyEmailDto;

    // Tìm token trong database
    const verificationTokens =
      await this.databaseService.verificationToken.findMany({
        where: {
          expires: { gt: new Date() },
        },
      });

    let validToken: any = null;
    for (const vToken of verificationTokens) {
      const isTokenValid = await bcrypt.compare(token, vToken.token);
      if (isTokenValid) {
        validToken = vToken;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException(
        'Token xác thực không hợp lệ hoặc đã hết hạn',
      );
    }

    // Tìm user và cập nhật emailVerified
    const user = await this.databaseService.user.findUnique({
      where: { email: validToken.identifier },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Cập nhật emailVerified
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Xóa token đã sử dụng
    await this.databaseService.verificationToken.delete({
      where: { id: validToken.id },
    });

    return {
      verified: true,
      message: 'Email đã được xác thực thành công',
    };
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<EmailVerificationResponse> {
    const { email } = resendVerificationDto;

    // Tìm user
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Không tiết lộ thông tin user có tồn tại hay không
      return {
        verified: false,
        message: 'Nếu email tồn tại, email xác thực sẽ được gửi lại',
      };
    }

    if (user.emailVerified) {
      return {
        verified: true,
        message: 'Email đã được xác thực rồi',
      };
    }

    // Tạo verification token mới
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Xóa token cũ nếu có
    await this.databaseService.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Tạo token mới
    await this.databaseService.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 giờ
      },
    });

    // TODO: Gửi email với verificationToken
    // await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      verified: false,
      message: 'Nếu email tồn tại, email xác thực sẽ được gửi lại',
    };
  }

  // 2FA Methods
  async enable2FA(
    userId: number,
    enable2FADto: Enable2FADto,
  ): Promise<Enable2FAResponse> {
    const { password } = enable2FADto;

    // Tìm user và kiểm tra password
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA đã được bật');
    }

    // Tạo secret cho 2FA (placeholder - cần install speakeasy package)
    const secret = crypto.randomBytes(20).toString('hex');
    const hashedSecret = await bcrypt.hash(secret, 10);

    // Lưu secret vào database
    await this.databaseService.twoFactorSecret.upsert({
      where: { userId },
      update: { secret: hashedSecret },
      create: {
        userId,
        secret: hashedSecret,
      },
    });

    // Tạo backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    // TODO: Implement QR code generation với speakeasy
    const qrCodeUrl = `otpauth://totp/YourApp:${user.email}?secret=${secret}&issuer=YourApp`;

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  async disable2FA(
    userId: number,
    disable2FADto: Disable2FADto,
  ): Promise<{ message: string }> {
    const { password, otpCode } = disable2FADto;

    // Tìm user và kiểm tra password
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA chưa được bật');
    }

    // Verify OTP code (placeholder - cần implement với speakeasy)
    if (otpCode.length !== 6) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    // Tắt 2FA
    await this.databaseService.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    // Xóa secret
    await this.databaseService.twoFactorSecret.delete({
      where: { userId },
    });

    return { message: '2FA đã được tắt thành công' };
  }

  async verifyOTP(
    userId: number,
    verifyOTPDto: VerifyOTPDto,
  ): Promise<Verify2FAResponse> {
    const { otpCode } = verifyOTPDto;

    // Tìm user
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      include: { twoFactorSecret: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA chưa được thiết lập');
    }

    // Verify OTP code (placeholder - cần implement với speakeasy)
    if (otpCode.length !== 6) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    // Nếu chưa enable, enable 2FA
    if (!user.twoFactorEnabled) {
      await this.databaseService.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
    }

    return {
      enabled: true,
      backupCodes: [],
    };
  }

  // OAuth Methods (placeholder - cần implement với Google/Facebook SDK)
  async oauthLogin(
    oauthLoginDto: OAuthLoginDto,
    userAgent?: string,
    ip?: string,
  ): Promise<OAuthResponse> {
    const { provider, accessToken } = oauthLoginDto;

    // TODO: Verify accessToken với provider (Google/Facebook)
    // const userInfo = await this.verifyOAuthToken(provider, accessToken);

    // Placeholder OAuth user info
    const userInfo = {
      id: 'oauth_user_id',
      email: 'oauth@example.com',
      name: 'OAuth User',
      picture: null,
      provider,
    };

    // Tìm hoặc tạo user
    let user = await this.databaseService.user.findUnique({
      where: { email: userInfo.email },
    });

    let isNewUser = false;

    if (!user) {
      // Tạo user mới
      user = await this.databaseService.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          password: await bcrypt.hash(
            crypto.randomBytes(32).toString('hex'),
            12,
          ),
          emailVerified: new Date(),
        },
      });
      isNewUser = true;
    }

    // Tạo hoặc cập nhật OAuth account
    await this.databaseService.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: userInfo.id,
        },
      },
      update: { accessToken },
      create: {
        provider,
        providerAccountId: userInfo.id,
        userId: user.id,
        accessToken,
      },
    });

    // Tạo session và tokens
    const session = await this.databaseService.session.create({
      data: {
        sessionToken: this.jwtTokenService.generateSessionToken(),
        userId: user.id,
        userAgent,
        ip,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { accessToken: newAccessToken, refreshToken } =
      await this.jwtTokenService.generateTokenPair(user, session.id);

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
      accessToken: newAccessToken,
      refreshToken,
      isNewUser,
    };
  }

  // Token và Session Management Methods
  async getActiveSessions(userId: number) {
    const [sessions, refreshTokens] = await Promise.all([
      this.databaseService.session.findMany({
        where: {
          userId,
          expires: { gt: new Date() },
        },
        select: {
          id: true,
          userAgent: true,
          ip: true,
          createdAt: true,
          expires: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.jwtTokenService.getActiveRefreshTokens(userId),
    ]);

    return {
      sessions,
      refreshTokens,
    };
  }

  async revokeSession(
    userId: number,
    sessionId: number,
  ): Promise<{ message: string }> {
    // Xóa session
    await this.databaseService.session.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    return { message: 'Session đã được revoke thành công' };
  }

  async cleanupExpiredTokens(): Promise<{ message: string; count: number }> {
    const count = await this.jwtTokenService.cleanupExpiredTokens();

    // Xóa expired sessions
    const expiredSessions = await this.databaseService.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    return {
      message: 'Cleanup completed',
      count: count + expiredSessions.count,
    };
  }
}
