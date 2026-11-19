import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { RiskForecast } from '../types';

export function useRiskForecast(locationId: number | null | undefined, days: number = 5) {
  return useQuery({
    queryKey: ['risk', 'forecast', locationId ?? null, days],
    queryFn: async ({ signal }) => {
      if (!locationId) return null;
      const { data } = await apiClient.get<RiskForecast>('/risk/forecast', {
        params: { location_id: locationId, days },
        signal,
      });
      return data;
    },
    enabled: Boolean(locationId),
    placeholderData: undefined,
  });
}
