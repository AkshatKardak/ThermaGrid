import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Location } from '../types';

export function useWards(city?: string) {
  return useQuery({
    queryKey: ['locations', city],
    queryFn: async () => {
      const { data } = await apiClient.get<Location[]>('/locations', {
        params: city ? { city } : undefined,
      });
      return data;
    },
  });
}

export function useWardDetails(locationId: number) {
  return useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<Location>(`/locations/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}
