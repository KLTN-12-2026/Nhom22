'use client';
import { TIERS, cardDate, monthYear } from '@/lib/tier.mjs';

const number = value => Number(value || 0).toLocaleString('vi-VN');

function expiryLine(tier, plan) {
  if (tier === 'admin') return 'Không thời hạn';
  if (plan?.hetHanAt) return <>{cardDate(plan.hetHanAt)}{plan.soNgayConLai != null && <span className="member-slip-note"> · còn {plan.soNgayConLai} ngày</span>}</>;
  if (tier === 'free') return 'Dùng mãi';
  return '';
}

export function MembershipCard({ tier, plan, name, since, usage, className = '' }) {
  const info = TIERS[tier] || TIERS.free;
  const joined = monthYear(since);
  const expiry = expiryLine(tier, plan);
  const limit = usage?.gioiHanThe;
  const percent = limit ? Math.min(100, Math.round((usage.soThe / limit) * 100)) : null;

  return <section className={`member-slip ${className}`} data-card-tier={tier} aria-label={`Phiếu hội viên ${info.label} của ${name || 'bạn'}`}>
    <span className="member-slip-stub" aria-hidden="true"><span>VocabLearning</span></span>
    <div className="member-slip-body">
      <div className="member-slip-head">
        <span className="member-slip-title">Phiếu hội viên</span>
        <span className="member-slip-stamp">{info.label}</span>
      </div>
      <dl className="member-slip-lines">
        <div><dt>Họ tên</dt><dd className="member-slip-name">{name || 'Thành viên'}</dd></div>
        <div><dt>Gói</dt><dd>{tier === 'admin' ? 'Quản trị viên · đủ quyền lợi Premium' : info.label}</dd></div>
        {expiry && <div><dt>Hiệu lực đến</dt><dd>{expiry}</dd></div>}
        {joined && <div><dt>Thành viên từ</dt><dd>{joined}</dd></div>}
        {usage && <div><dt>Số thẻ</dt><dd>
          {limit ? `${number(usage.soThe)} / ${number(limit)}` : `${number(usage.soThe)} · không giới hạn`}
          {percent != null && <span className="member-slip-meter" role="img" aria-label={`Đã dùng ${percent}% số thẻ`}><i style={{ width: `${percent}%` }} /></span>}
        </dd></div>}
      </dl>
    </div>
  </section>;
}
