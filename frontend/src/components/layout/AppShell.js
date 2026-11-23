'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { SettingsMenu, SETTINGS_LINKS, ADMIN_LINK } from './SettingsMenu';
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
import { NavQuota, UpgradeDialog } from '@/components/billing/PlanAccess';
import { SkinSync } from '@/components/skin/SkinSync';

const HOME = '/hom-nay';
const visible = (groups) => groups.map(g => ({ ...g, items: g.items.filter(it => !isPendingRoute(it.href)).map(it => it.sub && isPendingRoute(it.sub.href) ? { ...it, sub: undefined } : it) })).filter(g => g.items.length);

const NAV = [
  { group: "Học tập", items: [
    { key: "today", hue: "#e8590c", label: "Hôm nay", icon: "today", href: "/hom-nay" },
    { key: "decks", hue: "#3b5bdb", label: "Bộ của tôi", icon: "decks", href: "/bo-the", sub: { key: "publish-requests", label: "Yêu cầu công khai", icon: "copy", href: "/yeu-cau-cong-khai" } },
    { key: "library", hue: "#0c8599", label: "Thư viện", icon: "library", href: "/thu-vien" },
    { key: "dictionary", hue: "#7048e8", label: "Từ điển", icon: "book", href: "/tu-dien" },
    { key: "practice", hue: "#1c7ed6", label: "Luyện tập", icon: "practice", href: "/luyen-tap" },
    { key: "notebook", hue: "#e03131", label: "Sổ tay", icon: "notebook", href: "/so-tay" }
  ] },
  { group: "Công cụ AI", items: [
    { key: "ai-workshop", hue: "#ae3ec9", label: "Xưởng thẻ AI", icon: "sparkles", href: "/ai-xuong-the", feature: "AI", sub: { key: "ai-history", label: "Lịch sử AI", icon: "clock", href: "/ai-lich-su" } },
    { key: "ai-sentence", hue: "#f08c00", label: "Viết câu", icon: "edit", href: "/ai-viet-cau", feature: "AI" },
    { key: "pronunciation", hue: "#c2255c", label: "Phát âm", icon: "mic", href: "/phat-am", feature: "PHAT_AM", sub: { key: "pronunciation-history", label: "Lịch sử phát âm", icon: "clock", href: "/phat-am-lich-su" } }
  ] },
  { group: "Tiến bộ", items: [
    { key: "stats", hue: "#2f9e44", label: "Thống kê", icon: "chart", href: "/thong-ke" },
    { key: "recommendations", hue: "#1098ad", label: "Gợi ý ôn tập", icon: "target", href: "/goi-y" },
    { key: "mastery-map", hue: "#5c940d", label: "Bản đồ làm chủ", icon: "chart", href: "/ban-do-lam-chu" },
    { key: "weekly-summary", hue: "#e67700", label: "Tổng kết tuần", icon: "calendar", href: "/tong-ket-tuan" },
    { key: "achievements", hue: "#d4a017", label: "Thành tích", icon: "shield", href: "/thanh-tich" },
    { key: "leaderboard", hue: "#e8890c", label: "Bảng xếp hạng", icon: "star", href: "/bang-xep-hang" }
  ] }
];

const PIN_KEY = 'vocab:rail-pinned';
const readPinned = () => { try { return localStorage.getItem(PIN_KEY) === '1'; } catch { return false; } };
const pinSubscribe = listener => {
  window.addEventListener('vocab-rail-pin', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('vocab-rail-pin', listener);
    window.removeEventListener('storage', listener);
  };
};

const flatGroups = (groups, isAdmin) => [
  ...groups.map(g => ({ ...g, items: g.items.flatMap(({ sub, ...it }) => sub ? [it, { ...sub, hue: it.hue }] : [it]) })),
  { group: "Tài khoản", items: [...SETTINGS_LINKS.flat(), ...(isAdmin ? [ADMIN_LINK] : [])] }
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

  const navList = visible(NAV);
  const allGroups = visible(flatGroups(navList, isAdmin));
  const bottomItems = BOTTOM.filter(it => !isPendingRoute(it.href));

  const searchPages = allGroups.flatMap(group => group.items).filter(item => item.href);

  const isActive = (href) => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const pinned = useSyncExternalStore(pinSubscribe, readPinned, () => false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hoverTimer = useRef(null);
  const railOpen = pinned || hovered || focused || menuOpen;

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const togglePin = () => {
    try { localStorage.setItem(PIN_KEY, pinned ? '0' : '1'); } catch { }
    window.dispatchEvent(new Event('vocab-rail-pin'));
  };
  const onEnter = () => { clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHovered(true), 90); };
  const onLeave = () => { clearTimeout(hoverTimer.current); setHovered(false); };
  const onBlur = event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); };

  useEffect(() => {
    const link = document.querySelector('#sidebar-links .rail-row[aria-current="page"]');
    if (link) link.scrollIntoView({ block: 'nearest' });
  }, [pathname]);

  if (pathname === '/bat-dau' || pathname === '/hoc-phien' || pathname === '/luyen-tap-lam-bai') {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <MobileNavigation groups={allGroups} onLogout={handleLogout} />
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
        <div className="app-rail" data-pinned={pinned || undefined}>
          <nav className="rail" data-open={railOpen || undefined} aria-label="Điều hướng chính" onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={event => { if (event.target.matches(':focus-visible')) setFocused(true); }} onBlur={onBlur}>
            <button type="button" className="rail-pin" aria-pressed={pinned} aria-label={pinned ? 'Bỏ ghim thanh điều hướng' : 'Ghim mở thanh điều hướng'} title={pinned ? 'Bỏ ghim' : 'Ghim mở'} onClick={togglePin}>
              <Icon name="pin" />
            </button>
            <div id="sidebar-links" className="rail-scroll">
              {navList.map(g => (
                <div key={g.group} className="rail-group">
                  <p className="rail-group-title">{g.group}</p>
                  {g.items.map(it => {
                    const subActive = it.sub && isActive(it.sub.href);
                    const active = isActive(it.href) || subActive;
                    return (
                      <div key={it.key} className="rail-row" style={{ '--hue': it.hue }} aria-current={active ? 'page' : undefined}>
                        <Link className="rail-link" href={it.href} aria-label={it.label} aria-current={active && !subActive ? 'page' : undefined}>
                          <Icon name={it.icon} />
                          <span className="rail-label">{it.label}</span>
                          {it.feature && user && <span className="rail-extra"><NavQuota feature={it.feature} /></span>}
                        </Link>
                        {it.sub && (
                          <Link className="rail-sub" href={it.sub.href} aria-label={it.sub.label} title={it.sub.label} aria-current={subActive ? 'page' : undefined}>
                            <Icon name={it.sub.icon} />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {user && (
              <div className="rail-foot">
                <SettingsMenu user={user} avatar={avatar} tier={tier} isAdmin={isAdmin} open={menuOpen} onOpenChange={setMenuOpen} onLogout={handleLogout} />
              </div>
            )}
          </nav>
        </div>

        <main className="app-main" id="main">
          {children}
        </main>
        {user && <UpgradeDialog />}
        {user && <SkinSync />}
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
