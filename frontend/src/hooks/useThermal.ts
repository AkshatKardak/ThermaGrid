import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { ThermalCurrent, ThermalHistory } from '../types';

export function useCurrentThermal(locationId: number) {
  return useQuery({
    queryKey: ['thermal', 'current', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<ThermalCurrent>('/thermal/current', {
        params: { location_id: locationId },
      });
      return data;
    },
    enabled: !!locationId,
  });
}

export function useThermalHistory(locationId: number, days: number = 3) {
  return useQuery({
    queryKey: ['thermal', 'history', locationId, days],
    queryFn: async () => {
      const { data } = await apiClient.get<ThermalHistory>('/thermal/history', {
        params: { location_id: locationId, days },
      });
      return data;
    },
    enabled: !!locationId,
  });
}
