'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';

export function RouteGuard({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      router.push('/dang-nhap');
    } else if (user && requireAdmin && !user.vaiTro?.includes('ADMIN')) {
      router.push('/bo-the');
    }
  }, [user, isLoading, requireAuth, requireAdmin, router]);

  if (isLoading) return null; // Hoặc một skeleton/spinner

  if (requireAuth && !user) return null;
  if (requireAdmin && (!user || !user.vaiTro?.includes('ADMIN'))) return null;

  return <>{children}</>;
}
