import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards';
import { GetUser } from './decorators';
import {
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
} from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthUser> {
    return this.authService.register(registerDto);
  }

  @Post('login')
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
}
