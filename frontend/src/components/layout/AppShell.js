'use client';
import { MobileNavigation } from './MobileNavigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAvatar } from '@/hooks/useAvatar';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, useToast } from '@/components/ui';

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
  { key: "today", label: "Học", icon: "today", href: "/hom-nay" },
  { key: "library", label: "Thư viện", icon: "library", href: "/thu-vien" },
  { key: "practice", label: "Luyện tập", icon: "practice", href: "/luyen-tap" },
  { key: "notebook", label: "Sổ tay", icon: "notebook", href: "/so-tay" },
  { key: "me", label: "Tôi", icon: "user", href: "/ca-nhan" }
];

export function AppShell({ children, user, isAdmin = false }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleLogout = () => logout(queryClient).catch(error => toast(error.message, { variant: 'error' }));
  const { data: avatar } = useAvatar(user);
  const pathname = usePathname();

  const inAdminArea = pathname.startsWith('/quan-tri');
  const navList = (isAdmin && inAdminArea) ? ADMIN_NAV_ONLY : (isAdmin ? ADMIN_NAV : NAV);

  const isActive = (href) => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  if (pathname === '/bat-dau' || pathname === '/hoc-phien') {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <MobileNavigation groups={navList} onLogout={handleLogout} />
        <Link href="/hom-nay" className="brand">
          <img className="brand-mark" src="/shared/assets/mascot-mark.svg" alt="" width="28" height="28" />
          <span>Vocab<span className="brand-accent">Learning</span></span>
        </Link>
        <div className="header-actions"><ThemeToggle />
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
            className="btn btn-quiet btn-icon header-logout"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={handleLogout}
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar" aria-label="Điều hướng chính">
          <div id="sidebar-links" className="sidebar-links">
          {navList.map((g) => (
            <div key={g.group} className="nav-group">
              <p className="nav-group-title">{g.group}</p>
              {g.items.map(it => {
                const active = it.href && isActive(it.href);
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
        {(inAdminArea ? ADMIN_NAV_ONLY.flatMap(group=>group.items).map(item=>({...item,label:({'back':'Ứng dụng','admin-topics':'Chủ đề','admin-users':'Tài khoản','admin-decks':'Bộ mẫu','admin-audit':'Nhật ký'})[item.key]})) : BOTTOM).map(it => {
          const cur = it.key==='today' ? ['/hom-nay','/hoc','/bo-the','/thong-ke'].some(route=>isActive(route)) : isActive(it.href);
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
