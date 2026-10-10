'use client';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { AppShell } from '@/components/layout';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { useMe } from '@/hooks/useMe';

export default function AppRouteLayout({ children }) {
  const { data: user } = useMe();

  return (
    <RouteGuard requireAuth={true}>
      <AppShell user={user} isAdmin={user?.vaiTro?.includes('ADMIN')}>
        <FeatureGate>{children}</FeatureGate>
      </AppShell>
    </RouteGuard>
  );
}
