import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { libraryQuery } from '@/lib/library-query.mjs';

export function useLibraryDecks(params = {}, options = {}) {
  const query = libraryQuery(params);
  return useQuery({
    queryKey: ['library-decks', params],
    queryFn: () => apiFetch(`/api/v1/library/decks?${query}`),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
}
