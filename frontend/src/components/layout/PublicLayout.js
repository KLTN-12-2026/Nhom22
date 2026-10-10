'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

import { AppShell } from './AppShell';

export function PublicLayout({ children }) {
  const pathname = usePathname();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me'),
    retry: false,
    staleTime: 60000
  });

  const navLinks = [
    { href: '/thu-vien', label: 'Thư viện', key: 'library' },
    { href: '/huong-dan', label: 'Cách học', key: 'guide' },
    { href: '/chinh-sach', label: 'Chính sách', key: 'policy' },
  ];



  if (me) {
    return (
      <AppShell user={me} isAdmin={me.vaiTro?.includes('ADMIN')}>
        {children}
      </AppShell>
    );
  }

  return (
    <div className="public-layout">
      <header className="site-header">
        <div className="site-header-inner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-4)', height: 'var(--header-h)', margin: '0 auto', maxWidth: '1200px'
        }}>
          <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <img className="brand-mark" src="/shared/assets/logo-mark.svg" alt="" width="28" height="28" />
            <span>Vocab<span className="brand-accent">Learning</span></span>
          </Link>

          <nav className="site-nav" aria-label="Trang công khai" style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {navLinks.map(link => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
                style={{
                  color: pathname.startsWith(link.href) ? 'var(--color-primary)' : 'var(--color-ink-2)',
                  fontWeight: pathname.startsWith(link.href) ? '600' : '500',
                  textDecoration: 'none'
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link href="/dang-nhap" className="btn btn-quiet">Đăng nhập</Link>
            <Link href="/dang-ky" className="btn btn-primary site-create">Tạo tài khoản</Link>
          </div>
        </div>
      </header>

      <main className="app-main" id="main" style={{ paddingBottom: 'var(--space-7)', minHeight: 'calc(100vh - var(--header-h))' }}>
        {children}
      </main>
    </div>
  );
}
