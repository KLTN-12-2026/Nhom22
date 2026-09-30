'use client';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function enableMocking() {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
        const { worker } = await import('@/mocks/browser');
        await worker.start({ onUnhandledRequest: 'bypass' });
      }
      setMswReady(true);
    }
    enableMocking();
  }, []);

  if (!mswReady) {
    return null; // Tránh render children trước khi msw sẳn sàng
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
