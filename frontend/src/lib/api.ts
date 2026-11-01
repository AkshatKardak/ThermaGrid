import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
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
  // Read session token if stored or injected
  const token = localStorage.getItem('thermagrid_token') || localStorage.getItem('heatsense_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// React Hook with Clerk Session Token attachment
export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => {
    const api = axios.create({ baseURL: env.API_BASE_URL });
    api.interceptors.request.use(async (cfg) => {
      try {
        const token = await getToken();
        if (token && cfg.headers) {
          cfg.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Continue unauthenticated if Clerk token fails
      }
      return cfg;
    });
    return api;
  }, [getToken]);
}
