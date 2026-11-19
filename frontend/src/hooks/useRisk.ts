import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { RiskCurrent } from '../types';

export function useCurrentRisk(locationId: number | null | undefined) {
  return useQuery({
    queryKey: ['risk', 'current', locationId ?? null],
    queryFn: async ({ signal }) => {
      if (!locationId) return null;
      const { data } = await apiClient.get<RiskCurrent>('/risk/current', {
        params: { location_id: locationId },
        signal,
      });
      return data;
    },
    enabled: Boolean(locationId),
    placeholderData: undefined,
  });
}

export function useAllWardsRisk(city?: string, state?: string) {
  return useQuery({
    queryKey: ['risk', 'all', state || null, city || null],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<RiskCurrent[]>('/risk/all', {
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
