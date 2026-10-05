import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
export function useAvatar(user) {
  return useQuery({
    queryKey: ['me', 'avatar', user?.anhDaiDienId],
    queryFn: () => apiFetch('/api/v1/me/avatar'),
    enabled: !!user?.anhDaiDienId,
    staleTime: 0,
    refetchInterval: query => query.state.data?.expiresAt ? Math.max(1000, new Date(query.state.data.expiresAt).getTime() - Date.now() - 30000) : false,
  });
}
