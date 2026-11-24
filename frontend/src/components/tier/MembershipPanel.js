'use client';
import Link from 'next/link';
import { MetalIcon } from './MetalIcon';
import { MembershipCard } from './MembershipCard';
import { useTier } from './useTier';

export function MembershipPanel({ name, children }) {
  const { tier, plan } = useTier();
  const card = tier
    ? <MembershipCard tier={tier} plan={plan} name={name} since={plan?.batDauAt} />
    : <div className="sk tier-card-skeleton" aria-busy="true" />;

  return <TierShowcase label="Thẻ thành viên" card={card}>
    {children}
    {tier && tier !== 'admin' && <div className="tier-actions">
      {tier === 'free' && <Link className="tier-cta tier-cta-buy" href="/thanh-toan-goi"><MetalIcon name="spark" metal="gold-dark" size={18} />Mua gói</Link>}
      {tier === 'pro' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="tier-cta tier-cta-up" href="/thanh-toan-goi"><MetalIcon name="crown" metal="gold" size={18} />Lên Premium</Link></>}
      {tier === 'premium' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="btn btn-quiet btn-sm" href="/thanh-toan-lich-su">Lịch sử thanh toán</Link></>}
    </div>}
  </TierShowcase>;
}

export function TierShowcase({ label, card, children }) {
  return <section className="tier-showcase" aria-label={label}>
    <div className="tier-showcase-grid">
      <div className="tier-showcase-card">
        {card}
        <p className="tier-hint">Bấm vào thẻ để lật xem quyền lợi</p>
      </div>
      <div className="tier-showcase-side">{children}</div>
    </div>
  </section>;
}
