import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Dependent {
  id: string;
  clerk_user_id: string;
  name: string;
  ward_id?: number | null;
  ward_name?: string | null;
  age_band?: string | null;
  phone?: string | null;
  consent_note?: string | null;
  created_at: string;
  current_risk_score?: number | null;
  current_band?: string | null;
}

export interface CreateDependentPayload {
  name: string;
  ward_id?: number;
  age_band?: string;
  phone?: string;
  consent_note?: string;
}

export function useDependents() {
  const queryClient = useQueryClient();

  const query = useQuery<Dependent[]>({
    queryKey: ['dependents'],
    queryFn: async () => {
      const res = await apiClient.get<Dependent[]>('/dependents');
      return res.data;
    },
    staleTime: 15 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateDependentPayload) => {
      const res = await apiClient.post<Dependent>('/dependents', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/dependents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
    },
  });

  return {
    ...query,
    createDependent: createMutation.mutateAsync,
    deleteDependent: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
