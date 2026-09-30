import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useDeck(id) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: () => apiFetch(`/api/v1/decks/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
