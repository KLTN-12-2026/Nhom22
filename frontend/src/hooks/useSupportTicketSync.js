'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SUPPORT_STORAGE_PREFIX, SUPPORT_UPDATE_EVENT } from '@/lib/support-admin.mjs';

export function useSupportTicketSync() {
  const client = useQueryClient();
  useEffect(() => {
    const refresh = event => {
      if (event.type === 'storage' && event.key !== null && !event.key?.startsWith(SUPPORT_STORAGE_PREFIX)) return;
      void client.invalidateQueries({ queryKey: ['support-tickets-demo'] });
      void client.invalidateQueries({ queryKey: ['admin-support-tickets-demo'] });
    };
    window.addEventListener('storage', refresh);
    window.addEventListener(SUPPORT_UPDATE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(SUPPORT_UPDATE_EVENT, refresh);
    };
  }, [client]);
}
