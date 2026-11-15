'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const PLANS = {
  PRO: {
    name: 'Pro',
    THANG: 299000,
    NAM: 2990000,
    recommended: true,
    features: [
      [true, 'Tối đa ', '5.000 thẻ', ''],
      [true, '', '20', ' yêu cầu AI văn bản/ngày'],
      [true, '', '10', ' ảnh AI/ngày'],
      [true, 'Đánh giá phát âm', '', ''],
      [false, 'Không có bộ mẫu cao cấp', '', ''],
    ],
  },
  PREMIUM: {
    name: 'Premium',
    THANG: 999000,
    NAM: 9990000,
    features: [
      [true, '', 'Không giới hạn', ' thẻ'],
      [true, '', '100', ' yêu cầu AI văn bản/ngày'],
      [true, '', '30', ' ảnh AI/ngày'],
      [true, 'Đánh giá phát âm', '', ''],
      [true, 'Bộ mẫu cao cấp', '', ''],
    ],
  },
};

const CYCLES = [
  ['THANG', 'Hàng tháng', 'tháng'],
  ['NAM', 'Hàng năm', 'năm'],
];

const formatPrice = value => `${value.toLocaleString('vi-VN')} đ`;

export default function ThanhToanGoiPage() {
  const [selected, setSelected] = useState(null);
  const [cycle, setCycle] = useState('THANG');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const plan = selected ? PLANS[selected] : null;
  const total = plan ? plan[cycle] : 0;
  const unit = cycle === 'NAM' ? 'năm' : 'tháng';

  const selectPlan = key => {
    setSelected(key);
    setCycle('THANG');
  };

  const confirmPayment = () => {
    if (!plan || pending) return;
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setSuccess(true);
    }, 900);
  };

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
            <strong>Bạn chưa có gói đang hiệu lực</strong>
            <span>Chọn Pro hoặc Premium để học tiếp. Bộ thẻ, tiến độ và sổ tay của bạn vẫn được giữ nguyên.</span>
          </div>
          <Link href="/thanh-toan-lich-su" className="btn btn-quiet btn-sm">Lịch sử thanh toán</Link>
        </div>

        <h2 className={styles.sectionHeading}>Chọn gói</h2>
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

      {success && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className={styles.successCard}>
            <div className={styles.successIcon} aria-hidden="true">✓</div>
            <h2 id="success-title">Thanh toán mô phỏng thành công</h2>
            <p>Gói <strong>{plan?.name}</strong> đã được kích hoạt. Bản thật sẽ chuyển sang trang VNPay rồi về trang kết quả.</p>
            <Link href="/hom-nay" className="btn btn-primary">Học hôm nay</Link>
          </div>
        </div>
      )}
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
