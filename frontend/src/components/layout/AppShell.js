'use client';
import { useState } from 'react';
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
import { UpgradeDialog } from '@/components/billing/PlanAccess';
import { NAV, Rail } from './Rail';
import { SkinSync } from '@/components/skin/SkinSync';

const HOME = '/hom-nay';
const pending = href => isPendingRoute(href);
const visible = groups => groups
  .map(g => ({ ...g, items: g.items.filter(it => !pending(it.href)).map(it => (it.subs ? { ...it, subs: it.subs.filter(sub => !pending(sub.href)) } : it)) }))
  .filter(g => g.items.length);

const flatGroups = (groups, account) => [
  ...groups.map(g => ({ ...g, items: g.items.flatMap(({ subs, ...it }) => [it, ...(subs || [])]) })),
  { group: 'Tài khoản', items: account }
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
  const account = [...SETTINGS_LINKS.flat(), ...(isAdmin ? [ADMIN_LINK] : [])].filter(it => !pending(it.href));
  const allGroups = flatGroups(navList, account);
  const bottomItems = BOTTOM.filter(it => !isPendingRoute(it.href));
  const searchPages = allGroups.flatMap(group => group.items).filter(item => item.href);
  const isActive = (href) => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  const [menuOpen, setMenuOpen] = useState(false);

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
        <Rail
          groups={navList}
          user={user}
          isActive={isActive}
          menuOpen={menuOpen}
          foot={user && <SettingsMenu user={user} avatar={avatar} tier={tier} plan={plan} isAdmin={isAdmin} open={menuOpen} onOpenChange={setMenuOpen} onLogout={handleLogout} />}
        />

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
