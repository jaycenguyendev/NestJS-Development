import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/auth.service';
import type {
  RegisterRequest,
  LoginRequest,
  AuthUser,
  LoginResponse,
  ApiError,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
} from '../types/auth.types';

interface UseRegisterOptions {
  onSuccess?: (data: AuthUser) => void;
  onError?: (error: ApiError) => void;
}

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: ApiError) => void;
}

interface UseVerifyEmailOptions {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: ApiError) => void;
}

interface UseResendVerificationEmailOptions {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Hook for user registration
 */
export const useRegister = (options?: UseRegisterOptions) => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => AuthService.register(data),
    onSuccess: (data) => {
      // Handle successful registration
      options?.onSuccess?.(data);
      localStorage.setItem('pendingVerificationEmail', data.email);
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    },
    onError: (error: ApiError) => {
      console.error('Registration error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Hook for user login
 */
export const useLogin = (options?: UseLoginOptions) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => AuthService.login(data),
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Update query cache with user data
      queryClient.setQueryData(['auth', 'user'], data.user);

      options?.onSuccess?.(data);

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('Login error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Redirect to home
      router.push('/');
    },
    onError: (error: ApiError) => {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      queryClient.clear();
      router.push('/');
    },
  });
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = (options?: UseVerifyEmailOptions) => {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => AuthService.verifyEmail(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: ApiError) => {
      console.error('Email verification error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Hook for resending verification email
 */
export const useResendVerificationEmail = (
  options?: UseResendVerificationEmailOptions,
) => {
  return useMutation({
    mutationFn: (data: ResendVerificationEmailRequest) =>
      AuthService.resendVerificationEmail(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: ApiError) => {
      console.error('Resend verification email error:', error);
      options?.onError?.(error);
    },
  });
};
