import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import {
  JwtTokenService,
  TwoFactorService,
  OAuthService,
  EmailService,
} from './services';
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
    private twoFactorService: TwoFactorService,
    private oauthService: OAuthService,
    private emailService: EmailService,
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

    const saltRounds = Number(
      this.configService.getOrThrow<number>('PASSWORD_SALT_SECRET'),
    );
    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    // Tạo verification code (6 chữ số)
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    await this.databaseService.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
      },
    });

    // Gửi email verification
    await this.emailService.sendVerificationEmail(email, verificationToken);

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
      this.configService.getOrThrow<number>('PASSWORD_SALT_SECRET', 12),
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

    // Gửi email với resetToken
    await this.emailService.sendPasswordResetEmail(email, resetToken);

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
      this.configService.getOrThrow<number>('PASSWORD_SALT_SECRET', 12),
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
    const { otp, email } = verifyEmailDto;

    // Tìm token trong database
    const verificationTokens =
      await this.databaseService.verificationToken.findMany({
        where: {
          expires: { gt: new Date() },
        },
      });

    let validToken: any = null;
    for (const vToken of verificationTokens) {
      const isTokenValid = await bcrypt.compare(otp, vToken.token);
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

    // Gửi welcome email
    if (user.name) {
      await this.emailService.sendWelcomeEmail(user.name, user.email);
    }

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

    // Tạo verification code mới (6 chữ số)
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
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
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
      },
    });

    // Gửi email với verificationToken
    await this.emailService.sendVerificationEmail(email, verificationToken);

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

    const isPasswordValid = await this.twoFactorService.verifyCurrentPassword(
      userId,
      password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA đã được bật');
    }

    // Sử dụng TwoFactorService để generate setup
    const setup = await this.twoFactorService.generateTwoFactorSetup(
      userId,
      user.email,
    );

    return {
      secret: setup.manualEntryKey,
      qrCodeUrl: setup.qrCodeUrl,
      backupCodes: setup.backupCodes,
    };
  }

  async disable2FA(
    userId: number,
    disable2FADto: Disable2FADto,
  ): Promise<{ message: string }> {
    const { password, otpCode } = disable2FADto;

    // Kiểm tra password
    const isPasswordValid = await this.twoFactorService.verifyCurrentPassword(
      userId,
      password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    // Kiểm tra 2FA có enabled không
    const is2FAEnabled = await this.twoFactorService.is2FAEnabled(userId);
    if (!is2FAEnabled) {
      throw new BadRequestException('2FA chưa được bật');
    }

    // Verify OTP code
    const isOTPValid = await this.twoFactorService.verifyToken(userId, otpCode);
    if (!isOTPValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    // Disable 2FA
    await this.twoFactorService.disable2FA(userId);

    return { message: '2FA đã được tắt thành công' };
  }

  async verifyOTP(
    userId: number,
    verifyOTPDto: VerifyOTPDto,
  ): Promise<Verify2FAResponse> {
    const { otpCode } = verifyOTPDto;

    // Verify OTP code
    const isTokenValid = await this.twoFactorService.verifyToken(
      userId,
      otpCode,
    );
    if (!isTokenValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    // Kiểm tra xem 2FA đã được enable chưa
    const is2FAEnabled = await this.twoFactorService.is2FAEnabled(userId);

    // Nếu chưa enable, enable 2FA
    if (!is2FAEnabled) {
      await this.twoFactorService.enable2FA(userId);
    }

    // Generate backup codes nếu cần
    const backupCodes =
      await this.twoFactorService.regenerateBackupCodes(userId);

    return {
      enabled: true,
      backupCodes,
    };
  }

  // OAuth Methods
  async oauthLogin(
    oauthLoginDto: OAuthLoginDto,
    userAgent?: string,
    ip?: string,
  ): Promise<OAuthResponse> {
    const { provider, accessToken, idToken } = oauthLoginDto;

    // Verify OAuth token và lấy user info
    const oauthUserInfo = await this.oauthService.verifyOAuthToken(
      provider,
      accessToken,
      idToken,
    );

    // Tìm user existing bằng OAuth account
    let user = await this.oauthService.findUserByOAuthAccount(
      provider,
      oauthUserInfo.id,
    );

    let isNewUser = false;

    if (!user) {
      // Tìm user bằng email nếu chưa có OAuth account
      const existingUser = await this.databaseService.user.findUnique({
        where: { email: oauthUserInfo.email },
      });

      if (existingUser) {
        // Link OAuth account với user existing
        await this.oauthService.linkOAuthAccount(
          existingUser.id,
          oauthUserInfo,
          accessToken,
        );
        user = existingUser;
      } else {
        // Tạo user mới
        const newUser = await this.databaseService.user.create({
          data: {
            email: oauthUserInfo.email,
            name: oauthUserInfo.name,
            password: await bcrypt.hash(
              crypto.randomBytes(32).toString('hex'),
              12,
            ),
            emailVerified: new Date(), // OAuth users are pre-verified
          },
        });

        // Link OAuth account
        await this.oauthService.linkOAuthAccount(
          newUser.id,
          oauthUserInfo,
          accessToken,
        );

        user = newUser;
        isNewUser = true;
      }
    } else {
      // Update OAuth access token
      await this.oauthService.saveOrUpdateOAuthAccount(
        user.id,
        provider,
        oauthUserInfo.id,
        accessToken,
      );
    }

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

  // Test method for email functionality
  async sendTestEmail(email: string): Promise<boolean> {
    return this.emailService.sendTestEmail(email);
  }
}
