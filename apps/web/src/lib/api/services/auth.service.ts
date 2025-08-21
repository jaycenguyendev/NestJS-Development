import { apiClient } from '../client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthUser,
  LoginResponse,
  SignUpFormToApiRequest,
  SignUpApiRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
} from '../types/auth.types';

export class AuthService {
  private static readonly BASE_PATH = '/auth';

  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>(
      `${this.BASE_PATH}/register`,
      data,
    );
    return response.data;
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${this.BASE_PATH}/login`,
      data,
    );
    return response.data;
  }

  /**
   * Transform frontend form data to API request format
   */
  static transformSignUpData(
    formData: SignUpFormToApiRequest,
  ): SignUpApiRequest {
    return {
      email: formData.email,
      password: formData.password,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
    };
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_PATH}/logout`);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<LoginResponse>(
      `${this.BASE_PATH}/refresh`,
      { refreshToken },
    );

    // Update stored tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    return response.data;
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>(`${this.BASE_PATH}/profile`);
    return response.data;
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(
    data: VerifyEmailRequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.BASE_PATH}/verify-email`,
      data,
    );
    return response.data;
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(
    data: ResendVerificationEmailRequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.BASE_PATH}/resend-verification`,
      data,
    );
    return response.data;
  }
}
