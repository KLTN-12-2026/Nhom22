import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

const params = (values) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value).trim());
  }
  return query.toString();
};

export function useSearchSuggest(q, { limit = 5, enabled = true } = {}) {
  const term = (q || '').trim();
  return useQuery({
    queryKey: ['search-suggest', term, limit],
    queryFn: ({ signal }) => apiFetch(`/api/v1/library/search?${params({ q: term, limit })}`, { signal }),
    enabled: enabled && term.length > 0,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useSearchCards(q, page = 0, size = 20, enabled = true) {
  const term = (q || '').trim();
  return useQuery({
    queryKey: ['search-cards', term, page, size],
    queryFn: () => apiFetch(`/api/v1/library/search/cards?${params({ q: term, page, size })}`),
    enabled: enabled && term.length > 0,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useSearchAuthors(q, page = 0, size = 20, enabled = true) {
  const term = (q || '').trim();
  return useQuery({
    queryKey: ['search-authors', term, page, size],
    queryFn: () => apiFetch(`/api/v1/library/search/authors?${params({ q: term, page, size })}`),
    enabled: enabled && term.length > 0,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useLibraryAuthor(id) {
  return useQuery({
    queryKey: ['library-author', id],
    queryFn: () => apiFetch(`/api/v1/library/authors/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });
}
