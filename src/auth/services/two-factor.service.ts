import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorBackupCodes {
  codes: string[];
}

@Injectable()
export class TwoFactorService {
  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}

  /**
   * Tạo 2FA secret và QR code cho user
   */
  async generateTwoFactorSetup(
    userId: number,
    userEmail: string,
  ): Promise<TwoFactorSetup> {
    // Tạo secret
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.configService.get<string>('APP_NAME', 'NestJS App'),
      length: 32,
    });

    if (!secret.base32) {
      throw new BadRequestException('Failed to generate 2FA secret');
    }

    // Tạo QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Tạo backup codes
    const backupCodes = this.generateBackupCodes();

    // Lưu secret vào database (chưa enable)
    await this.databaseService.twoFactorSecret.upsert({
      where: { userId },
      update: {
        secret: secret.base32, // Lưu plain text để dễ verify
      },
      create: {
        userId,
        secret: secret.base32,
      },
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32,
    };
  }

  /**
   * Verify OTP token
   */
  async verifyToken(userId: number, token: string): Promise<boolean> {
    // Lấy secret của user
    const twoFactorSecret =
      await this.databaseService.twoFactorSecret.findUnique({
        where: { userId },
      });

    if (!twoFactorSecret) {
      throw new BadRequestException('2FA not set up for this user');
    }

    try {
      // Verify token với window tolerance
      const verified = speakeasy.totp.verify({
        secret: twoFactorSecret.secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after
      });

      return verified;
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: number, backupCode: string): Promise<boolean> {
    // TODO: Implement backup code verification
    // Cần lưu backup codes riêng trong database

    // Temporary implementation
    return backupCode.length === 8 && /^[A-Z0-9]+$/.test(backupCode);
  }

  /**
   * Enable 2FA sau khi verify successful
   */
  async enable2FA(userId: number): Promise<void> {
    await this.databaseService.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: number): Promise<void> {
    // Disable 2FA
    await this.databaseService.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    // Xóa secret
    await this.databaseService.twoFactorSecret.deleteMany({
      where: { userId },
    });
  }

  /**
   * Tạo backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < 8; i++) {
      // Tạo code 8 ký tự
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Tạo backup codes mới
   */
  async regenerateBackupCodes(userId: number): Promise<string[]> {
    const newCodes = this.generateBackupCodes();

    // TODO: Lưu backup codes vào database
    // Cần tạo table riêng cho backup codes

    return newCodes;
  }

  /**
   * Kiểm tra user có 2FA enabled không
   */
  async is2FAEnabled(userId: number): Promise<boolean> {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Lấy recovery codes còn lại
   */
  async getRemainingRecoveryCodes(userId: number): Promise<number> {
    // TODO: Implement với backup codes table
    return 8; // Default
  }

  /**
   * Generate QR code cho manual entry
   */
  async generateQRCode(secret: string, userEmail: string): Promise<string> {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: this.configService.get<string>('APP_NAME', 'NestJS App'),
      encoding: 'base32',
    });

    return QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verify current password (helper method)
   */
  async verifyCurrentPassword(
    userId: number,
    password: string,
  ): Promise<boolean> {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }
}
