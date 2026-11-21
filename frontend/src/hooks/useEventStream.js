'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { REALTIME_KEYS, STREAM_URL, keysFor, parseEvent } from '@/lib/realtime.mjs';

export function useEventStream(userId) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (userId == null || typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(STREAM_URL, { withCredentials: true });
    const listeners = Object.keys(REALTIME_KEYS).map(type => {
      const listener = event => {
        const { id } = parseEvent(event.data);
        keysFor(type, id).forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
        if (type === 'THONG_BAO_MOI') toast('Bạn có thông báo mới');
        if (type === 'TAI_KHOAN_BI_KHOA') {
          source.close();
          queryClient.clear();
          toast('Tài khoản của bạn đã bị khóa', { variant: 'error' });
          router.replace('/dang-nhap');
        }
      };
      source.addEventListener(type, listener);
      return [type, listener];
    });
    return () => {
      listeners.forEach(([type, listener]) => source.removeEventListener(type, listener));
      source.close();
    };
  }, [userId, queryClient, router, toast]);
}
