'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ErrorState } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

export function RouteGuard({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, error, refetch } = useMe();
  const needsOnboarding = user && !user.daHoanTatKhoiDau && !(pathname.startsWith('/quan-tri') && user.vaiTro?.includes('ADMIN'));

  useEffect(() => {
    if (isLoading || !requireAuth || (error && error.status !== 401)) return;

    if (requireAuth && (!user || error?.status === 401)) {
      router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
    } else if (needsOnboarding && !requireAdmin && pathname !== '/bat-dau') {
      router.replace(`/bat-dau?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, requireAuth, requireAdmin, router, error, pathname, needsOnboarding]);

  if (isLoading && requireAuth) return <div className="page sheet skeleton"><div className="sk sk-row" /></div>;
  if (requireAuth && error && error.status !== 401) return <div className="page sheet"><ErrorState description={error.message} onRetry={refetch} /></div>; // Hoặc một skeleton/spinner

  if (requireAuth && !user) return null;
  if (requireAdmin && (!user || !user.vaiTro?.includes('ADMIN'))) return <section className="page sheet"><h1>Không có quyền truy cập</h1><p>Trang này dành cho quản trị viên.</p><Link className="btn btn-primary" href="/bo-the">Bộ của tôi</Link></section>;
  if (requireAuth && needsOnboarding && !requireAdmin && pathname !== '/bat-dau') return null;

  return <>{children}</>;
}
