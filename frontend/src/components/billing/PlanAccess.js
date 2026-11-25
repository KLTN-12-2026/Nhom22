'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Icon, Modal } from '@/components/ui';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { FEATURES, cardUsageKey, formatLimit, planValue, quotaKey, upgradeFromError } from '@/lib/plan-access.mjs';
import { METALS, TIERS, tierFromCode } from '@/lib/tier.mjs';
import styles from './PlanAccess.module.css';

export function requestUpgrade(feature, reason = 'KHONG_CO_QUYEN') {
  window.dispatchEvent(new CustomEvent('vocab:upgrade-open', { detail: { feature, reason } }));
}

function tone(code) {
  const tier = tierFromCode(code) || 'free';
  const metal = METALS[TIERS[tier].badgeMetal];
  return { '--plan-ink': metal[2], '--plan-soft': metal[3] };
}

export function PlanTag({ code, locked = true, label }) {
  if (!code) return null;
  return <span className={styles.tag} style={tone(code)} title={label || `Có ở gói ${code}`}>
    {locked && <Icon name="lock" />}{label || code}
  </span>;
}

function unitText(feature, value) {
  const f = FEATURES[feature];
  if (f.limit) return value == null || value === Infinity ? 'Không giới hạn' : `${formatLimit(value)} thẻ`;
  if (f.quota) return value > 0 ? `${formatLimit(value)} ${f.unit}/ngày` : 'Không có';
  return value > 0 ? 'Có' : 'Không có';
}

const HIGHLIGHTS = ['GIOI_HAN_THE', 'AI', 'ANH', 'PHAT_AM'];

export function UpgradeDialog() {
  const client = useQueryClient();
  const { plan, plans } = usePlanAccess();
  const [state, setState] = useState(null);

  useEffect(() => {
    const fromServer = event => {
      client.invalidateQueries({ queryKey: quotaKey });
      client.invalidateQueries({ queryKey: cardUsageKey });
      setState({ server: event.detail });
    };
    const fromClient = event => setState({ client: event.detail });
    window.addEventListener('vocab:upgrade', fromServer);
    window.addEventListener('vocab:upgrade-open', fromClient);
    return () => {
      window.removeEventListener('vocab:upgrade', fromServer);
      window.removeEventListener('vocab:upgrade-open', fromClient);
    };
  }, [client]);

  if (!state || !plan || !plans || plan.quanTri) return null;
  const current = plans.find(p => p.ma === plan.goiMa);
  let info;
  if (state.server) {
    info = upgradeFromError(state.server.status, state.server.data, plans, plan.goiMa);
  } else {
    const { feature, reason } = state.client;
    const base = planValue(current, feature);
    const target = [...plans].filter(p => p.giaThang > 0).sort((a, b) => a.giaThang - b.giaThang)
      .find(p => planValue(p, feature) > base) || null;
    info = { feature, reason, target, message: '' };
  }
  if (!info || !FEATURES[info.feature]) return null;
  const f = FEATURES[info.feature];
  const close = () => setState(null);
  const title = info.reason === 'HET_LUOT'
    ? `Bạn đã dùng hết ${f.unit || 'lượt'} hôm nay`
    : info.target ? `${f.label} là quyền lợi của gói ${info.target.ten}` : `${f.label} đã ở mức cao nhất`;
  const message = info.message || (info.target
    ? (planValue(current, info.feature) > 0
      ? `Gói ${current?.ten || plan.goiMa} của bạn có ${unitText(info.feature, planValue(current, info.feature))}. Gói ${info.target.ten} có ${unitText(info.feature, planValue(info.target, info.feature))}.`
      : `Gói ${current?.ten || plan.goiMa} của bạn chưa có ${f.label.toLowerCase()}. Nâng cấp để dùng ngay.`)
    : 'Bạn đang dùng gói cao nhất. Lượt dùng được đặt lại lúc 00:00 mỗi ngày.');

  return <Modal isOpen onClose={close} title={title} footer={<>
    <button type="button" className="btn btn-quiet" onClick={close}>Để sau</button>
    {info.target && <Link className={`btn btn-primary ${styles.ctaPlan}`} style={tone(info.target.ma)} href={`/thanh-toan-goi?goi=${info.target.ma}`} onClick={close}>
      <Icon name="star" />Nâng cấp lên {info.target.ten}
    </Link>}
  </>}>
    <div className={styles.dialog}>
      <div className={styles.ticket} style={info.target ? tone(info.target.ma) : tone(plan.goiMa)}>
        <span className={styles.ticketTag}><Icon name={info.reason === 'HET_LUOT' ? 'clock' : 'lock'} />{info.target ? `Gói ${info.target.ten}` : `Gói ${current?.ten || plan.goiMa}`}</span>
        <p>{message}</p>
      </div>
      {info.target && <div className={styles.compare}>
        <div className={styles.side}>
          <span className={styles.sideHead}>Gói hiện tại · {current?.ten || plan.goiMa}</span>
          <strong>{unitText(info.feature, planValue(current, info.feature))}</strong>
        </div>
        <Icon name="chevron-right" />
        <div className={`${styles.side} ${styles.target}`} style={tone(info.target.ma)}>
          <span className={styles.sideHead}>Gói {info.target.ten}</span>
          <strong>{unitText(info.feature, planValue(info.target, info.feature))}</strong>
        </div>
      </div>}
      {info.target && <ul className={styles.perks}>
        {HIGHLIGHTS.filter(key => key !== info.feature).map(key => {
          const has = planValue(info.target, key) > 0;
          return <li key={key} data-off={!has || undefined}><Icon name={has ? 'check' : 'lock'} />{FEATURES[key].label}: {unitText(key, planValue(info.target, key))}</li>;
        })}
        <li><Icon name="tag" />Từ {info.target.giaThang.toLocaleString('vi-VN')} đ/tháng, gói năm rẻ hơn</li>
      </ul>}
    </div>
  </Modal>;
}

