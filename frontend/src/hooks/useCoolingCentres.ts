import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { CoolingCentre, Alert, DataSource } from '../types';

export function useCoolingCentres(city?: string, lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['cooling-centres', city, lat, lon],
    queryFn: async () => {
      const { data } = await apiClient.get<CoolingCentre[]>('/cooling-centres', {
        params: {
          city: city || undefined,
          lat: lat !== undefined ? lat : undefined,
          lon: lon !== undefined ? lon : undefined,
        },
      });
      return data;
    },
  });
}

export function useAlerts(city?: string) {
  return useQuery({
    queryKey: ['alerts', city],
    queryFn: async () => {
      const { data } = await apiClient.get<Alert[]>('/alerts', {
        params: city ? { city } : undefined,
      });
      return data;
    },
  });
}

export function useDataSources() {
  return useQuery({
    queryKey: ['data-sources'],
    queryFn: async () => {
      const { data } = await apiClient.get<DataSource[]>('/data-sources');
      return data;
    },
  });
}
