'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fx } from '@/lib/fx';
import { TIERS, metalSound, upgradeKey } from '@/lib/tier.mjs';
import { MetalIcon } from './MetalIcon';
import { TierCelebration } from './TierCelebration';

export function TierHeader({ tier, plan, user }) {
  const [celebrate, setCelebrate] = useState(null);
  const info = TIERS[tier];

  useEffect(() => {
    if (!tier || !user?.id) return undefined;
    const key = upgradeKey(user.id);
    let before = null;
    try {
      before = localStorage.getItem(key);
      localStorage.setItem(key, tier);
    } catch { return undefined; }
    if (!before || tier === 'admin' || !TIERS[before] || TIERS[tier].rank <= TIERS[before].rank) return undefined;
    const timer = setTimeout(() => setCelebrate(tier), 500);
    return () => clearTimeout(timer);
  }, [tier, user?.id]);

  const close = useCallback(() => setCelebrate(null), []);

  if (!info) return null;
  const title = tier === 'admin' ? 'Tài khoản quản trị: đủ quyền lợi Premium'
    : plan?.soNgayConLai != null ? `Gói ${info.label}, còn ${plan.soNgayConLai} ngày` : `Gói ${info.label}`;

  return <>
    {tier === 'free' && <Link href="/thanh-toan-goi" className="tier-cta tier-cta-buy" aria-label="Mua gói">
      <MetalIcon name="spark" metal="gold-dark" size={18} /><span className="tier-cta-text">Mua gói</span>
    </Link>}
    {tier === 'pro' && <Link href="/thanh-toan-goi" className="tier-cta tier-cta-up" aria-label="Nâng cấp lên Premium">
      <MetalIcon name="crown" metal="gold" size={18} /><span className="tier-cta-text">Lên Premium</span>
    </Link>}
    <button type="button" className="tier-badge" title={title} aria-label={title} onClick={ringBadge(tier)} onAnimationEnd={event => { if (event.animationName === 'tier-ring') event.currentTarget.classList.remove('is-ringing'); }}>
      <MetalIcon name={info.icon} metal={info.badgeMetal} size={16} />
      <span className="tier-badge-text">{info.label}</span>
    </button>
    {celebrate && <TierCelebration tier={celebrate} plan={plan} name={user?.tenHienThi} since={plan?.batDauAt} onClose={close} />}
  </>;
}

function ringBadge(tier) {
  return event => {
    const el = event.currentTarget;
    fx.play(metalSound(tier));
    el.classList.remove('is-ringing');
    void el.offsetWidth;
    el.classList.add('is-ringing');
  };
}

export function TierAvatarOrnament({ tier }) {
  if (tier === 'premium' || tier === 'admin') return <span className="tier-crown" aria-hidden="true"><MetalIcon name="crown" metal="gold" size={20} /></span>;
  if (tier === 'pro') return <span className="tier-corner" aria-hidden="true"><MetalIcon name="bolt" metal="steel" size={13} /></span>;
  return null;
}
