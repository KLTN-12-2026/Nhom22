'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { fx } from '@/lib/fx';
import { REALTIME_EVENT, REALTIME_KEYS, STREAM_URL, incidentMessage, keysFor, parseEvent } from '@/lib/realtime.mjs';

const JOB_TOAST_GAP_MS = 60_000;

export function useEventStream(userId) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const lastJobToast = useRef(0);

  useEffect(() => {
    if (userId == null || typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(STREAM_URL, { withCredentials: true });
    const announce = async () => {
      fx.play('notify');
      let latest = null;
      try { latest = (await apiFetch('/api/v1/notifications?page=0&size=1'))?.thongBao?.items?.[0] || null; } catch {}
      const link = latest?.lienKet;
      const safe = typeof link === 'string' && /^\/(?!\/)/.test(link) && !/[\\\u0000- ]/.test(link);
      const body = latest?.noiDung || 'Mở chuông thông báo để xem chi tiết.';
      toast(body.length > 140 ? `${body.slice(0, 140)}…` : body, {
        variant: 'notify',
        title: latest?.tieuDe || 'Bạn có thông báo mới',
        duration: 8000,
        action: safe ? { label: 'Xem', onClick: () => router.push(link) } : undefined,
      });
    };
    const listeners = Object.keys(REALTIME_KEYS).map(type => {
      const listener = event => {
        const { id } = parseEvent(event.data);
        keysFor(type, id).forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: { loai: type, id } }));
        if (type === 'THONG_BAO_MOI') announce();
        if (type === 'BAO_CAO_MOI') {
          fx.play('notify');
          toast('Một người học vừa gửi báo cáo vi phạm.', {
            variant: 'notify',
            title: 'Có báo cáo mới',
            duration: 8000,
            action: { label: 'Xem', onClick: () => router.push('/quan-tri/bao-cao') },
          });
        }
        if (type === 'SU_CO_HE_THONG') {
          const message = incidentMessage(id);
          const isJob = id?.startsWith('TAC_VU');
          if (message && (!isJob || Date.now() - lastJobToast.current > JOB_TOAST_GAP_MS)) {
            if (isJob) lastJobToast.current = Date.now();
            toast(message.text, message.bad ? { variant: 'error' } : undefined);
          }
        }
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

export function useRealtimeEvent(type, handler) {
  const saved = useRef(handler);
  useEffect(() => { saved.current = handler; });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const listener = event => { if (event.detail?.loai === type) saved.current(event.detail.id); };
    window.addEventListener(REALTIME_EVENT, listener);
    return () => window.removeEventListener(REALTIME_EVENT, listener);
  }, [type]);
}
