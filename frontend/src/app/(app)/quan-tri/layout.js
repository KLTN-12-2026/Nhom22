'use client';
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function AdminRouteLayout({ children }) {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      {children}
    </RouteGuard>
  );
}
