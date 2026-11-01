import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { RiskCurrent } from '../types';

export function useCurrentRisk(locationId: number) {
  return useQuery({
    queryKey: ['risk', 'current', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<RiskCurrent>('/risk/current', {
        params: { location_id: locationId },
      });
      return data;
    },
    enabled: !!locationId,
  });
}

export function useAllWardsRisk(city?: string) {
  return useQuery({
    queryKey: ['risk', 'all', city],
    queryFn: async () => {
      const { data } = await apiClient.get<RiskCurrent[]>('/risk/all', {
        params: city ? { city } : undefined,
      });
      return data;
    },
  });
}
