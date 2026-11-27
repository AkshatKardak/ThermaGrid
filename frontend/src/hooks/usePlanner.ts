import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface SafeWindow {
  start: string;
  end: string;
  start_iso?: string;
  peak_risk: number;
  mean_risk: number;
  band: string;
  why: string;
}

export interface PlannerResponse {
  location_id: number;
  activity: string;
  threshold: number;
  duration_min: number;
  windows: SafeWindow[];
  avoid: SafeWindow[];
  best: SafeWindow | null;
  no_safe_window_message: string | null;
}

export function useSafeWindows(
  locationId: number | null | undefined,
  activity: string,
  durationMin: number
) {
  return useQuery<PlannerResponse>({
    queryKey: ['safe-windows', locationId, activity, durationMin],
    queryFn: async () => {
      const res = await apiClient.get<PlannerResponse>('/planner/safe-windows', {
        params: {
          location_id: locationId,
          activity,
          duration_min: durationMin,
        },
      });
      return res.data;
    },
    enabled: Number.isFinite(locationId) && (locationId as number) > 0,
    staleTime: 60 * 1000,
  });
}
