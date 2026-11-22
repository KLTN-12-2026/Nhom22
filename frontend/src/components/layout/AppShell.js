'use client';
import { useEffect } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useAvatar } from '@/hooks/useAvatar';
import { useEventStream } from '@/hooks/useEventStream';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, useToast } from '@/components/ui';
import { isPendingRoute } from './FeatureGate';
import { StreakChip } from '@/components/engagement/StreakChip';
import { useTier, useTierAttribute } from '@/components/tier/useTier';
import { TierAvatarOrnament, TierHeader } from '@/components/tier/TierHeader';
import { TierSideCard } from '@/components/tier/TierSideCard';

const HOME = '/hom-nay';
const visible = (groups) => groups.map(g => ({ ...g, items: g.items.filter(it => !isPendingRoute(it.href)) })).filter(g => g.items.length);

const NAV = [
  { group: "Học tập", items: [
    { key: "today", hue: "#e8590c", label: "Hôm nay", icon: "today", href: "/hom-nay" },
    { key: "decks", hue: "#3b5bdb", label: "Bộ của tôi", icon: "decks", href: "/bo-the" },
    { key: "library", hue: "#0c8599", label: "Thư viện", icon: "library", href: "/thu-vien" },
    { key: "dictionary", hue: "#7048e8", label: "Từ điển", icon: "book", href: "/tu-dien" },
    { key: "publish-requests", hue: "#d6336c", label: "Yêu cầu công khai", icon: "copy", href: "/yeu-cau-cong-khai" },
    { key: "practice", hue: "#1c7ed6", label: "Luyện tập", icon: "practice", href: "/luyen-tap" },
    { key: "notebook", hue: "#e03131", label: "Sổ tay", icon: "notebook", href: "/so-tay" },
    { key: "stats", hue: "#2f9e44", label: "Thống kê", icon: "chart", href: "/thong-ke" }
  ] },
  { group: "Công cụ học tập", items: [
    { key: "ai-workshop", hue: "#ae3ec9", label: "Xưởng thẻ AI", icon: "sparkles", href: "/ai-xuong-the" },
    { key: "ai-sentence", hue: "#f08c00", label: "Viết câu", icon: "edit", href: "/ai-viet-cau" },
    { key: "ai-history", hue: "#0b7285", label: "Lịch sử AI", icon: "clock", href: "/ai-lich-su" },
    { key: "pronunciation", hue: "#c2255c", label: "Phát âm", icon: "mic", href: "/phat-am" },
    { key: "pronunciation-history", hue: "#9c36b5", label: "Lịch sử phát âm", icon: "file", href: "/phat-am-lich-su" }
  ] },
  { group: "Tiến bộ", items: [
    { key: "recommendations", hue: "#1098ad", label: "Gợi ý ôn tập", icon: "target", href: "/goi-y" },
    { key: "mastery-map", hue: "#5c940d", label: "Bản đồ làm chủ", icon: "chart", href: "/ban-do-lam-chu" },
    { key: "weekly-summary", hue: "#e67700", label: "Tổng kết tuần", icon: "calendar", href: "/tong-ket-tuan" },
    { key: "achievements", hue: "#d4a017", label: "Thành tích", icon: "shield", href: "/thanh-tich" },
    { key: "leaderboard", hue: "#e8890c", label: "Bảng xếp hạng", icon: "star", href: "/bang-xep-hang" }
  ] },
  { group: "Tài khoản", items: [
    { key: "profile", hue: "#4263eb", label: "Hồ sơ", icon: "user", href: "/ca-nhan" },
    { key: "plans", hue: "#b8860b", label: "Gói dịch vụ", icon: "file", href: "/thanh-toan-goi" },
    { key: "payment-history", hue: "#087f5b", label: "Lịch sử thanh toán", icon: "clock", href: "/thanh-toan-lich-su" },
    { key: "learning", hue: "#6741d9", label: "Thiết lập học", icon: "target", href: "/ca-nhan/hoc-tap" },
    { key: "security", hue: "#364fc7", label: "Bảo mật", icon: "shield", href: "/ca-nhan/bao-mat" },
    { key: "privacy", hue: "#0ca678", label: "Quyền riêng tư", icon: "eye", href: "/ca-nhan/rieng-tu" },
    { key: "notify", hue: "#f76707", label: "Thông báo", icon: "bell", href: "/ca-nhan/thong-bao" }
  ] }
];

