import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { CoolingCentre, Alert, DataSource, SimulationResult } from '../types';

export function useCoolingCentres(city?: string, lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['cooling-centres', city, lat, lon],
    queryFn: async () => {
      const { data } = await apiClient.get<CoolingCentre[]>('/cooling-centres', {
        params: {
          city: city || undefined,
          lat: lat !== undefined ? lat : undefined,
          lon: lon !== undefined ? lon : undefined,
        },
      });
      return data;
    },
  });
}

export function useAlerts(city?: string) {
  return useQuery({
    queryKey: ['alerts', city],
    queryFn: async () => {
      const { data } = await apiClient.get<Alert[]>('/alerts', {
        params: city ? { city } : undefined,
      });
      return data;
    },
  });
}

export function useDataSources() {
  return useQuery({
    queryKey: ['data-sources'],
    queryFn: async () => {
      const { data } = await apiClient.get<DataSource[]>('/data-sources');
      return data;
    },
  });
}

export interface SimulationPayload {
  location_id: number;
  green_cover_expansion_pct: number;
  cool_roofs_adoption_pct: number;
  misting_shelters_count: number;
  shift_outdoor_hours_by: number;
}

export function useSimulation() {
  return useMutation({
    mutationFn: async (payload: SimulationPayload) => {
      const { data } = await apiClient.post<SimulationResult>('/simulation', payload);
      return data;
    },
  });
}
