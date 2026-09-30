'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';

const NAV = [
  { group: "Học tập", items: [
    { key: "today", label: "Hôm nay", icon: "today", soon: "Đợt 2" },
    { key: "decks", label: "Bộ của tôi", icon: "decks", href: "/bo-the" },
    { key: "library", label: "Thư viện", icon: "library", href: "/thu-vien" },
    { key: "practice", label: "Luyện tập", icon: "practice", soon: "Đợt 2" },
    { key: "notebook", label: "Sổ tay", icon: "notebook", soon: "Đợt 2" }
  ] },
  { group: "Tài khoản", items: [
    { key: "profile", label: "Hồ sơ", icon: "user", href: "/ca-nhan" },
    { key: "learning", label: "Thiết lập học", icon: "target", href: "/ca-nhan/hoc-tap" },
    { key: "security", label: "Bảo mật", icon: "shield", href: "/ca-nhan/bao-mat" },
    { key: "notify", label: "Thông báo", icon: "bell", href: "/ca-nhan/thong-bao" }
  ] }
];

const ADMIN_NAV = [
  ...NAV,
  { group: "Quản trị", admin: true, items: [
    { key: "admin-topics", label: "Chủ đề & nhãn", icon: "folder", href: "/quan-tri/chu-de" }
  ] }
];

const BOTTOM = [
  { key: "decks", label: "Học", icon: "decks", href: "/bo-the", also: ["deck-new"] },
  { key: "library", label: "Thư viện", icon: "library", href: "/thu-vien" },
  { key: "practice", label: "Luyện tập", icon: "practice", soon: "Đợt 2" },
  { key: "notebook", label: "Sổ tay", icon: "notebook", soon: "Đợt 2" },
  { key: "me", label: "Tôi", icon: "user", href: "/ca-nhan", also: ["profile", "learning", "security", "notify", "admin-topics"] }
];

export function AppShell({ children, user, isAdmin = false }) {
  const pathname = usePathname();
  const navList = isAdmin ? ADMIN_NAV : NAV;

  const isActive = (href) => pathname.startsWith(href);

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="app-header" style={{
        height: 'var(--header-h)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-field)'
      }}>
        <Link href="/bo-the" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 'bold' }}>
          <span style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>V</span>
          <span>Vocab<span style={{ color: 'var(--color-accent)' }}>Learning</span></span>
        </Link>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {user && (
            <Link href="/ca-nhan" className="user-chip" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--color-ink)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {user.tenHienThi ? user.tenHienThi[0].toUpperCase() : 'U'}
              </div>
              <span className="user-name" style={{ fontWeight: '500' }}>{user.tenHienThi || 'User'}</span>
            </Link>
          )}
          <button className="btn btn-quiet btn-icon" aria-label="Đăng xuất" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-2)' }}>
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <div className="app-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav className="sidebar" aria-label="Điều hướng chính" style={{
          width: 'var(--sidebar-w)', flexShrink: 0, overflowY: 'auto', backgroundColor: 'var(--color-desk)', borderRight: '1px solid var(--color-border)', padding: 'var(--space-4) 0'
        }}>
          {navList.map((g) => (
            <div key={g.group} className="nav-group" style={{ marginBottom: 'var(--space-6)' }}>
              <p className="nav-group-title" style={{ padding: '0 var(--space-4)', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-ink-3)', marginBottom: 'var(--space-2)' }}>
                {g.group}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {g.items.map(it => {
                  const active = it.href && isActive(it.href);
                  if (it.soon) {
                    return (
                      <li key={it.key} style={{ padding: 'var(--space-2) var(--space-4)', color: 'var(--color-ink-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', opacity: 0.7 }}>
                        <Icon name={it.icon} /> <span>{it.label}</span> <span style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-border)', padding: '2px 6px', borderRadius: '4px' }}>{it.soon}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={it.key}>
                      <Link href={it.href} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', textDecoration: 'none',
                        color: active ? 'var(--color-primary-strong)' : 'var(--color-ink-2)',
                        backgroundColor: active ? 'var(--color-primary-tint)' : 'transparent',
                        fontWeight: active ? '600' : '500',
                        borderRight: active ? '3px solid var(--color-primary)' : '3px solid transparent'
                      }}>
                        <Icon name={it.icon} />
                        <span>{it.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main className="app-main" id="main" style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-sheet)', padding: 'var(--space-6) var(--space-8)' }}>
          {children}
        </main>
      </div>

      <nav className="bottom-nav" style={{ display: 'none' /* Will be styled with media queries for mobile in css */ }}></nav>
    </div>
  );
}
