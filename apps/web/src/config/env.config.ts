import { z } from 'zod';

// Client-side environment validation schema
// Note: Only NEXT_PUBLIC_ variables are available on the client side
const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:3001'),

  // App Configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('NestJS Development'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('http://localhost:3000'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_PWA: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_DARK_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // OAuth Configuration (Client IDs are safe to expose)
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_CLIENT_ID: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),

  // Error Reporting
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Development Tools
  NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // File Upload
  NEXT_PUBLIC_MAX_FILE_SIZE: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('5242880'), // 5MB

  // API Configuration
  NEXT_PUBLIC_API_TIMEOUT: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('10000'), // 10 seconds
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv(): EnvConfig {
  try {
    const env = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA,
      NEXT_PUBLIC_ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_FACEBOOK_CLIENT_ID:
        process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS:
        process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS,
      NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
      NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`,
      );

      console.error('❌ Environment validation failed:');
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));

      throw new Error('Invalid environment configuration');
    }

    throw error;
  }
}

// Export validated config (safe to use on client side)
export const envConfig = validateEnv();

// Helper functions
export const isProduction = () => envConfig.NODE_ENV === 'production';
export const isDevelopment = () => envConfig.NODE_ENV === 'development';
export const isTest = () => envConfig.NODE_ENV === 'test';

// Environment-specific configurations
export const getApiUrl = () => envConfig.NEXT_PUBLIC_API_URL;
export const getAppUrl = () => envConfig.NEXT_PUBLIC_APP_URL;
export const getAppName = () => envConfig.NEXT_PUBLIC_APP_NAME;

// Feature flags
export const isAnalyticsEnabled = () => envConfig.NEXT_PUBLIC_ENABLE_ANALYTICS;
export const isPWAEnabled = () => envConfig.NEXT_PUBLIC_ENABLE_PWA;
export const isDarkModeEnabled = () => envConfig.NEXT_PUBLIC_ENABLE_DARK_MODE;
export const isReactQueryDevToolsEnabled = () =>
  envConfig.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS && isDevelopment();
