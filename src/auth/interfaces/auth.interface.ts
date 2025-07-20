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
