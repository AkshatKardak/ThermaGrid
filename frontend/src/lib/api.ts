import axios from 'axios';
import { useMemo } from 'react';
import { env } from '../config/env';

// Singleton axios client with token interceptor
export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    // Clerk session token integration
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // Ignore error in non-clerk environments
  }
  return config;
});

// React Hook for API Client access
export function useApi() {
  return useMemo(() => apiClient, []);
}
