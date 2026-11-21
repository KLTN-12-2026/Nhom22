'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import { ProfileCard } from '@/components/profile/ProfileCard';
import styles from './layout.module.css';

const TABS = [
  { href: '/ca-nhan', label: 'Tổng quan', icon: 'user' },
  { href: '/ca-nhan/hoc-tap', label: 'Thiết lập học', icon: 'target' },
  { href: '/ca-nhan/bao-mat', label: 'Bảo mật', icon: 'shield' },
  { href: '/ca-nhan/thong-bao', label: 'Thông báo', icon: 'bell' },
];

export default function ProfileLayout({ children }) {
  const pathname = usePathname();
  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => apiFetch('/api/v1/me') });

  if (isLoading) {
    return <div className="page"><div className="sheet"><div className="skeleton"><div className="sk sk-title"></div><div className="sk sk-row"></div><div className="sk sk-row"></div></div></div></div>;
  }

  return (
    <div className={`page ${styles.profile}`}>
      <aside className={styles.side} aria-labelledby="profile-name">
        <ProfileCard me={me} />
      </aside>
      <div className={styles.main}>
        <nav className={styles.tabs} aria-label="Tài khoản">
          {TABS.map(tab => (
            <Link key={tab.href} href={tab.href} className={styles.tab} aria-current={pathname === tab.href ? 'page' : undefined}>
              <Icon name={tab.icon} />{tab.label}
            </Link>
          ))}
        </nav>
        {pathname === '/ca-nhan' ? children : <section className="sheet" aria-labelledby="page-title">{children}</section>}
      </div>
    </div>
  );
}
