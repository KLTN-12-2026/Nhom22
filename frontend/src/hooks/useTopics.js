import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: () => apiFetch('/api/v1/public/topics'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
