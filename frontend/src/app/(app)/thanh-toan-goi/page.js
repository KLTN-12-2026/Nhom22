'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const PLANS = {
  pro: {
    name: 'Pro',
    monthly: 299000,
    yearly: 2990000,
    features: [
      ['Tối đa ', '5.000 thẻ', true],
      ['', '20', ' yêu cầu AI/ngày'],
      ['', 'Đánh giá phát âm', true],
      ['', 'Không có bộ mẫu cao cấp', false],
      ['', 'Xuất dữ liệu', true],
      ['', 'Không hỗ trợ ưu tiên', false],
    ],
  },
  premium: {
    name: 'Premium',
    monthly: 999000,
    yearly: 9990000,
    features: [
      ['', 'Không giới hạn', ' thẻ'],
      ['', '100', ' yêu cầu AI/ngày'],
      ['', 'Đánh giá phát âm', true],
      ['', 'Bộ mẫu cao cấp', true],
      ['', 'Xuất dữ liệu', true],
      ['', 'Hỗ trợ ưu tiên', true],
    ],
  },
};

const formatPrice = value => `${value.toLocaleString('vi-VN')} đ`;

function MethodIcon({ method }) {
  if (method === 'card') {
    return <span aria-hidden="true" className={styles.methodGlyph}>▣</span>;
  }
  if (method === 'bank') {
    return <span aria-hidden="true" className={styles.methodGlyph}>▥</span>;
  }
  return <span aria-hidden="true" className={styles.methodGlyph}>▦</span>;
}

