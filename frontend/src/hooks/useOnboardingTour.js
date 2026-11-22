'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useMe } from '@/hooks/useMe';

const KEY = ['onboarding-tour'];

export function useOnboardingTour() {
  const { data: me } = useMe();
  const client = useQueryClient();
  const enabled = !!me?.id && !!me.daHoanTatKhoiDau && !me.vaiTro?.includes('ADMIN');
  const tour = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch('/api/v1/me/onboarding-tour'),
    enabled,
    staleTime: 60 * 1000,
    retry: false
  });
  const advance = useMutation({
    mutationFn: ({ buocHuongDan, boSaoChepId }) => apiFetch('/api/v1/me/onboarding-tour', {
      method: 'PUT',
      body: JSON.stringify({ buocHuongDan, boSaoChepId: boSaoChepId || null })
    }),
    onSuccess: data => client.setQueryData(KEY, data)
  });
  const start = useMutation({
    mutationFn: () => apiFetch('/api/v1/me/onboarding-tour/start', { method: 'POST' }),
    onSuccess: data => {
      client.setQueryData(KEY, data);
      client.invalidateQueries({ queryKey: ['learning-today'] });
      client.invalidateQueries({ queryKey: ['my-decks'] });
    }
  });
  return { tour: enabled ? tour.data : undefined, advance, start };
}
