'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dummy implementation for F0.4 Layout & Route Guard step.
// Replace with actual auth logic in Sprint S3 (B1.1 - B1.4)
export function RouteGuard({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();

  useEffect(() => {
    // Fake auth check - to be replaced with real auth context later
    const userStr = localStorage.getItem('vocab_demo_user');
    let user = null;
    
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {}
    }

    if (requireAuth && !user) {
      // Not logged in, redirect to login
      router.push('/dang-nhap');
    } else if (user && requireAdmin && !user.vaiTro?.includes('ADMIN')) {
      // Not admin, redirect to app
      router.push('/bo-the');
    }
  }, [requireAuth, requireAdmin, router]);

  return <>{children}</>;
}