export default function ThanhToanGoiPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [method, setMethod] = useState('card');
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);

  const plan = selectedPlan ? PLANS[selectedPlan] : null;
  const total = plan ? plan[cycle] : 0;
  const cycleLabel = cycle === 'yearly' ? 'Hàng năm' : 'Hàng tháng';

  const selectPlan = key => {
    setSelectedPlan(key);
    setCycle('monthly');
    setMethod('card');
    setStatus('');
  };

  const confirmPayment = () => {
    if (!plan) return;
    setStatus('Đang xử lý...');
    window.setTimeout(() => {
      setStatus('');
      setSuccess(true);
    }, 700);
  };

  return (
    <div className="page">
      <article className={`sheet ${styles.pageSheet}`} aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tài khoản</span></div>
          <h1 id="page-title">Gói dịch vụ</h1>
          <p>Chọn gói phù hợp để mở khóa toàn bộ tính năng học tập nâng cao.</p>
        </div>

        {status && <div className="notice" role="status">{status}</div>}

        <div className={styles.currentBanner}>
          <span className={styles.planBadge}>★ &nbsp;Đang dùng: Gói Miễn Phí</span>
          <div className={styles.planInfo}>
            <strong>Tài khoản cơ bản</strong>
            <span>Nâng cấp để mở thêm tính năng học tập</span>
          </div>
          <Link href="/thanh-toan-lich-su" className="btn btn-quiet btn-sm">Lịch sử thanh toán</Link>
        </div>

        <p className={styles.sectionHeading}>Chọn gói</p>
        <div className={styles.planGrid} role="list">
          <PlanCard
            name="Miễn Phí"
            price="0 đ"
            current
            features={[
              ['Tối đa ', '500 thẻ', true],
              ['', 'Không có yêu cầu AI', false],
              ['', 'Không đánh giá phát âm', false],
              ['', 'Không có bộ mẫu cao cấp', false],
              ['', 'Không xuất dữ liệu', false],
              ['', 'Không hỗ trợ ưu tiên', false],
            ]}
          />
          <PlanCard
            name="Pro"
            price={formatPrice(PLANS.pro.monthly)}
            recommended
            features={PLANS.pro.features}
            onSelect={() => selectPlan('pro')}
          />
          <PlanCard
            name="Premium"
            price={formatPrice(PLANS.premium.monthly)}
            features={PLANS.premium.features}
            onSelect={() => selectPlan('premium')}
          />
        </div>

        {plan && (
          <section className={styles.paymentSection} aria-labelledby="payment-title">
            <div className={styles.divider} />
            <div className={styles.paymentGrid}>
              <div>
                <h2 className={styles.paymentTitle}>
                  <button type="button" className={styles.backButton} onClick={() => setSelectedPlan(null)} aria-label="Quay lại chọn gói">‹</button>
                  <span id="payment-title">Thanh toán – Gói {plan.name}</span>
                </h2>

                <p className={styles.sectionHeading}>Chu kỳ thanh toán</p>
                <div className={styles.cycleToggle} role="group" aria-label="Chọn chu kỳ thanh toán">
                  {[
                    ['monthly', 'Hàng tháng', plan.monthly],
                    ['yearly', 'Hàng năm', plan.yearly],
                  ].map(([value, label, price]) => (
                    <label key={value} className={`${styles.cycleOption} ${cycle === value ? styles.selected : ''}`}>
                      <input type="radio" name="cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} />
                      <span>{label}</span>
                      <strong>{formatPrice(price)}</strong>
                      {value === 'yearly' && <small>Tiết kiệm 2 tháng</small>}
                    </label>
                  ))}
                </div>

                <p className={styles.sectionHeading}>Phương thức thanh toán</p>
                <div className={styles.methods} role="radiogroup" aria-label="Chọn phương thức thanh toán">
                  {[
                    ['card', 'Thẻ ngân hàng / VISA / Mastercard', 'Thẻ ghi nợ hoặc thẻ tín dụng'],
                    ['bank', 'Chuyển khoản ngân hàng', 'Quét mã QR hoặc chuyển khoản thủ công'],
                    ['wallet', 'Ví điện tử', 'MoMo hoặc ZaloPay'],
                  ].map(([value, title, description]) => (
                    <label key={value} className={`${styles.method} ${method === value ? styles.selected : ''}`}>
                      <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                      <MethodIcon method={value} />
                      <span><strong>{title}</strong><small>{description}</small></span>
                      <i aria-hidden="true" />
                    </label>
                  ))}
                </div>

                {method === 'card' && (
                  <div className={styles.cardForm}>
                    <label className="field"><span className="field-label">Số thẻ</span><input className="input" placeholder="1234 5678 9012 3456" inputMode="numeric" /></label>
                    <label className="field"><span className="field-label">Tên chủ thẻ</span><input className="input" placeholder="NGUYEN VAN A" /></label>
                    <div className={styles.cardFields}>
                      <label className="field"><span className="field-label">Ngày hết hạn</span><input className="input" placeholder="MM/YY" /></label>
                      <label className="field"><span className="field-label">CVV</span><input className="input" placeholder="123" inputMode="numeric" /></label>
                    </div>
                  </div>
                )}
                {method === 'bank' && <div className={styles.bankPanel}><strong>Mã chuyển khoản</strong><code>THANHTOAN {plan.name.toUpperCase()} USER12345</code><span>Ngân hàng VocabLearning · STK 0123 456 789</span></div>}
                {method === 'wallet' && <div className={styles.walletPanel}><button type="button" className="btn btn-secondary">Tiếp tục với MoMo</button><button type="button" className="btn btn-secondary">Tiếp tục với ZaloPay</button></div>}
              </div>

              <aside className={styles.summary} aria-label="Tóm tắt đơn hàng">
                <div className={styles.summaryHead}>Tóm tắt đơn hàng</div>
                <div className={styles.summaryBody}>
                  <SummaryRow label="Gói" value={plan.name} />
                  <SummaryRow label="Chu kỳ" value={cycleLabel} />
                  <SummaryRow label="Đơn giá" value={`${formatPrice(total)}/${cycle === 'yearly' ? 'năm' : 'tháng'}`} />
                  <div className={styles.divider} />
                  <div className={styles.total}><strong>Tổng thanh toán</strong><strong>{formatPrice(total)}</strong></div>
                </div>
                <p className={styles.summaryNote}>Có thể hủy bất cứ lúc nào. Không tự gia hạn nếu không có thẻ lưu.</p>
                <button type="button" className="btn btn-primary" onClick={confirmPayment} disabled={Boolean(status)}>{status || '✓  Xác nhận thanh toán'}</button>
              </aside>
            </div>
          </section>
        )}
      </article>

      {success && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h2 id="success-title">Thanh toán thành công!</h2>
            <p>Gói <strong>{plan?.name}</strong> đã được kích hoạt cho tài khoản của bạn. Chúc bạn học tập hiệu quả!</p>
            <button type="button" className="btn btn-primary" onClick={() => { setSuccess(false); setSelectedPlan(null); }}>Tiếp tục học</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ name, price, features, current, recommended, onSelect }) {
  return (
    <div className={`${styles.planCard} ${current ? styles.current : ''} ${recommended ? styles.recommended : ''}`} role="listitem">
      {recommended && <div className={styles.recommendedBadge}>Phổ biến nhất</div>}
      <div className={styles.planTop}><h2>{name}</h2><div className={styles.price}><strong>{price}</strong><span>/tháng</span></div></div>
      <div className={styles.divider} />
      <ul className={styles.features}>{features.map(([prefix, text, suffixOrState], index) => {
        const isOk = typeof suffixOrState === 'boolean' ? suffixOrState : true;
        const suffix = typeof suffixOrState === 'string' ? suffixOrState : '';
        return <li key={`${text}-${index}`}><span className={`${styles.featureIcon} ${isOk ? styles.ok : styles.no}`}>{isOk ? '✓' : '–'}</span><span>{prefix}{typeof suffixOrState === 'boolean' ? <strong>{text}</strong> : <strong>{text}</strong>}{suffix}</span></li>;
      })}</ul>
      <div className={styles.planFooter}><button type="button" className={`btn ${current ? 'btn-quiet' : 'btn-primary'}`} disabled={current} onClick={onSelect}>{current ? 'Đang dùng' : `Nâng cấp – Gói ${name}`}</button></div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>;
}
