'use client';
import { useState } from 'react';
import Link from 'next/link';
import { TIERS, monthYear } from '@/lib/tier.mjs';
import { MetalIcon } from './MetalIcon';

const HIDE_KEY = 'vocab:tier:upsell-hidden';
const HIDE_MS = 7 * 24 * 60 * 60 * 1000;

function hiddenNow() {
  try { return Number(localStorage.getItem(HIDE_KEY) || 0) > Date.now(); } catch { return false; }
}

export function TierSideCard({ tier, plan }) {
  const [hidden, setHidden] = useState(() => typeof window !== 'undefined' && hiddenNow());
  const info = TIERS[tier];
  if (!info) return null;

  if (tier === 'free') {
    if (hidden) return null;
    const hide = () => {
      try { localStorage.setItem(HIDE_KEY, String(Date.now() + HIDE_MS)); } catch { }
      setHidden(true);
    };
    return <div className="tier-upsell">
      <button type="button" className="tier-upsell-x" aria-label="Ẩn gợi ý 7 ngày" onClick={hide}>×</button>
      <MetalIcon name="mic" metal="steel" size={30} />
      <strong>Mở khóa chấm phát âm AI</strong>
      <p>Nói từ vựng, nhận điểm từng âm và cách sửa ngay.</p>
      <Link href="/thanh-toan-goi" className="btn btn-primary btn-sm">Xem các gói</Link>
    </div>;
  }

  const since = monthYear(plan?.batDauAt);
  const detail = tier === 'admin' ? 'Đủ quyền lợi Premium'
    : [since && `Từ ${since}`, plan?.soNgayConLai != null && `còn ${plan.soNgayConLai} ngày`].filter(Boolean).join(' · ');
  return <Link href={tier === 'admin' ? '/ca-nhan' : '/thanh-toan-lich-su'} className="tier-member">
    <MetalIcon name={info.icon} metal={info.metal} size={28} />
    <span><b>{tier === 'admin' ? 'Quản trị viên' : `Thành viên ${info.label}`}</b>{detail}</span>
  </Link>;
}
