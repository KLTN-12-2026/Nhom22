'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon } from '@/components/ui';
import { CancelSubscriptionButton } from '@/components/billing/CancelSubscriptionButton';
import { usePlans } from '@/hooks/usePlanAccess';
import { usePlan } from '@/components/tier/useTier';
import { FEATURES, formatLimit, planValue } from '@/lib/plan-access.mjs';
import { planKey } from '@/lib/tier.mjs';
import styles from './page.module.css';

const CYCLES = [
  ['THANG', 'Hàng tháng', 'tháng'],
  ['NAM', 'Hàng năm', 'năm'],
];

const ROWS = ['GIOI_HAN_THE', 'AI', 'ANH', 'TTS', 'PHAT_AM', 'BO_MAU_CAO_CAP'];
const SOURCE = { DUNG_THU: 'dùng thử', HSSV: 'ưu đãi học sinh, sinh viên', MUA: '' };

const formatPrice = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

function rowText(key, p) {
  const value = planValue(p, key);
  const f = FEATURES[key];
  if (f.limit) return `${formatLimit(p.gioiHanThe)} thẻ`;
  if (f.quota) return value > 0 ? `${formatLimit(value)}/ngày` : 'Không có';
  return value > 0 ? 'Có' : 'Không có';
}

export default function ThanhToanGoiPage() {
  const client = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [pick, setPick] = useState(null);
  const [cycle, setCycle] = useState('THANG');
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const plansQuery = usePlans();
  const currentQuery = usePlan();
  const subQuery = useQuery({ queryKey: ['billing', 'subscription'], queryFn: () => apiFetch('/api/v1/me/subscription') });
  const studentQuery = useQuery({ queryKey: ['billing', 'student-offer'], queryFn: () => apiFetch('/api/v1/me/student-offer') });
  const quoteQuery = useQuery({
    queryKey: ['billing', 'quote', selected, cycle, appliedCode],
    enabled: !!selected,
    retry: false,
    queryFn: () => apiFetch('/api/v1/billing/quotes', { method: 'POST', body: JSON.stringify({ goiMa: selected, chuKy: cycle, maKhuyenMai: appliedCode || null }) }),
  });

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('goi');
    if (wanted && wanted !== 'FREE') setSelected(wanted);
  }, []);

  const plans = [...(plansQuery.data || [])].sort((a, b) => a.giaThang - b.giaThang);
  const current = currentQuery.data;
  const currentPlan = plans.find(p => p.ma === current?.goiMa);
  const subscription = subQuery.data;
  const plan = plans.find(p => p.ma === selected);
  const quote = quoteQuery.data;
  const unit = cycle === 'NAM' ? 'năm' : 'tháng';

  const refresh = () => {
    client.invalidateQueries({ queryKey: planKey });
    client.invalidateQueries({ queryKey: ['billing'] });
    client.invalidateQueries({ queryKey: ['service-quota'] });
    client.invalidateQueries({ queryKey: ['card-usage'] });
  };

  const selectPlan = key => { setSelected(key); setCycle('THANG'); setError(''); };

  const startTrial = async () => {
    setOfferMessage('');
    try { await apiFetch('/api/v1/me/subscription/trial', { method: 'POST' }); refresh(); setOfferMessage('Đã bật dùng thử Premium 7 ngày.'); }
    catch (e) { setOfferMessage(e.message); }
  };

  const studentAction = async path => {
    setOfferMessage('');
    try { await apiFetch(path, { method: 'POST', body: path.endsWith('verifications') ? JSON.stringify({}) : undefined }); refresh(); }
    catch (e) { setOfferMessage(e.message); }
  };

  const confirmPayment = async () => {
    if (!plan || pending || !quote) return;
    setPending(true); setError('');
    try {
      const result = await apiFetch('/api/v1/billing/checkouts', { method: 'POST', body: JSON.stringify({ goiMa: selected, chuKy: cycle, maKhuyenMai: appliedCode || null }) });
      if (!result.paymentUrl) throw new Error('Máy chủ chưa trả về địa chỉ thanh toán.');
      const url = new URL(result.paymentUrl, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Địa chỉ thanh toán không hợp lệ.');
      window.location.assign(url.href);
    } catch (e) { setError(e.message); setPending(false); }
  };

  if (plansQuery.isPending || subQuery.isPending || currentQuery.isPending) return <div className="page sheet" role="status">Đang tải gói dịch vụ…</div>;
  if (plansQuery.isError || subQuery.isError) return <div className="page sheet"><ErrorState description={(plansQuery.error || subQuery.error).message} onRetry={() => { plansQuery.refetch(); subQuery.refetch(); }} /></div>;

  const rank = p => plans.indexOf(p);
  const currentRank = current?.quanTri ? plans.length : Math.max(0, rank(currentPlan));
  const student = studentQuery.data;
  const pickCode = pick || selected || (currentPlan && currentPlan.giaThang > 0 ? currentPlan.ma : plans.find(p => p.giaThang > 0)?.ma);
  const pickPlan = plans.find(p => p.ma === pickCode);
  const pickPaid = pickPlan && pickPlan.giaThang > 0;
  const pickIsCurrent = !current?.quanTri && pickCode === current?.goiMa;
  const pickLabel = current?.quanTri ? 'Đã có quyền lợi Premium'
    : !pickPaid ? 'Gói Free không cần thanh toán'
    : pickIsCurrent ? `Gia hạn ${pickPlan.ten}`
    : rank(pickPlan) > currentRank ? `Nâng cấp lên ${pickPlan.ten}` : `Chọn ${pickPlan.ten}`;
  const pickNote = !pickPlan ? '' : current?.quanTri ? 'Tài khoản quản trị không cần mua gói.'
    : !pickPaid ? 'Khi gói trả phí hết hạn, tài khoản tự về Free; dữ liệu giữ nguyên.'
    : pickIsCurrent ? 'Gia hạn khi còn hạn sẽ cộng dồn thêm thời gian.'
    : rank(pickPlan) > currentRank && currentRank > 0 ? 'Phần còn lại của gói hiện tại được trừ vào giá khi nâng cấp.'
    : `Từ ${formatPrice(pickPlan.giaThang)}/tháng. Chọn chu kỳ và mã khuyến mãi ở bước sau.`;
  const choose = code => { setPick(code); if (selected) setSelected(code === 'FREE' ? null : code); };

  const neverSubscribed = subscription?.trangThai === 'CHUA_CO_GOI' && !current?.quanTri;

  return (
    <div className="page">
      <article className={`sheet ${styles.pageSheet}`} aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tài khoản</span></div>
          <h1 id="page-title">Gói dịch vụ</h1>
          <p>Gói Free dùng mãi. Nâng cấp để có nhiều thẻ, nhiều lượt AI và chấm phát âm hơn.</p>
        </div>

        <div className={styles.currentBanner}>
          <div className={styles.planInfo}>
            <strong>
              {current?.quanTri ? 'Tài khoản quản trị có toàn bộ quyền lợi Premium'
                : `Đang dùng gói ${current?.tenGoi || 'Free'}${current?.nguon && SOURCE[current.nguon] ? ` (${SOURCE[current.nguon]})` : ''}`}
            </strong>
            <span>{current?.hetHanAt ? `Hết hạn ${new Date(current.hetHanAt).toLocaleString('vi-VN')} · còn ${current.soNgayConLai} ngày. Hết hạn sẽ về gói Free, dữ liệu giữ nguyên.` : 'Gói không tự gia hạn. Gia hạn cùng gói còn hiệu lực sẽ cộng dồn thời gian.'}</span>
          </div>
          <Link href="/thanh-toan-lich-su" className="btn btn-quiet btn-sm">Lịch sử thanh toán</Link>
          <CancelSubscriptionButton subscription={subscription} />
        </div>

        {(neverSubscribed || (student?.hoatDong && !current?.quanTri)) && <div className={styles.offers}>
          {neverSubscribed && <div className={styles.offer}>
            <Icon name="star" />
            <div><strong>Dùng thử Premium 7 ngày miễn phí</strong><span>Mở toàn bộ quyền lợi Premium, không cần thanh toán. Mỗi tài khoản một lần.</span></div>
            <button type="button" className="btn btn-primary btn-sm" onClick={startTrial}>Dùng thử ngay</button>
          </div>}
          {student?.hoatDong && !current?.quanTri && <div className={styles.offer}>
            <Icon name="user" />
            <div>
              <strong>Ưu đãi học sinh, sinh viên: {student.phanTramGiam >= 100 ? `${student.tenGoi} miễn phí ${student.soNgay} ngày` : `giảm ${student.phanTramGiam}% gói ${student.tenGoi}`}</strong>
              <span>{student.xacMinh?.trangThai === 'DA_DUYET' ? (student.xacMinh.daNhanUuDaiAt ? 'Bạn đã nhận ưu đãi.' : 'Đã xác minh là học sinh, sinh viên.')
                : student.xacMinh?.trangThai === 'CHO_DUYET' ? 'Ảnh thẻ đang chờ quản trị viên duyệt.'
                : student.xacMinh?.trangThai === 'TU_CHOI' ? `Yêu cầu bị từ chối: ${student.xacMinh.lyDoTuChoi || ''}`
                : `Xác minh tự động nếu email tài khoản thuộc tên miền ${student.tenMien.join(', ') || 'trường học'}.`}</span>
            </div>
            {student.coTheNhan
              ? <button type="button" className="btn btn-primary btn-sm" onClick={() => studentAction('/api/v1/me/student-offer/claim')}>Nhận ưu đãi</button>
              : !student.xacMinh || student.xacMinh.trangThai === 'TU_CHOI'
                ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => studentAction('/api/v1/me/student-verifications')}>Xác minh bằng email</button>
                : null}
          </div>}
          {offerMessage && <p className="notice" role="status">{offerMessage}</p>}
        </div>}

        <h2 className={styles.sectionHeading} id="compare-title">So sánh gói</h2>
        {error && <p className="notice" role="alert">{error}</p>}
        <div className={styles.tableScroll}>
          <table className={styles.planTable} aria-labelledby="compare-title">
            <thead><tr>
              <th scope="col"><span className="sr-only">Quyền lợi</span></th>
              {plans.map(p => {
                const isCurrent = !current?.quanTri && p.ma === current?.goiMa;
                return <th key={p.ma} scope="col" className={`${styles.planCol} ${pickCode === p.ma ? styles.picked : ''}`}>
                  <label className={styles.pick}>
                    <input type="radio" name="plan-pick" value={p.ma} checked={pickCode === p.ma} onChange={() => choose(p.ma)} />
                    <span className={styles.pickBubble} aria-hidden="true" />
                    <strong>{p.ten}</strong>
                    {isCurrent && <span className={styles.stamp}>Đang dùng</span>}
                  </label>
                </th>;
              })}
            </tr></thead>
            <tbody>
              <tr><th scope="row">Giá</th>{plans.map(p => <td key={p.ma} className={pickCode === p.ma ? styles.picked : ''}>
                {p.giaThang > 0 ? <><span className={styles.price}>{formatPrice(p.giaThang)}</span><small className={styles.unit}>/tháng</small>
                  <span className={styles.yearly}>hoặc {formatPrice(p.giaNam)}/năm, bớt {formatPrice(p.giaThang * 12 - p.giaNam)}</span></>
                  : <><span className={styles.price}>0 đ</span><small className={styles.unit}>dùng mãi</small></>}
              </td>)}</tr>
              {ROWS.map(key => <tr key={key}><th scope="row">{FEATURES[key].label}</th>{plans.map(p => {
                const has = planValue(p, key) > 0;
                return <td key={p.ma} className={`${pickCode === p.ma ? styles.picked : ''} ${has ? '' : styles.none}`}>{rowText(key, p)}</td>;
              })}</tr>)}
            </tbody>
          </table>
        </div>
        <div className={styles.pickFoot}>
          <p>{pickNote}</p>
          <button type="button" className="btn btn-primary" disabled={!pickPaid || current?.quanTri} onClick={() => { selectPlan(pickCode); requestAnimationFrame(() => document.getElementById('payment-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>{pickLabel}</button>
        </div>
        <p className={styles.planNote}>Ôn tập, luyện tập, xuất CSV và yêu cầu xóa dữ liệu luôn dùng được ở mọi gói. Lượt dùng AI, giọng đọc và chấm phát âm đặt lại lúc 00:00 mỗi ngày.</p>

        {plan && plan.giaThang > 0 && (
          <section className={styles.paymentSection} aria-labelledby="payment-title">
            <div className={styles.divider} />
            <div className={styles.paymentGrid}>
              <div>
                <h2 className={styles.paymentTitle}>
                  <button type="button" className={styles.backButton} onClick={() => setSelected(null)} aria-label="Quay lại chọn gói">‹</button>
                  <span id="payment-title">Thanh toán gói {plan.ten}</span>
                </h2>

                <h3 className={styles.sectionHeading}>Chu kỳ thanh toán</h3>
                <div className={styles.cycleToggle} role="radiogroup" aria-label="Chọn chu kỳ thanh toán">
                  {CYCLES.map(([value, label]) => (
                    <label key={value} className={`${styles.cycleOption} ${cycle === value ? styles.selected : ''}`}>
                      <input type="radio" name="cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} />
                      <span>{label}</span>
                      <strong>{formatPrice(value === 'NAM' ? plan.giaNam : plan.giaThang)}</strong>
                      {value === 'NAM' && plan.giaThang * 12 > plan.giaNam && <small>Bớt {formatPrice(plan.giaThang * 12 - plan.giaNam)}</small>}
                    </label>
                  ))}
                </div>

                <h3 className={styles.sectionHeading}>Mã khuyến mãi</h3>
                <form className={styles.promo} onSubmit={event => { event.preventDefault(); setAppliedCode(code.trim().toUpperCase()); }}>
                  <input className="input" value={code} onChange={event => setCode(event.target.value)} placeholder="Nhập mã nếu có" maxLength={30} aria-label="Mã khuyến mãi" />
                  <button type="submit" className="btn btn-secondary">Áp dụng</button>
                  {appliedCode && <button type="button" className="btn btn-quiet" onClick={() => { setAppliedCode(''); setCode(''); }}>Bỏ mã</button>}
                </form>
                {quoteQuery.isError && <p className="notice notice-danger" role="alert">{quoteQuery.error.message}</p>}

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
                  <SummaryRow label="Gói" value={plan.ten} />
                  <SummaryRow label="Chu kỳ" value={cycle === 'NAM' ? 'Hàng năm' : 'Hàng tháng'} />
                  <SummaryRow label="Giá gốc" value={`${formatPrice(quote?.giaGoc ?? (cycle === 'NAM' ? plan.giaNam : plan.giaThang))}/${unit}`} />
                  {quote?.giamGia > 0 && <SummaryRow label={quote.uuDaiHssv ? 'Ưu đãi HSSV' : quote.maKhuyenMai ? `Mã ${quote.maKhuyenMai}` : quote.tenKhuyenMai || 'Khuyến mãi'} value={`−${formatPrice(quote.giamGia)}`} />}
                  {quote?.khauTru > 0 && <SummaryRow label="Trừ phần còn lại gói cũ" value={`−${formatPrice(quote.khauTru)}`} />}
                  <div className={styles.divider} />
                  <div className={styles.total}><strong>Tổng thanh toán</strong><strong>{quote ? formatPrice(quote.soTien) : '…'}</strong></div>
                </div>
                <p className={styles.summaryNote}>{quote?.nangCap ? 'Nâng cấp có hiệu lực ngay sau khi thanh toán, gói cũ kết thúc và phần còn lại đã được trừ vào giá.' : 'Gói không tự gia hạn. Gia hạn cùng gói khi còn hạn sẽ cộng dồn thêm thời gian; không hoàn tiền.'}</p>
                <button type="button" className="btn btn-primary" onClick={confirmPayment} disabled={pending || !quote}>
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

function SummaryRow({ label, value }) {
  return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>;
}
