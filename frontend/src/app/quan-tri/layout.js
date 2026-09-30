'use client';
import { AppShell } from '@/components/layout';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { useEffect, useState } from 'react';

export default function AdminRouteLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('vocab_demo_user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) {}
    } else {
      setUser({ tenHienThi: 'Admin', vaiTro: ['ADMIN'] });
    }
  }, []);

  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <AppShell user={user} isAdmin={true}>
        {children}
      </AppShell>
    </RouteGuard>
  );
}
