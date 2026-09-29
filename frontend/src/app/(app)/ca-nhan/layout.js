'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export default function ProfileLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className={`${styles.pageGrid} ${styles.withSide}`}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <nav className={styles.accountTabs} aria-label="Tài khoản">
          <Link href="/ca-nhan" className={styles.tab} aria-current={pathname === '/ca-nhan' ? 'page' : undefined}>Hồ sơ</Link>
          <Link href="/ca-nhan/hoc-tap" className={styles.tab} aria-current={pathname === '/ca-nhan/hoc-tap' ? 'page' : undefined}>Thiết lập học</Link>
          <Link href="/ca-nhan/bao-mat" className={styles.tab} aria-current={pathname === '/ca-nhan/bao-mat' ? 'page' : undefined}>Bảo mật</Link>
          <Link href="/ca-nhan/thong-bao" className={styles.tab} aria-current={pathname === '/ca-nhan/thong-bao' ? 'page' : undefined}>Thông báo</Link>
        </nav>
        {children}
      </section>

      <aside className={styles.sideCol}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Tài khoản</h2>
          <dl className={styles.kv}>
            <dt>Trạng thái</dt><dd><span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Đã xác thực email</span></dd>
            <dt>Vai trò</dt><dd>Người học</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
