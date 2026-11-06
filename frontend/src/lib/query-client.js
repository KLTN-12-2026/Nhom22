import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './api-client';

function expiredSession(error) {
  if (!(error instanceof ApiError) || error.status !== 401 || typeof window === 'undefined') return;
  if (/^\/(bo-the|ca-nhan|bat-dau|quan-tri)(\/|$)/.test(window.location.pathname)) {
    window.location.assign(`/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }
}
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: expiredSession }),
  mutationCache: new MutationCache({ onError: expiredSession }),
  defaultOptions: {
    queries: { retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2, staleTime: 60000 },
    mutations: { retry: false },
  },
});
