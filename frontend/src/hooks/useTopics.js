import { useQuery } from '@tanstack/react-query';
import { fetchAllPages } from '@/lib/fetch-all-pages';

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: () => fetchAllPages('/api/v1/public/topics'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
