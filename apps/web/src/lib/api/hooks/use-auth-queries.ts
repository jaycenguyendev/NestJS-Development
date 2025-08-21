import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AuthService } from '../services/auth.service';
import type { AuthUser, ApiError } from '../types/auth.types';

// Query keys for consistent cache management
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/**
 * Hook to get current user profile
 */
export const useProfile = (
  options?: Omit<UseQueryOptions<AuthUser, ApiError>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => AuthService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if unauthorized
      if (error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

/**
 * Hook to check if user is authenticated
 */
export const useAuth = () => {
  const {
    data: user,
    isLoading,
    error,
  } = useProfile({
    enabled: !!localStorage.getItem('accessToken'),
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    isError: !!error,
    error,
  };
};
