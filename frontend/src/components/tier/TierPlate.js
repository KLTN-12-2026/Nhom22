'use client';
import { TIERS } from '@/lib/tier.mjs';
import { MetalIcon } from './MetalIcon';

export function TierPlate({ tier, className = '' }) {
  const info = TIERS[tier];
  if (!info) return null;
  return <span className={`tier-badge ${className}`} data-plate={tier} title={`Gói ${info.label}`}>
    <MetalIcon name={info.icon} metal={info.badgeMetal} size={16} />
    <span className="tier-badge-text">{info.label}</span>
  </span>;
}
