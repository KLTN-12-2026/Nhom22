'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';
import { fx } from '@/lib/fx';
import { TIERS } from '@/lib/tier.mjs';
import { usePlanAccess } from '@/hooks/usePlanAccess';

export const SETTINGS_LINKS = [
  [
    { key: 'profile', label: 'Hồ sơ', icon: 'user', href: '/ca-nhan' },
    { key: 'learning', label: 'Thiết lập học', icon: 'target', href: '/ca-nhan/hoc-tap' },
    { key: 'skins', label: 'Giao diện', icon: 'sparkles', href: '/ca-nhan/giao-dien' },
    { key: 'notify', label: 'Thông báo', icon: 'bell', href: '/ca-nhan/thong-bao' },
    { key: 'security', label: 'Bảo mật', icon: 'shield', href: '/ca-nhan/bao-mat' },
    { key: 'privacy', label: 'Quyền riêng tư', icon: 'eye', href: '/ca-nhan/rieng-tu' }
  ],
  [
    { key: 'plans', label: 'Gói dịch vụ', icon: 'card', href: '/thanh-toan-goi' },
    { key: 'payment-history', label: 'Lịch sử thanh toán', icon: 'clock', href: '/thanh-toan-lich-su' },
    { key: 'support-tickets', label: 'Phiếu hỗ trợ', icon: 'mail', href: '/phieu-ho-tro' }
  ]
];

export const ADMIN_LINK = { key: 'admin-dashboard', label: 'Trang quản trị', icon: 'home', href: '/quan-tri' };

const THEMES = [['light', 'Sáng'], ['dark', 'Tối'], ['system', 'Tự động']];

const themeSubscribe = listener => {
  window.addEventListener('vocab-theme-change', listener);
  return () => window.removeEventListener('vocab-theme-change', listener);
};
const themeSnapshot = () => { try { return localStorage.getItem('vocab:theme') || 'system'; } catch { return 'system'; } };
const soundSubscribe = listener => {
  window.addEventListener('vl-sound', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('vl-sound', listener);
    window.removeEventListener('storage', listener);
  };
};
const soundSnapshot = () => { try { return localStorage.getItem('vl-sound') !== 'off'; } catch { return true; } };

function initial(user) {
  return (user?.tenHienThi || 'U').split(/\s+/).pop()[0].toUpperCase();
}

function Avatar({ user, avatar }) {
  return <span className="rail-avatar">{avatar?.downloadUrl ? <img src={avatar.downloadUrl} alt="" /> : initial(user)}</span>;
}

export function SettingsMenu({ user, avatar, tier, isAdmin, open, onOpenChange, onLogout }) {
  const pathname = usePathname();
  const button = useRef(null);
  const panel = useRef(null);
  const theme = useSyncExternalStore(themeSubscribe, themeSnapshot, () => 'system');
  const sound = useSyncExternalStore(soundSubscribe, soundSnapshot, () => true);
  const { of } = usePlanAccess(!!user);
  const ai = of('AI');
  const tierLabel = TIERS[tier]?.label;

  useEffect(() => { onOpenChange(false); }, [pathname, onOpenChange]);

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.querySelector('a, button')?.focus({ preventScroll: true });
    const onDown = event => {
      if (!panel.current?.contains(event.target) && !button.current?.contains(event.target)) onOpenChange(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') { onOpenChange(false); button.current?.focus(); }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const isActive = href => href === '/ca-nhan' ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  const groups = isAdmin ? [SETTINGS_LINKS[0], [...SETTINGS_LINKS[1], ADMIN_LINK]] : SETTINGS_LINKS;
  const hint = key => key === 'plans' ? tierLabel : null;

  return <>
    <button ref={button} type="button" className="rail-settings" aria-haspopup="menu" aria-expanded={open} aria-controls="settings-menu" onClick={() => onOpenChange(!open)}>
      <span className="rail-settings-avatar">
        <Avatar user={user} avatar={avatar} />
        <span className="rail-gear"><Icon name="settings" /></span>
      </span>
      <span className="rail-who"><strong>{user?.tenHienThi || 'User'}</strong><small>Cài đặt{tierLabel ? ` · ${tierLabel}` : ''}</small></span>
      <Icon name="chevron-right" className="rail-chev" />
    </button>

    <div ref={panel} id="settings-menu" className="settings-menu" role="menu" aria-label="Cài đặt" hidden={!open}>
      <div className="settings-head">
        <Avatar user={user} avatar={avatar} />
        <div><strong>{user?.tenHienThi || 'User'}</strong><small>{user?.email || (tierLabel && `Gói ${tierLabel}`)}</small></div>
      </div>

      {tier === 'free' && <div className="settings-plan">
        <span>{ai && ai.remaining != null ? <>Còn <b>{ai.remaining}/{ai.limit}</b> lượt AI hôm nay</> : <>Bạn đang dùng gói <b>Free</b></>}</span>
        <Link href="/thanh-toan-goi" role="menuitem">Nâng cấp</Link>
      </div>}

      <div className="settings-quick">
        <div className="settings-row"><Icon name="sun" />Giao diện
          <div className="settings-seg" role="radiogroup" aria-label="Giao diện">
            {THEMES.map(([value, text]) => <button key={value} type="button" role="radio" aria-checked={theme === value} onClick={() => window.VocabTheme?.set(value)} suppressHydrationWarning>{text}</button>)}
          </div>
        </div>
        <div className="settings-row"><Icon name={sound ? 'volume' : 'volume-off'} />Âm thanh
          <button type="button" className="settings-switch" role="switch" aria-checked={sound} aria-label="Âm thanh" onClick={() => fx.setSound(!sound)} suppressHydrationWarning />
        </div>
      </div>

      {groups.map((items, index) => <div className="settings-list" key={index}>
        {items.map(item => <Link key={item.key} href={item.href} role="menuitem" className="settings-link" aria-current={isActive(item.href) ? 'page' : undefined}>
          <Icon name={item.icon} />{item.label}{hint(item.key) && <span className="settings-hint">{hint(item.key)}</span>}
        </Link>)}
      </div>)}

      <div className="settings-list">
        <button type="button" role="menuitem" className="settings-link settings-out" onClick={() => { onOpenChange(false); onLogout(); }}>
          <Icon name="logout" />Đăng xuất
        </button>
      </div>
    </div>
  </>;
}
