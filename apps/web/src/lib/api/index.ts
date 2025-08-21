// API Client
export { apiClient } from './client';

// Services
export { AuthService } from './services/auth.service';

// Types
export * from './types/auth.types';

// Hooks
export * from './hooks';

// Utils
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
} as const;
