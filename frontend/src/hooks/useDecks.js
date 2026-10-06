import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useDecks(page = 0) {
  return useQuery({
    queryKey: ['my-decks', page],
    queryFn: () => apiFetch(`/api/v1/decks?page=${page}&size=20`),
    staleTime: 5 * 60 * 1000,
  });
}
