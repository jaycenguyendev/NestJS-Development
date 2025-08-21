import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import type { ApiError } from './types/auth.types';
import { envConfig, getApiUrl, isDevelopment } from '@/config/env.config';

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: envConfig.NEXT_PUBLIC_API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request logging in development
  if (isDevelopment()) {
    client.interceptors.request.use(
      (config) => {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      },
    );
  }

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<ApiError>) => {
      // Handle common errors
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/sign-in';
      }

      // Format error for consistent handling
      const apiError: ApiError = {
        message:
          error.response?.data?.message || error.message || 'An error occurred',
        statusCode: error.response?.status || 500,
        error: error.response?.data?.error,
      };

      return Promise.reject(apiError);
    },
  );

  return client;
};

export const apiClient = createApiClient();
