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
  // Read session token if stored or injected
  const token = localStorage.getItem('thermagrid_token') || localStorage.getItem('heatsense_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// React Hook for API Client access (fallback-safe without ClerkProvider)
export function useApi() {
  return useMemo(() => {
    return apiClient;
  }, []);
}
