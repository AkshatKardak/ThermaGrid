import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Location } from '../types';

export function useWards(city?: string, state?: string) {
  return useQuery({
    queryKey: ['locations', state || null, city || null],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<Location[]>('/locations', {
        params: {
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
        },
        signal,
      });
      return data;
    },
    placeholderData: undefined,
  });
}

export function useWardDetails(locationId: number | null | undefined) {
  return useQuery({
    queryKey: ['location', locationId ?? null],
    queryFn: async ({ signal }) => {
      if (!locationId) return null;
      const { data } = await apiClient.get<Location>(`/locations/${locationId}`, { signal });
      return data;
    },
    enabled: Boolean(locationId),
    placeholderData: undefined,
  });
}
