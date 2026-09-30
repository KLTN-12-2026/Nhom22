import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useDecks() {
  return useQuery({
    queryKey: ['my-decks'],
    queryFn: () => apiFetch('/api/v1/decks/my-decks'),
    staleTime: 5 * 60 * 1000,
  });
}
