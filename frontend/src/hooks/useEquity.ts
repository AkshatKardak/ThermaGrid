import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface WardEquity {
  ward_code: string;
  ward_name: string;
  hei_score: number;
  hazard_rank: number;
  priority_rank: number;
  equity_gap: number;
  equity_gap_signed: string;
  equity_tier: string;
}

export interface EquityResponse {
  city: string;
  wards_evaluated: number;
  top_underserved_ward?: {
    ward_code: string;
    ward_name: string;
    equity_gap: number;
    equity_gap_signed: string;
    hazard_rank: number;
    priority_rank: number;
    callout: string;
  };
  equity_rankings: WardEquity[];
}

export function useEquity(city?: string) {
  return useQuery<EquityResponse>({
    queryKey: ['equity', city || 'Mumbai'],
    queryFn: async () => {
      const resp = await apiClient.get<EquityResponse>(
        `/analytics/equity?city=${encodeURIComponent(city || 'Mumbai')}`
      );
      return resp.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
