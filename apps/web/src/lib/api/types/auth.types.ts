// Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response Types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Frontend specific types
export interface SignUpFormToApiRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignUpApiRequest {
  email: string;
  password: string;
  name: string;
}

// Verify Email Types
export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}
