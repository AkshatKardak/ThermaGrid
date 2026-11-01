import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { RiskForecast } from '../types';

export function useRiskForecast(locationId: number, days: number = 5) {
  return useQuery({
    queryKey: ['risk', 'forecast', locationId, days],
    queryFn: async () => {
      const { data } = await apiClient.get<RiskForecast>('/risk/forecast', {
        params: { location_id: locationId, days },
      });
      return data;
    },
    enabled: !!locationId,
  });
}
