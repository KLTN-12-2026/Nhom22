'use client';
import Link from 'next/link';
import { RouteGuard } from '@/components/layout/RouteGuard';
import styles from './layout.module.css';

export default function AuthLayout({ children }) {
  return (
    <RouteGuard requireAuth={false}>
      <div className={styles.auth}>
        <aside className={styles.authAside}>
          <Link href="/" className={styles.brand} style={{ color: 'white' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: 'var(--color-primary)', borderRadius: '4px', width: '28px', height: '28px', fontWeight: 'bold' }}>V</span>
            <span>Vocab<span style={{ color: 'var(--color-accent)' }}>Learning</span></span>
          </Link>
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-4)', lineHeight: 1.3 }}>Bắt đầu hành trình chinh phục từ vựng</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', color: 'var(--color-primary-tint)' }}>
              <li>✓ Bộ mẫu Giao tiếp và TOEIC để bắt đầu ngay</li>
              <li>✓ Ôn đúng lúc bằng thuật toán lặp lại ngắt quãng (SRS)</li>
              <li>✓ Tự tạo bộ thẻ, nhập từ tệp CSV</li>
            </ul>
          </div>
        </aside>
        <main className={styles.authMain}>
          <Link href="/" className={styles.brand}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', width: '28px', height: '28px', fontWeight: 'bold' }}>V</span>
            <span>Vocab<span style={{ color: 'var(--color-accent)' }}>Learning</span></span>
          </Link>
          <div className={styles.authForm}>
            {children}
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
