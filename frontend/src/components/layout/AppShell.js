'use client';
import { useState } from 'react';
import { useAvatar } from '@/hooks/useAvatar';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';

const NAV = [
  { group: "Học tập", items: [
    { key: "today", label: "Hôm nay", icon: "today", href: "/hom-nay" },
    { key: "decks", label: "Bộ của tôi", icon: "decks", href: "/bo-the" },
    { key: "library", label: "Thư viện", icon: "library", href: "/thu-vien" },
    { key: "practice", label: "Luyện tập", icon: "practice", href: "/luyen-tap" },
    { key: "notebook", label: "Sổ tay", icon: "notebook", href: "/so-tay" },
    { key: "stats", label: "Thống kê", icon: "chart", href: "/thong-ke" }
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
  { group: "Quản trị", items: [
    { key: "admin-dashboard", label: "Vào trang Quản trị", icon: "settings", href: "/quan-tri/chu-de" }
  ] }
];

const ADMIN_NAV_ONLY = [
  { group: "Ứng dụng", items: [
    { key: "back", label: "Trở về ứng dụng", icon: "arrow-left", href: "/hom-nay" }
  ] },
  { group: "Quản trị", items: [
    { key: "admin-topics", label: "Chủ đề & nhãn", icon: "folder", href: "/quan-tri/chu-de" },
    { key: "admin-users", label: "Tài khoản", icon: "user", href: "/quan-tri/tai-khoan" },
    { key: "admin-decks", label: "Bộ mẫu", icon: "decks", href: "/quan-tri/bo-mau" },
    { key: "admin-audit", label: "Nhật ký", icon: "file", href: "/quan-tri/nhat-ky" }
  ] }
];

const BOTTOM = [
  { key: "decks", label: "Học", icon: "decks", href: "/bo-the", also: ["deck-new"] },
  { key: "library", label: "Thư viện", icon: "library", href: "/thu-vien" },
  { key: "practice", label: "Luyện tập", icon: "practice", href: "/luyen-tap" },
  { key: "notebook", label: "Sổ tay", icon: "notebook", href: "/so-tay" },
  { key: "me", label: "Tôi", icon: "user", href: "/ca-nhan", also: ["profile", "learning", "security", "notify", "admin-topics"] }
];

export function AppShell({ children, user, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const { data: avatar } = useAvatar(user);
  const pathname = usePathname();

  // Decide which sidebar to show based on the current URL
  const inAdminArea = pathname.startsWith('/quan-tri');
  const navList = (isAdmin && inAdminArea) ? ADMIN_NAV_ONLY : (isAdmin ? ADMIN_NAV : NAV);

  const isActive = (href) => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  if (pathname === '/bat-dau') {
    return <>{children}</>;
  }

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <header className="app-header">
        <Link href="/bo-the" className="brand">
          <img className="brand-mark" src="/shared/assets/logo-mark.svg" alt="" width="28" height="28" />
          <span>Vocab<span className="brand-accent">Learning</span></span>
        </Link>
        <div className="header-actions">
          {user && (
            <Link href="/ca-nhan" className="user-chip" aria-label={`Hồ sơ của ${user.tenHienThi || 'User'}`}>
              <span className="avatar">
                {avatar?.downloadUrl ? (
                  <img src={avatar?.downloadUrl} alt="" />
                ) : (
                  (user.tenHienThi || 'U').split(/\s+/).pop()[0].toUpperCase()
                )}
              </span>
              <span className="user-name">{user.tenHienThi || 'User'}</span>
            </Link>
          )}
          <button
            className="btn btn-quiet btn-icon"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={() => {
              // Basic logout logic: redirect to login
              logout(queryClient).catch(error => alert(error.message));
            }}
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar" aria-label="Điều hướng chính">
          <button type="button" className="btn btn-quiet sidebar-toggle" aria-controls="sidebar-links" aria-expanded={!collapsed} aria-label={collapsed ? 'Mở rộng điều hướng' : 'Thu gọn điều hướng'} title={collapsed ? 'Mở rộng điều hướng' : 'Thu gọn điều hướng'} onClick={() => setCollapsed(value => !value)}><Icon name={collapsed ? 'chevron-right' : 'chevron-left'} /><span className="nav-label">Thu gọn</span></button>
          <div id="sidebar-links">
          {navList.map((g) => (
            <div key={g.group} className="nav-group">
              <p className="nav-group-title">{g.group}</p>
              {g.items.map(it => {
                const active = it.href && isActive(it.href);
                if (it.soon) {
                  return (
                    <span key={it.key} className="nav-link" aria-label={it.label} title={it.label} aria-disabled="true">
                      <Icon name={it.icon} />
                      <span className="nav-label">{it.label}</span>
                      <span className="nav-soon">{it.soon}</span>
                    </span>
                  );
                }
                return (
                  <Link key={it.key} className="nav-link" href={it.href} aria-current={active ? 'page' : undefined} aria-label={it.label} title={it.label}>
                    <Icon name={it.icon} />
                    <span className="nav-label">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
          </div>
        </nav>

        <main className="app-main" id="main">
          {children}
        </main>
      </div>

      <nav className="bottom-nav" hidden={pathname === '/hoc-phien' || pathname === '/luyen-tap-lam-bai'} aria-label="Điều hướng chính">
        {BOTTOM.map(it => {
          const cur = isActive(it.href || '/--not-found');
          if (it.soon) {
            return (
              <span key={it.key} aria-disabled="true" title={`Có ở ${it.soon}`}>
                <span className="nav-bubble"><Icon name={it.icon} /></span>
                {it.label}
              </span>
            );
          }
          return (
            <Link key={it.key} href={it.href} aria-current={cur ? 'page' : undefined}>
              <span className="nav-bubble"><Icon name={it.icon} /></span>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
