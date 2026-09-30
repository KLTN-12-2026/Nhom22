'use client';
import { AppShell } from '@/components/layout';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { useEffect, useState } from 'react';

export default function AppRouteLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('vocab_demo_user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) {}
    } else {
      // Dummy user for testing if no user is set, remove later.
      setUser({ tenHienThi: 'Demo User', vaiTro: ['USER'] });
    }
  }, []);

  return (
    <RouteGuard requireAuth={true}>
      <AppShell user={user}>
        {children}
      </AppShell>
    </RouteGuard>
  );
}
