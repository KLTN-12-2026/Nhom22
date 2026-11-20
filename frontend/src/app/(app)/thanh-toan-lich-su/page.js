'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { date, time } from '@/lib/billing-api';
import { ErrorState, Pagination, Icon } from '@/components/ui';
import { CancelSubscriptionButton } from '@/components/billing/CancelSubscriptionButton';
import styles from './page.module.css';

const STATUS = {
  THANH_CONG: ['Thành công', 'txStatusOk', '✓'],
  THAT_BAI: ['Thất bại', 'txStatusFail', '×'],
  HET_HAN: ['Hết hạn', 'txStatusWait', ''],
  CHO_THANH_TOAN: ['Đang chờ', 'txStatusWait', ''],
};

const formatPrice = value => `${value.toLocaleString('vi-VN')} đ`;

export default function ThanhToanLichSuPage() {
  const [page, setPage] = useState(1);
  const sub = useQuery({ queryKey: ['billing', 'subscription'], queryFn: () => apiFetch('/api/v1/me/subscription'), refetchInterval: 30000 });
  const history = useQuery({ queryKey: ['billing', 'history', page], queryFn: () => apiFetch(`/api/v1/billing/transactions?page=${page - 1}&size=20`), refetchInterval: 30000 });
  if (sub.isPending || history.isPending) return <div className="page sheet" role="status">Đang tải lịch sử thanh toán…</div>;
  if (sub.isError || history.isError) return <div className="page sheet"><ErrorState description={(sub.error || history.error).message} onRetry={() => { sub.refetch(); history.refetch(); }} /></div>;
  const SUBSCRIPTION = sub.data;
  const TRANSACTIONS = history.data.items.map(t => ({ ...t, thoiGian: `${date(t.taoAt)} ${time(t.taoAt)}`, moTa: `${t.tenGoi} · ${t.chuKy === 'NAM' ? '12 tháng' : '1 tháng'}` }));
  return (
    <div className="page">
      <article className={`sheet ${styles.pageSheet}`} aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tài khoản</span></div>
          <h1 id="page-title">Lịch sử thanh toán</h1>
          <p>Xem gói đang dùng, các giao dịch qua VNPay và biên nhận.</p>
        </div>

        <section className={styles.subOverview} aria-label="Gói đang hiệu lực">
          <div className={styles.subOverviewInfo}>
            <p className={styles.subPlanName}>
              {SUBSCRIPTION.tenGoi ? `Gói ${SUBSCRIPTION.tenGoi}` : 'Chưa có gói'}
              <span className={styles.planBadgeSm}>{SUBSCRIPTION.trangThai === 'HIEU_LUC' ? 'Đang hiệu lực' : SUBSCRIPTION.trangThai === 'DA_HUY' ? 'Đã hủy' : 'Chưa có gói hiệu lực'}</span>
            </p>
            <p className={styles.subExpires}>
              {SUBSCRIPTION.trangThai === 'DA_HUY' ? <>Đã hủy ngày <strong>{date(SUBSCRIPTION.huyAt)}</strong>. Dữ liệu học và lịch sử thanh toán được giữ nguyên.</> : <>Hiệu lực từ {date(SUBSCRIPTION.batDauAt)} đến <strong>{date(SUBSCRIPTION.hetHanAt)}</strong> · còn {SUBSCRIPTION.soNgayConLai ?? 0} ngày</>}
            </p>
            <p className={styles.subRenew}>Gói không tự gia hạn. Gia hạn cùng gói trước ngày hết hạn sẽ cộng dồn thêm thời gian.</p>
          </div>
          <Link href="/thanh-toan-goi" className="btn btn-quiet btn-sm">{SUBSCRIPTION.trangThai === 'HIEU_LUC' ? 'Gia hạn gói' : 'Mua gói mới'}</Link>
          <CancelSubscriptionButton subscription={SUBSCRIPTION} />
        </section>

        <h2 className={styles.sectionHeading}>Lịch sử giao dịch</h2>
        {TRANSACTIONS.length === 0 ? (
          <div className={styles.stateBlock}>
            <h3>Chưa có giao dịch nào</h3>
            <p>Giao dịch qua VNPay và biên nhận sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className={styles.txList} role="table" aria-label="Danh sách giao dịch">
            <div className={styles.txHeader} role="row">
              <span role="columnheader">Thời gian</span>
              <span role="columnheader">Đơn hàng</span>
              <span role="columnheader" className={styles.alignEnd}>Số tiền</span>
              <span role="columnheader">Trạng thái</span>
              <span role="columnheader" className={styles.alignEnd}>Biên nhận</span>
            </div>
            {TRANSACTIONS.map(tx => {
              const [label, tone, mark] = STATUS[tx.trangThai];
              return (
                <div key={tx.maDon} className={styles.txItem} role="row">
                  <span className={styles.txDate} role="cell">{tx.thoiGian}</span>
                  <span className={styles.txDesc} role="cell">{tx.moTa}<small>{tx.maDon}</small></span>
                  <span className={styles.txAmount} role="cell">{formatPrice(tx.soTien)}</span>
                  <span role="cell">
                    <span className={`${styles.txStatus} ${styles[tone]}`}>
                      {mark && <span aria-hidden="true">{mark}</span>}
                      {label}
                    </span>
                  </span>
                  <span className={styles.txAction} role="cell">
                    {tx.trangThai === 'THANH_CONG' ? (
                      <a className={styles.invoiceBtn} href={`/api/v1/billing/transactions/${encodeURIComponent(tx.maDon)}/receipt`} target="_blank" rel="noopener noreferrer" aria-label={`Xem biên nhận đơn ${tx.maDon}`}><Icon name="download" />Biên nhận</a>
                    ) : (
                      <span className={styles.noAction} aria-label="Không có biên nhận">–</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={history.data.totalPages} onPageChange={setPage} /><p className={styles.txNote}>&quot;Hết hạn&quot; là đơn không được thanh toán trong 15 phút. Biên nhận là chứng từ xác nhận đã thanh toán, không phải hóa đơn giá trị gia tăng.</p>
      </article>
    </div>
  );
}
