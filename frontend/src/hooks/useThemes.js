'use client';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { skinSlug } from '@/lib/skins.mjs';

export function applySkin(code) {
  if (typeof window === 'undefined') return;
  const slug = skinSlug(code);
  if (window.VocabSkin) window.VocabSkin.set(slug);
}

export function useThemes({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['themes'],
    queryFn: () => apiFetch('/api/v1/me/themes'),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
  const current = query.data?.giaoDienMa;
  useEffect(() => { if (current) applySkin(current); }, [current]);
  return query;
}

export function useChooseTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giaoDienMa => apiFetch('/api/v1/me/theme', { method: 'PUT', body: JSON.stringify({ giaoDienMa }) }),
    onMutate: giaoDienMa => {
      const previous = typeof window !== 'undefined' && window.VocabSkin ? window.VocabSkin.get() : null;
      applySkin(giaoDienMa);
      return { previous };
    },
    onError: (_error, _code, context) => { if (context?.previous && window.VocabSkin) window.VocabSkin.set(context.previous); },
    onSuccess: data => queryClient.setQueryData(['themes'], data),
  });
}
