'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Icon } from '@/components/ui';

export function PublicLayout({ children }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/thu-vien', label: 'Thư viện', key: 'library' },
    { href: '/huong-dan', label: 'Cách học', key: 'guide' },
    { href: '/chinh-sach', label: 'Chính sách', key: 'policy' },
  ];

  return (
    <div className="public-layout">
      <header className="site-header">
        <div className="site-header-inner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-4)', height: 'var(--header-h)', margin: '0 auto', maxWidth: '1200px'
        }}>
          <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-primary)', color: 'white', borderRadius: '4px', width: '28px', height: '28px', fontWeight: 'bold'
            }}>V</span>
            <span>Vocab<span style={{ color: 'var(--color-accent)' }}>Learning</span></span>
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
            <Link href="/dang-nhap" style={{ textDecoration: 'none' }}>
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link href="/dang-ky" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Tạo tài khoản</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="app-main" id="main" style={{ paddingBottom: 'var(--space-7)', minHeight: 'calc(100vh - var(--header-h))' }}>
        {children}
      </main>
    </div>
  );
}
