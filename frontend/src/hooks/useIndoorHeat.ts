import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface IndoorHeatResponse {
  location_id: number;
  archetype: string;
  outdoor_now_c: number;
  indoor_now_c: number;
  indoor_peak_c: number;
  indoor_peak_time: string;
  wbgt_indoor: number;
  band: string;
  method: string;
  basis: string;
  lag_hours: number;
  note: string;
}

export function useIndoorHeat(locationId: number, archetype: string) {
  return useQuery<IndoorHeatResponse>({
    queryKey: ['indoor-heat', locationId, archetype],
    queryFn: async () => {
      const res = await apiClient.get<IndoorHeatResponse>('/risk/indoor', {
        params: { location_id: locationId, archetype },
      });
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
