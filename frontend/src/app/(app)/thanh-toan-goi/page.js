'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState } from '@/components/ui';
import { CancelSubscriptionButton } from '@/components/billing/CancelSubscriptionButton';
import styles from './page.module.css';

const CYCLES = [
  ['THANG', 'Hàng tháng', 'tháng'],
  ['NAM', 'Hàng năm', 'năm'],
];

const formatPrice = value => `${value.toLocaleString('vi-VN')} đ`;

export default function ThanhToanGoiPage() {
  const [selected, setSelected] = useState(null);
  const [cycle, setCycle] = useState('THANG');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const plansQuery = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => apiFetch('/api/v1/billing/plans') });
  const subQuery = useQuery({ queryKey: ['billing', 'subscription'], queryFn: () => apiFetch('/api/v1/me/subscription') });
  const PLANS = Object.fromEntries((plansQuery.data || []).map(p => [p.ma, { name: p.ten, THANG: p.giaThang, NAM: p.giaNam, features: [[true, 'Số thẻ: ', p.gioiHanThe == null ? 'Không giới hạn' : String(p.gioiHanThe), ''], [true, 'AI văn bản/ngày: ', String(p.hanMucAi ?? 0), ''], [true, 'Ảnh AI/ngày: ', String(p.hanMucAnh ?? 0), ''], [p.phatAm, 'Đánh giá phát âm', '', ''], [p.boMauCaoCap, 'Bộ mẫu cao cấp', '', '']] }]));
  const subscription = subQuery.data;


  const plan = selected ? PLANS[selected] : null;
  const total = plan ? plan[cycle] : 0;
  const unit = cycle === 'NAM' ? 'năm' : 'tháng';

  const selectPlan = key => {
    setSelected(key);
    setCycle('THANG');
  };

  const confirmPayment = async () => {
    if (!plan || pending) return;
    setPending(true); setError('');
    try {
      const result = await apiFetch('/api/v1/billing/checkouts', { method: 'POST', body: JSON.stringify({ goiMa: selected, chuKy: cycle }) });
      if (!result.paymentUrl) throw new Error('Máy chủ chưa trả về địa chỉ thanh toán.');
      const url = new URL(result.paymentUrl, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Địa chỉ thanh toán không hợp lệ.');
      window.location.assign(url.href);
    } catch (error) { setError(error.message); setPending(false); }
  };
  if (plansQuery.isPending || subQuery.isPending) return <div className="page sheet" role="status">Đang tải gói dịch vụ…</div>;
  if (plansQuery.isError || subQuery.isError) return <div className="page sheet"><ErrorState description={(plansQuery.error || subQuery.error).message} onRetry={() => { plansQuery.refetch(); subQuery.refetch(); }} /></div>;
  return (
    <div className="page">
      <article className={`sheet ${styles.pageSheet}`} aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tài khoản</span></div>
          <h1 id="page-title">Gói dịch vụ</h1>
          <p>Chọn gói phù hợp để mở khóa toàn bộ tính năng học tập.</p>
        </div>

        <div className={styles.currentBanner}>
          <div className={styles.planInfo}>
            <strong>{subscription?.trangThai === 'HIEU_LUC' ? `Đang dùng gói ${subscription.tenGoi}` : subscription?.trangThai === 'DA_HUY' ? `Bạn đã hủy gói ${subscription.tenGoi}` : 'Bạn chưa có gói đang hiệu lực'}</strong>
            <span>Gói không tự gia hạn. Gia hạn cùng gói còn hiệu lực sẽ cộng dồn thời gian.</span>
          </div>
          <Link href="/thanh-toan-lich-su" className="btn btn-quiet btn-sm">Lịch sử thanh toán</Link>
          <CancelSubscriptionButton subscription={subscription} />
        </div>

        <h2 className={styles.sectionHeading}>Chọn gói</h2>{error && <p className="notice" role="alert">{error}</p>}{!plansQuery.data?.length && <p>Hiện chưa có gói đang mở bán.</p>}
        <div className={styles.planGrid} role="list">
          {Object.entries(PLANS).map(([key, item]) => (
            <PlanCard key={key} plan={item} onSelect={() => selectPlan(key)} />
          ))}
        </div>
        <p className={styles.planNote}>Xuất dữ liệu CSV và yêu cầu xóa dữ liệu luôn dùng được, không phụ thuộc gói.</p>

        {plan && (
          <section className={styles.paymentSection} aria-labelledby="payment-title">
            <div className={styles.divider} />
            <div className={styles.paymentGrid}>
              <div>
                <h2 className={styles.paymentTitle}>
                  <button type="button" className={styles.backButton} onClick={() => setSelected(null)} aria-label="Quay lại chọn gói">‹</button>
                  <span id="payment-title">Thanh toán gói {plan.name}</span>
                </h2>

                <h3 className={styles.sectionHeading}>Chu kỳ thanh toán</h3>
                <div className={styles.cycleToggle} role="radiogroup" aria-label="Chọn chu kỳ thanh toán">
                  {CYCLES.map(([value, label]) => (
                    <label key={value} className={`${styles.cycleOption} ${cycle === value ? styles.selected : ''}`}>
                      <input type="radio" name="cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} />
                      <span>{label}</span>
                      <strong>{formatPrice(plan[value])}</strong>
                      {value === 'NAM' && <small>Tiết kiệm 2 tháng</small>}
                    </label>
                  ))}
                </div>

                <h3 className={styles.sectionHeading}>Phương thức thanh toán</h3>
                <div className={styles.vnpay}>
                  <strong>VNPay</strong>
                  <span>Thẻ ATM nội địa, VISA, Mastercard hoặc VNPAY-QR</span>
                </div>
                <p className={styles.planNote}>Bạn nhập thông tin thẻ hoặc quét mã trên trang của VNPay. VocabLearning không nhận và không lưu số thẻ.</p>
              </div>

              <aside className={styles.summary} aria-label="Tóm tắt đơn hàng">
                <div className={styles.summaryHead}>Tóm tắt đơn hàng</div>
                <div className={styles.summaryBody}>
                  <SummaryRow label="Gói" value={plan.name} />
                  <SummaryRow label="Chu kỳ" value={cycle === 'NAM' ? 'Hàng năm' : 'Hàng tháng'} />
                  <SummaryRow label="Đơn giá" value={`${formatPrice(total)}/${unit}`} />
                  <div className={styles.divider} />
                  <div className={styles.total}><strong>Tổng thanh toán</strong><strong>{formatPrice(total)}</strong></div>
                </div>
                <p className={styles.summaryNote}>Gói không tự gia hạn. Gia hạn cùng gói khi còn hạn sẽ cộng dồn thêm thời gian; không hoàn tiền.</p>
                <button type="button" className="btn btn-primary" onClick={confirmPayment} disabled={pending}>
                  {pending ? 'Đang chuyển sang VNPay...' : 'Thanh toán qua VNPay'}
                </button>
              </aside>
            </div>
          </section>
        )}
      </article>


    </div>
  );
}

function PlanCard({ plan, onSelect }) {
  return (
    <div className={`${styles.planCard} ${plan.recommended ? styles.recommended : ''}`} role="listitem">
      {plan.recommended && <div className={styles.recommendedBadge}>Phổ biến nhất</div>}
      <div className={styles.planTop}>
        <h3>{plan.name}</h3>
        <div className={styles.price}><strong>{formatPrice(plan.THANG)}</strong><span>/tháng</span></div>
      </div>
      <div className={styles.divider} />
      <ul className={styles.features}>
        {plan.features.map(([ok, before, strong, after]) => (
          <li key={`${before}${strong}${after}`}>
            <span className={`${styles.featureIcon} ${ok ? styles.ok : styles.no}`} aria-hidden="true">{ok ? '✓' : '–'}</span>
            <span>{before}{strong && <strong>{strong}</strong>}{after}</span>
          </li>
        ))}
      </ul>
      <div className={styles.planFooter}>
        <button type="button" className="btn btn-primary" onClick={onSelect}>Chọn gói {plan.name}</button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>;
}
