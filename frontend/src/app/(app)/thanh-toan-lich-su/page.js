'use client';

import Link from 'next/link';
import { useToast, Icon } from '@/components/ui';
import styles from './page.module.css';

const SUBSCRIPTION = {
  tenGoi: 'Premium',
  batDauAt: '01/11/2026 14:05',
  hetHanAt: '01/12/2026 14:05',
  soNgayConLai: 16,
};

const TRANSACTIONS = [
  { maDon: 'DH-20261101-0007', thoiGian: '01/11/2026 14:05', moTa: 'Gói Premium · 1 tháng', soTien: 999000, trangThai: 'THANH_CONG' },
  { maDon: 'DH-20261101-0006', thoiGian: '01/11/2026 14:02', moTa: 'Gói Premium · 1 tháng', soTien: 999000, trangThai: 'THAT_BAI' },
  { maDon: 'DH-20261001-0003', thoiGian: '01/10/2026 09:30', moTa: 'Gói Pro · 1 tháng', soTien: 299000, trangThai: 'THANH_CONG' },
  { maDon: 'DH-20260930-0002', thoiGian: '30/09/2026 21:12', moTa: 'Gói Pro · 1 tháng', soTien: 299000, trangThai: 'HET_HAN' },
];

const STATUS = {
  THANH_CONG: ['Thành công', 'txStatusOk', '✓'],
  THAT_BAI: ['Thất bại', 'txStatusFail', '×'],
  HET_HAN: ['Hết hạn', 'txStatusWait', ''],
  CHO_THANH_TOAN: ['Đang chờ', 'txStatusWait', ''],
};

const formatPrice = value => `${value.toLocaleString('vi-VN')} đ`;

export default function ThanhToanLichSuPage() {
  const { toast } = useToast();

  const openReceipt = maDon => {
    toast(`Bản thật mở biên nhận đơn ${maDon} trong thẻ mới để in.`, { variant: 'default', duration: 3500 });
  };

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
              Gói {SUBSCRIPTION.tenGoi}
              <span className={styles.planBadgeSm}>Đang hiệu lực</span>
            </p>
            <p className={styles.subExpires}>
              Hiệu lực từ {SUBSCRIPTION.batDauAt} đến <strong>{SUBSCRIPTION.hetHanAt}</strong> · còn {SUBSCRIPTION.soNgayConLai} ngày
            </p>
            <p className={styles.subRenew}>Gói không tự gia hạn. Gia hạn cùng gói trước ngày hết hạn sẽ cộng dồn thêm thời gian.</p>
          </div>
          <Link href="/thanh-toan-goi" className="btn btn-quiet btn-sm">Gia hạn gói</Link>
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
                      <button type="button" className={styles.invoiceBtn} onClick={() => openReceipt(tx.maDon)} aria-label={`Xem biên nhận đơn ${tx.maDon}`}>
                        <Icon name="download" />
                        Biên nhận
                      </button>
                    ) : (
                      <span className={styles.noAction} aria-label="Không có biên nhận">–</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className={styles.txNote}>&quot;Hết hạn&quot; là đơn không được thanh toán trong 15 phút. Biên nhận là chứng từ xác nhận đã thanh toán, không phải hóa đơn giá trị gia tăng.</p>
      </article>
    </div>
  );
}
