import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 401
  });
}
