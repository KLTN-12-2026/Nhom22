import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useLibraryDecks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['library-decks', params],
    queryFn: () => apiFetch(`/api/v1/library/decks?${query}`),
    staleTime: 5 * 60 * 1000,
  });
}
