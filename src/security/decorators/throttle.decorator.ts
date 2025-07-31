import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
  limit: number;
  ttl: number;
  name?: string;
}

/**
 * Custom throttle decorator for specific endpoints
 */
export const CustomThrottle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_KEY, options);

/**
 * Strict throttle for sensitive endpoints (login, register, password reset)
 */
export const StrictThrottle = () =>
  SetMetadata(THROTTLE_KEY, {
    name: 'strict',
    limit: 5,
    ttl: 60000, // 1 minute
  });

/**
 * Auth throttle for authentication endpoints
 */
export const AuthThrottle = () =>
  SetMetadata(THROTTLE_KEY, {
    name: 'auth',
    limit: 10,
    ttl: 60000 * 15, // 15 minutes
  });

/**
 * API throttle for regular API endpoints
 */
export const ApiThrottle = () =>
  SetMetadata(THROTTLE_KEY, {
    name: 'api',
    limit: 100,
    ttl: 60000, // 1 minute
  });
