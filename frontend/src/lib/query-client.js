// query-client.js
// TanStack Query client — xử lý 401 toàn cục
// Cài: npm install @tanstack/react-query

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Không retry khi 401 (unauthorized) hoặc 404
        if (error instanceof ApiError && [401, 404].includes(error.status)) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60, // 1 phút
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          // Redirect về trang đăng nhập khi hết phiên
          if (typeof window !== 'undefined') {
            window.location.href = '/dang-nhap';
          }
        }
      },
    },
  },
});
