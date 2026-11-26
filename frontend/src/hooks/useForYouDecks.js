import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useForYouDecks(size, options = {}) {
  return useQuery({
    queryKey: ['for-you-decks', size],
    queryFn: () => apiFetch(`/api/v1/decks/for-you?size=${size}`),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options.enabled ?? true,
  });
}
