'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ErrorState } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

export function RouteGuard({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, error, refetch } = useMe();

  useEffect(() => {
    if (isLoading || !requireAuth || (error && error.status !== 401)) return;

    if (requireAuth && !user) {
      router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
    } else if (user && requireAdmin && !user.vaiTro?.includes('ADMIN')) {
      router.push('/bo-the');
    }
  }, [user, isLoading, requireAuth, requireAdmin, router, error, pathname]);

  if (isLoading && requireAuth) return <div className="page sheet skeleton"><div className="sk sk-row" /></div>;
  if (requireAuth && error && error.status !== 401) return <div className="page sheet"><ErrorState description={error.message} onRetry={refetch} /></div>; // Hoặc một skeleton/spinner

  if (requireAuth && !user) return null;
  if (requireAdmin && (!user || !user.vaiTro?.includes('ADMIN'))) return null;

  return <>{children}</>;
}
