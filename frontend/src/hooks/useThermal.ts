import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { ThermalCurrent, ThermalHistory } from '../types';

export function useCurrentThermal(locationId: number | null | undefined) {
  return useQuery({
    queryKey: ['thermal', 'current', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<ThermalCurrent>('/thermal/current', {
        params: { location_id: locationId },
      });
      return data;
    },
    enabled: Number.isFinite(locationId) && (locationId as number) > 0,
  });
}

export function useThermalHistory(locationId: number | null | undefined, days: number = 3) {
  return useQuery({
    queryKey: ['thermal', 'history', locationId, days],
    queryFn: async () => {
      const { data } = await apiClient.get<ThermalHistory>('/thermal/history', {
        params: { location_id: locationId, days },
      });
      return data;
    },
    enabled: Number.isFinite(locationId) && (locationId as number) > 0,
  });
}
