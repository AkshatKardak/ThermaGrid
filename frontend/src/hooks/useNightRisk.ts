import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface OvernightHourly {
  time: string;
  hour: number;
  temp_c: number;
  wbgt_c: number;
  timestamp?: string;
}

export interface NightRiskResponse {
  available: boolean;
  message?: string;
  night_min_c: number | null;
  tropical_night: boolean;
  band: string;
  guidance: string[];
  hourly_overnight: OvernightHourly[];
}

export function useNightRisk(locationId: number | null | undefined) {
  return useQuery<NightRiskResponse>({
    queryKey: ['night-risk', locationId],
    queryFn: async () => {
      const res = await apiClient.get<NightRiskResponse>('/risk/night', {
        params: { location_id: locationId },
      });
      return res.data;
    },
    enabled: Number.isFinite(locationId) && (locationId as number) > 0,
    staleTime: 60 * 1000,
  });
}