export function QuotaMeter({ feature, className = '' }) {
  const { of } = usePlanAccess();
  const a = of(feature);
  if (!a) return null;
  const f = FEATURES[feature];
  if (a.locked) {
    return <button type="button" className={`${styles.meter} ${styles.meterLocked} ${className}`} onClick={() => requestUpgrade(feature)}>
      <Icon name="lock" /><span>{f.label} chưa có trong gói của bạn</span><PlanTag code={a.required?.ma} />
    </button>;
  }
  if (a.remaining == null) return null;
  const level = a.remaining === 0 ? 'full' : a.remaining <= Math.max(1, Math.round(a.limit * 0.2)) ? 'near' : 'ok';
  const percent = a.limit ? Math.min(100, Math.round(((a.limit - a.remaining) / a.limit) * 100)) : 0;
  return <div className={`${styles.meter} ${className}`} data-level={level} role="status">
    <Icon name={f.icon} />
    <span>Còn <strong>{a.remaining}/{a.limit}</strong> {f.unit} hôm nay</span>
    <span className={styles.bar} aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
    {a.upgrade && <button type="button" className={styles.more} onClick={() => requestUpgrade(feature, a.exhausted ? 'HET_LUOT' : 'KHONG_CO_QUYEN')}>
      {a.upgrade.ten}: {planValue(a.upgrade, feature)}/ngày
    </button>}
  </div>;
}

export function NavQuota({ feature }) {
  const { of } = usePlanAccess();
  const a = of(feature);
  if (!a) return null;
  if (a.locked) return <PlanTag code={a.required?.ma} />;
  if (a.remaining == null) return null;
  return <span className={styles.navCount} data-empty={a.remaining === 0 || undefined} title={`Còn ${a.remaining}/${a.limit} lượt hôm nay`}>
    {a.remaining === 0 ? <Icon name="lock" /> : a.remaining}
  </span>;
}

export function GuardedAction({ feature, children, onClick, className = 'btn btn-primary', type = 'button', ...props }) {
  const { of } = usePlanAccess();
  const a = of(feature);
  if (a && (a.locked || a.exhausted)) {
    return <button type="button" className={`${className} ${styles.lockedAction}`} onClick={() => requestUpgrade(feature, a.locked ? 'KHONG_CO_QUYEN' : 'HET_LUOT')}
      title={a.locked ? `Cần gói ${a.required?.ten || ''}` : 'Đã hết lượt hôm nay'} {...props}>
      <Icon name="lock" />{children}{a.locked && <PlanTag code={a.required?.ma} locked={false} />}
    </button>;
  }
  return <button type={type} className={className} onClick={onClick} {...props}>{children}</button>;
}

export function CardUsageMeter({ usage, plans, planCode }) {
  if (!usage) return null;
  const limit = usage.gioiHanThe;
  if (limit == null) return <p className={styles.cards}><Icon name="decks" />{usage.soThe.toLocaleString('vi-VN')} thẻ · không giới hạn</p>;
  const percent = Math.min(100, Math.round((usage.soThe / limit) * 100));
  const level = percent >= 100 ? 'full' : percent >= 80 ? 'near' : 'ok';
  const next = (plans || []).filter(p => p.giaThang > 0 && planValue(p, 'GIOI_HAN_THE') > limit).sort((a, b) => a.giaThang - b.giaThang)[0];
  return <div className={styles.cards} data-level={level}>
    <Icon name="decks" />
    <span>Đã dùng <strong>{usage.soThe.toLocaleString('vi-VN')}/{limit.toLocaleString('vi-VN')}</strong> thẻ của gói {planCode}</span>
    <span className={styles.bar} aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
    {next && level !== 'ok' && <button type="button" className={styles.more} onClick={() => requestUpgrade('GIOI_HAN_THE')}>
      {next.ten}: {formatLimit(next.gioiHanThe)} thẻ
    </button>}
  </div>;
}
