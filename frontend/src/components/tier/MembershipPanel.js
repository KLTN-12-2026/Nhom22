'use client';
import Link from 'next/link';
import { MetalIcon } from './MetalIcon';
import { MembershipCard } from './MembershipCard';
import { useTier } from './useTier';

export function MembershipPanel({ name }) {
  const { tier, plan } = useTier();
  if (!tier) return <section className="sheet" aria-busy="true"><div className="sk" style={{ height: 260 }} /></section>;

  return <section className="sheet tier-panel" aria-label="Thẻ thành viên">
    <MembershipCard tier={tier} plan={plan} name={name} since={plan?.batDauAt} />
    <p className="tier-hint">Bấm vào thẻ để lật xem quyền lợi</p>
    {tier !== 'admin' && <div className="tier-actions">
      {tier === 'free' && <Link className="tier-cta tier-cta-buy" href="/thanh-toan-goi"><MetalIcon name="spark" metal="gold-dark" size={18} />Mua gói</Link>}
      {tier === 'pro' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="tier-cta tier-cta-up" href="/thanh-toan-goi"><MetalIcon name="crown" metal="gold" size={18} />Lên Premium</Link></>}
      {tier === 'premium' && <><Link className="btn btn-secondary btn-sm" href="/thanh-toan-goi">Gia hạn</Link><Link className="btn btn-quiet btn-sm" href="/thanh-toan-lich-su">Lịch sử thanh toán</Link></>}
    </div>}
  </section>;
}
