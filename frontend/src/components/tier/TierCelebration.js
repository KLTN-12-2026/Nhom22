'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fx } from '@/lib/fx';
import { TIERS } from '@/lib/tier.mjs';
import { MetalIcon } from './MetalIcon';
import { MembershipCard } from './MembershipCard';

const COPY = {
  pro: ['Chào mừng thành viên Pro', 'Chấm phát âm AI và 5.000 thẻ đã mở khóa cho bạn.'],
  premium: ['Chào mừng thành viên Premium', 'Toàn bộ VocabLearning đã mở khóa cho bạn.']
};

export function TierCelebration({ tier, plan, name, since, onClose }) {
  const button = useRef(null);
  const info = TIERS[tier] || TIERS.premium;
  const [title, sub] = COPY[tier] || COPY.premium;

  useEffect(() => {
    fx.play('streak');
    const focus = setTimeout(() => button.current?.focus(), 400);
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(focus); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return createPortal(<div className="tier-cel" data-cel-tier={tier} role="dialog" aria-modal="true" aria-labelledby="tier-cel-title">
    <div className="tier-cel-rays" aria-hidden="true" />
    <div className="tier-cel-inner">
      <span className="tier-cel-icon"><MetalIcon name={info.icon} metal={info.metal} size={120} delay={0.4} /></span>
      <h2 id="tier-cel-title">{title}</h2>
      <p>{sub}</p>
      <MembershipCard tier={tier} plan={plan} name={name} since={since} className="tier-cel-card" />
      <button ref={button} type="button" className="tier-cel-button" onClick={onClose}>Bắt đầu thôi</button>
    </div>
  </div>, document.body);
}
