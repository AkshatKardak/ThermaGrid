import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Subscription {
  id: string;
  clerk_user_id: string;
  ward_id?: number | null;
  ward_name?: string | null;
  channel: 'whatsapp' | 'email';
  destination: string;
  threshold: number;
  language: string;
  quiet_hours?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateSubscriptionPayload {
  ward_id?: number;
  channel: 'whatsapp' | 'email';
  destination: string;
  threshold?: number;
  language?: string;
  quiet_hours?: string | null;
}

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const query = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get<Subscription[]>('/subscriptions');
      return res.data;
    },
    staleTime: 10 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSubscriptionPayload) => {
      const res = await apiClient.post<Subscription>('/subscriptions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/subscriptions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const testAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/subscriptions/${id}/test`);
      return res.data;
    },
  });

  return {
    ...query,
    createSubscription: createMutation.mutateAsync,
    deleteSubscription: deleteMutation.mutateAsync,
    sendTestAlert: testAlertMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSendingTest: testAlertMutation.isPending,
  };
}
