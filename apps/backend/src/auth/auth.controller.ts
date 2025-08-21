import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
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
  JwtAuthGuard,
  RolesGuard,
  TwoFactorGuard,
  OptionalTwoFactorGuard,
} from './guards';
import { GetUser, Roles, Require2FA } from './decorators';
import {
  StrictThrottle,
  AuthThrottle,
  ApiThrottle,
} from '../security/decorators';
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
import { Role } from 'generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ========== BASIC AUTHENTICATION ==========

  @Post('register')
  @StrictThrottle()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthUser> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    return this.authService.login(loginDto, userAgent, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: AuthUser): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Đăng xuất thành công' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(
    @GetUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.authService.logoutAllDevices(user.id);
    return { message: 'Đăng xuất tất cả thiết bị thành công' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: AuthUser): AuthUser {
    return user;
  }

  // ========== PASSWORD MANAGEMENT ==========

  @Patch('change-password')
  @UseGuards(JwtAuthGuard, OptionalTwoFactorGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() user: AuthUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('forgot-password')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ========== EMAIL VERIFICATION ==========

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponse> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<EmailVerificationResponse> {
    return this.authService.resendVerification(resendVerificationDto);
  }

  // ========== TWO-FACTOR AUTHENTICATION ==========

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enable2FA(
    @GetUser() user: AuthUser,
    @Body() enable2FADto: Enable2FADto,
  ): Promise<Enable2FAResponse> {
    return this.authService.enable2FA(user.id, enable2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(
    @GetUser() user: AuthUser,
    @Body() disable2FADto: Disable2FADto,
  ): Promise<{ message: string }> {
    return this.authService.disable2FA(user.id, disable2FADto);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  async verifyOTP(
    @GetUser() user: AuthUser,
    @Body() verifyOTPDto: VerifyOTPDto,
    @Req() req: Request,
  ): Promise<Verify2FAResponse> {
    const result = await this.authService.verifyOTP(user.id, verifyOTPDto);

    // Mark 2FA as verified in session (if session middleware is enabled)
    if ((req as any).session) {
      (req as any).session.twoFactorVerified = true;
      (req as any).session.twoFactorVerifiedAt = Date.now();
    }

    return result;
  }

  // ========== OAUTH ==========

  @Post('oauth/login')
  @HttpCode(HttpStatus.OK)
  async oauthLogin(
    @Body() oauthLoginDto: OAuthLoginDto,
    @Req() req: Request,
  ): Promise<OAuthResponse> {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    return this.authService.oauthLogin(oauthLoginDto, userAgent, ip);
  }

  // ========== SESSION MANAGEMENT ==========

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiThrottle()
  async getActiveSessions(@GetUser() user: AuthUser) {
    return this.authService.getActiveSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @GetUser() user: AuthUser,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<{ message: string }> {
    return this.authService.revokeSession(user.id, sessionId);
  }

  // ========== ADMIN ENDPOINTS ==========

  @Post('admin/cleanup-tokens')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredTokens(): Promise<{ message: string; count: number }> {
    return this.authService.cleanupExpiredTokens();
  }

  // ========== PROTECTED ENDPOINT EXAMPLES ==========

  @Get('sensitive-action')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @Require2FA()
  sensitiveAction(@GetUser() user: AuthUser): { message: string } {
    return { message: `Sensitive action performed by ${user.email}` };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard, OptionalTwoFactorGuard)
  @Roles(Role.ADMIN)
  adminOnly(@GetUser() user: AuthUser): { message: string } {
    return { message: `Admin action performed by ${user.email}` };
  }

  // Test endpoint for email functionality (development only)
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle() // 10 requests per 15 minutes
  async testEmail(
    @Body() body: { email: string },
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.authService.sendTestEmail(body.email);
    return {
      message: success
        ? 'Test email sent successfully'
        : 'Failed to send test email. Check email configuration.',
      success,
    };
  }
}