const ADMIN_NAV = [
  ...NAV,
  { group: "Quản trị", items: [
    { key: "admin-dashboard", hue: "#c92a2a", label: "Vào trang Quản trị", icon: "settings", href: "/quan-tri" }
  ] }
];

const BOTTOM = [
  { key: "today", label: "Học", icon: "today", href: "/hom-nay" },
  { key: "decks", label: "Bộ thẻ", icon: "decks", href: "/bo-the" },
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
  const { tier, plan } = useTier(!!user);
  useTierAttribute(user ? tier : null);
  useEventStream(user?.id);

  const navList = visible(isAdmin ? ADMIN_NAV : NAV);
  const bottomItems = BOTTOM.filter(it => !isPendingRoute(it.href));

  const searchPages = navList.flatMap(group => group.items).filter(item => item.href);

  const isActive = (href) => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    const link = document.querySelector('#sidebar-links .nav-link[aria-current="page"]');
    if (link) link.scrollIntoView({ block: 'nearest' });
  }, [pathname]);

  if (pathname === '/bat-dau' || pathname === '/hoc-phien' || pathname === '/luyen-tap-lam-bai') {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <MobileNavigation groups={navList} onLogout={handleLogout} />
        <Link href={HOME} className="brand">
          <img className="brand-mark" src="/shared/assets/mascot-mark.svg" alt="" width="28" height="28" />
          <span>Vocab<span className="brand-accent">Learning</span></span>
        </Link>
        <GlobalSearch pages={searchPages} />
        <div className="header-actions">
          <div className="header-tools"><SoundToggle /><ThemeToggle /></div>
          {user && <div className="header-status">
            <TierHeader tier={tier} plan={plan} user={user} />
            <StreakChip key={`streak-${user.id}`} userId={user.id} />
            <NotificationBell key={user.id} userId={user.id} />
          </div>}
          {user && (
            <Link href="/ca-nhan" className="user-chip" aria-label={`Hồ sơ của ${user.tenHienThi || 'User'}`}>
              <span className="tier-avatar">
                <span className="avatar">
                  {avatar?.downloadUrl ? (
                    <img src={avatar?.downloadUrl} alt="" />
                  ) : (
                    (user.tenHienThi || 'U').split(/\s+/).pop()[0].toUpperCase()
                  )}
                </span>
                <TierAvatarOrnament tier={tier} />
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
          {navList.map((g, index) => {
            const links = g.items.map(it => {
              const active = it.href && isActive(it.href);
              return (
                <Link key={it.key} className="nav-link" href={it.href} style={it.hue ? { '--hue': it.hue } : undefined} aria-current={active ? 'page' : undefined} aria-label={it.label} title={it.label}>
                  <Icon name={it.icon} />
                  <span className="nav-label">{it.label}</span>
                </Link>
              );
            });
            if (index === 0) {
              return (
                <div key={g.group} className="nav-group">
                  <p className="nav-group-title">{g.group}</p>
                  {links}
                </div>
              );
            }
            const hasActive = g.items.some(it => it.href && isActive(it.href));
            return (
              <details key={`${g.group}-${hasActive}`} className="nav-group nav-fold" open={hasActive || undefined}>
                <summary>{g.group}<Icon name="chevron-down" /></summary>
                {links}
              </details>
            );
          })}
          </div>
          {user && tier && <div className="tier-side"><TierSideCard tier={tier} plan={plan} /></div>}
        </nav>

        <main className="app-main" id="main">
          {children}
        </main>
      </div>

      <nav className="bottom-nav" hidden={pathname === '/hoc-phien' || pathname === '/luyen-tap-lam-bai'} aria-label="Điều hướng chính">
        {bottomItems.map(it => {
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
