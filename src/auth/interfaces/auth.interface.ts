export interface JwtPayload {
  sub: number; // User ID
  email: string;
  sessionId?: number;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: string;
  emailVerified?: Date;
  twoFactorEnabled: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SessionInfo {
  id: number;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expires: Date;
}

// 2FA Interfaces
export interface Enable2FAResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface Verify2FAResponse {
  enabled: boolean;
  backupCodes: string[];
}

// OAuth Interfaces
export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
}

export interface OAuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

// Email Verification
export interface EmailVerificationResponse {
  verified: boolean;
  message: string;
}

// Password Reset
export interface PasswordResetResponse {
  message: string;
}
