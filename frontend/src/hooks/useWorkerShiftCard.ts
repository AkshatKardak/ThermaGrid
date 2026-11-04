import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ShiftBreak {
  start: string;
  end: string;
  duration?: string;
  reason: string;
}

export interface WbgtSeriesItem {
  hour: number;
  time: string;
  wbgt_c: number;
  temperature_c: number;
  risk_score: number;
}

export interface WorkerShiftCardResponse {
  location_id: number;
  ward_name: string;
  start: string;
  end: string;
  met: number;
  exposure: string;
  water_ml_per_hour: number;
  heavy_work_after: string;
  recommended_heavy_work_window: string;
  max_wbgt_c: number;
  breaks: ShiftBreak[];
  wbgt_series: WbgtSeriesItem[];
  disclaimer: string;
}

export function useWorkerShiftCard(
  locationId: number,
  met: number,
  exposure: string,
  start: string,
  end: string
) {
  return useQuery<WorkerShiftCardResponse>({
    queryKey: ['worker-shift-card', locationId, met, exposure, start, end],
    queryFn: async () => {
      const res = await apiClient.get<WorkerShiftCardResponse>('/worker/shift-card', {
        params: {
          location_id: locationId,
          met,
          exposure,
          start,
          end,
        },
      });
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
