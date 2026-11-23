'use client';
import Link from 'next/link';
import { useCardUsage } from '@/hooks/usePlanAccess';
import { MembershipCard } from './MembershipCard';
import { useTier } from './useTier';

export function MembershipPanel({ name, children }) {
  const { tier, plan } = useTier();
  const usage = useCardUsage(!!tier && tier !== 'admin');
  const card = tier
    ? <MembershipCard tier={tier} plan={plan} name={name} since={plan?.batDauAt} usage={usage.data} />
    : <div className="sk member-slip-skeleton" aria-busy="true" />;

  return <TierShowcase label="Phiếu hội viên" card={card}>
    {children}
    {tier && tier !== 'admin' && <div className="tier-actions">
      {tier === 'free' && <Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Lên Pro</Link>}
      {tier === 'pro' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Lên Premium</Link></>}
      {tier === 'premium' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="btn btn-quiet btn-sm" href="/thanh-toan-lich-su">Lịch sử thanh toán</Link></>}
    </div>}
  </TierShowcase>;
}

export function TierShowcase({ label, card, children }) {
  return <section className="tier-showcase" aria-label={label}>
    <div className="tier-showcase-grid">
      <div className="tier-showcase-card">{card}</div>
      <div className="tier-showcase-side">{children}</div>
    </div>
  </section>;
}
