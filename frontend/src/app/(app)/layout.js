'use client';
import { usePathname } from 'next/navigation';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { AppShell, AdminShell } from '@/components/layout';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { useMe } from '@/hooks/useMe';

export default function AppRouteLayout({ children }) {
  const { data: user } = useMe();
  const pathname = usePathname();
  const isAdmin = user?.vaiTro?.includes('ADMIN');

  if (pathname.startsWith('/quan-tri')) {
    return (
      <RouteGuard requireAuth={true}>
        <AdminShell user={user}>{children}</AdminShell>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <AppShell user={user} isAdmin={isAdmin}>
        <FeatureGate>{children}</FeatureGate>
      </AppShell>
    </RouteGuard>
  );
}
