'use client';
import { useRef, useState } from 'react';
import { fx } from '@/lib/fx';
import { TIERS, cardDate, metalSound, monthYear, rosette } from '@/lib/tier.mjs';
import { MetalIcon } from './MetalIcon';

const ROSE_A = rosette(70, 26, 44, 1600);
const ROSE_B = rosette(70, 18, 30, 1200);
const ROSE_C = rosette(46, 13, 22, 900);
const WAVES = Array.from({ length: 9 }, (_, row) => {
  const y = 150 + row * 11;
  let d = `M-10 ${y}`;
  for (let x = 0; x <= 420; x += 10) d += `L${x} ${(y + Math.sin((x + row * 14) / 26) * 6).toFixed(1)}`;
  return d;
});

const PERKS = [
  { key: 'cards', icon: 'star', need: 1, title: 'Nhiều thẻ hơn', text: ['Pro: 5.000 thẻ', '5.000 thẻ', 'Không giới hạn'] },
  { key: 'speech', icon: 'mic', need: 1, title: 'Chấm phát âm AI', text: ['Cần gói Pro', 'Đã mở', 'Đã mở'] }
];

function Pattern({ tier }) {
  return <svg className="tier-card-pattern" viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g className="tier-card-waves">{WAVES.map((d, i) => <path key={i} d={d} />)}</g>
    <g transform="translate(318 74)">
      <g className="tier-card-rose">
        <path d={ROSE_A} />
        <path d={ROSE_B} className="tier-card-rose-2" />
      </g>
    </g>
    <g transform="translate(40 226)"><g className="tier-card-rose tier-card-rose-small"><path d={ROSE_C} /></g></g>
    {tier !== 'free' && <rect className="tier-card-frame" x="7" y="7" width="386" height="238" rx="12" />}
  </svg>;
}

export function MembershipCard({ tier, plan, name, since, className = '', interactive = true }) {
  const ref = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const info = TIERS[tier] || TIERS.free;
  const expiry = tier === 'admin' ? 'VĨNH VIỄN' : plan?.hetHanAt ? `HẾT HẠN ${cardDate(plan.hetHanAt)}` : tier === 'free' ? 'KHÔNG GIỚI HẠN' : '';
  const joined = monthYear(since);
  const status = tier === 'admin' ? 'Quản trị viên · đủ quyền lợi Premium'
    : plan?.soNgayConLai != null ? `Gói ${info.label} · còn ${plan.soNgayConLai} ngày` : `Gói ${info.label}`;

  const move = event => {
    const card = ref.current;
    if (!card || event.pointerType === 'touch') return;
    const r = card.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width;
    const y = (event.clientY - r.top) / r.height;
    card.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(1)}deg`);
    card.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(1)}deg`);
    card.style.setProperty('--gx', `${Math.round(x * 100)}%`);
    card.style.setProperty('--gy', `${Math.round(y * 100)}%`);
  };
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  const flip = () => {
    fx.play('metalFlip');
    setTimeout(() => fx.play(metalSound(tier)), 160);
    setFlipped(value => !value);
  };

  const label = `Thẻ thành viên ${info.label} của ${name || 'bạn'}`;
  const Tag = interactive ? 'button' : 'div';
  const tagProps = interactive
    ? { type: 'button', onClick: flip, 'aria-pressed': flipped, 'aria-label': `${label}. Bấm để ${flipped ? 'xem mặt trước' : 'xem quyền lợi'}` }
    : { role: 'img', 'aria-label': label };

  return <div className={`tier-card-stage ${className}`}>
    <Tag ref={ref} className="tier-card" data-card-tier={tier} data-flipped={flipped ? 'true' : 'false'} onPointerMove={move} onPointerLeave={leave} {...tagProps}>
      <span className="tier-card-inner">
        <span className="tier-card-face tier-card-front">
          <Pattern tier={tier} />
          <span className="tier-card-row">
            <span className="tier-card-plan">{info.member}</span>
            <MetalIcon name={info.icon} metal={info.metal} size={34} />
          </span>
          <span className="tier-card-chip" aria-hidden="true" />
          <span className="tier-card-bottom">
            <span className="tier-card-name">{name || 'Thành viên'}</span>
            <span className="tier-card-meta"><span>{joined ? `THÀNH VIÊN TỪ ${joined}` : 'VOCABLEARNING'}</span><span>{expiry}</span></span>
          </span>
        </span>
        <span className="tier-card-face tier-card-back" aria-hidden={!flipped}>
          <Pattern tier={tier} />
          <span className="tier-card-stripe" aria-hidden="true" />
          <span className="tier-card-back-head"><span>Quyền lợi</span><MetalIcon name={info.icon} metal={info.metal} size={20} /></span>
          <span className="tier-card-perks">
            {PERKS.map(perk => {
              const open = info.rank >= perk.need;
              return <span key={perk.key} className={`tier-card-perk${open ? '' : ' is-locked'}`}>
                <MetalIcon name={open ? perk.icon : 'lock'} metal={open ? info.metal : perk.need === 2 ? 'gold' : 'steel'} size={18} />
                <span className="tier-card-perk-title">{perk.title}</span>
                <span className="tier-card-perk-state">{perk.text[info.rank]}</span>
              </span>;
            })}
          </span>
          <span className="tier-card-status">{status}</span>
        </span>
      </span>
    </Tag>
  </div>;
}
