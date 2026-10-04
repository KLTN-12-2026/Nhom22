'use client';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

// Thêm biến global này ở ngoài để giữ Promise khởi động MSW
let mockingPromise;

export function Providers({ children }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // Chỉ gọi start() nếu chưa có mockingPromise nào được tạo
    if (!mockingPromise) {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
        mockingPromise = import('@/mocks/browser').then(({ worker }) => {
          return worker.start({ onUnhandledRequest: 'bypass' }).catch(() => { });
        });
      } else {
        mockingPromise = Promise.resolve();
      }
    }

    mockingPromise.then(() => {
      setMswReady(true);
    });
  }, []);

  if (!mswReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
