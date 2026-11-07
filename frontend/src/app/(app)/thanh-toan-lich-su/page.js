'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, Icon } from '@/components/ui';
import styles from './page.module.css';

const INITIAL_TRANSACTIONS = [
  {
    id: 'INV-20261101-001',
    date: '01/11/2026',
    desc: 'Gia hạn Gói Premium – 1 tháng',
    amount: '999.000 đ',
    status: 'ok',
    statusLabel: 'Thành công',
    hasInvoice: true,
  },
  {
    id: 'INV-20251101-004',
    date: '01/11/2025',
    desc: 'Nâng cấp lên Gói Premium',
    amount: '999.000 đ',
    status: 'ok',
    statusLabel: 'Thành công',
    hasInvoice: true,
  },
  {
    id: 'INV-20250501-003',
    date: '01/05/2025',
    desc: 'Gia hạn Gói Pro – 1 tháng',
    amount: '299.000 đ',
    status: 'ok',
    statusLabel: 'Thành công',
    hasInvoice: true,
  },
  {
    id: 'INV-20250401-002',
    date: '01/04/2025',
    desc: 'Gia hạn Gói Pro – 1 tháng',
    amount: '299.000 đ',
    status: 'ok',
    statusLabel: 'Thành công',
    hasInvoice: true,
  },
  {
    id: 'INV-20250301-001',
    date: '01/03/2025',
    desc: 'Nâng cấp lên Gói Pro',
    amount: '299.000 đ',
    status: 'ok',
    statusLabel: 'Thành công',
    hasInvoice: true,
  },
  {
    id: 'INV-20250215-000',
    date: '15/02/2025',
    desc: 'Thử nghiệm thanh toán',
    amount: '0 đ',
    status: 'fail',
    statusLabel: 'Thất bại',
    hasInvoice: false,
  },
];

const INITIAL_CARDS = [
  {
    id: 'card-1',
    label: 'VISA •••• 4242',
    sub: 'Hết hạn 09/28 · Thẻ mặc định',
  },
];

export default function ThanhToanLichSuPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [savedCards, setSavedCards] = useState(INITIAL_CARDS);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadInvoice = (tx) => {
    setDownloadingId(tx.id);
    toast('⏳ Đang tạo hóa đơn PDF...', { variant: 'default', duration: 2000 });

    setTimeout(() => {
      // Trigger actual download of generated invoice receipt
      const content = `================================================
HÓA ĐƠN THANH TOÁN ĐIỆN TỬ - VOCABLEARNING
================================================
Mã hóa đơn:       ${tx.id}
Ngày lập hóa đơn: ${tx.date}
Giao dịch:        ${tx.desc}
Số tiền:          ${tx.amount}
Trạng thái:       ${tx.statusLabel}
Hình thức:        Thẻ thanh toán quốc tế
Mã xác thực:      AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}

Đơn vị cung cấp: VocabLearning Platform
Chăm sóc khách hàng: support@vocablearning.vn
------------------------------------------------
Cảm ơn bạn đã đăng ký và đồng hành cùng VocabLearning!
================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tx.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadingId(null);
      toast(`✅ Đã tải về ${tx.id}.pdf`, { variant: 'success', duration: 4000 });
    }, 1200);
  };

  const handleRemoveCard = (cardId) => {
    if (!window.confirm('Xóa thẻ VISA **** 4242 khỏi tài khoản?')) return;
    setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
    toast('✅ Đã xóa thẻ VISA **** 4242.', { variant: 'success' });
  };

  const handleAddPaymentMethod = () => {
    toast('🔗 Chuyển đến trang thêm phương thức thanh toán...', { variant: 'default', duration: 2500 });
    setTimeout(() => {
      router.push('/thanh-toan-goi');
    }, 800);
  };

  return (
    <div className="page">
      <article className={`sheet ${styles.pageSheet}`} aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tài khoản</span></div>
          <h1 id="page-title">Lịch sử thanh toán</h1>
          <p>Xem lịch sử giao dịch và tải hóa đơn.</p>
        </div>

        {/* Transaction history */}
        <p className={styles.sectionHeading}>Lịch sử giao dịch</p>
        {transactions.length === 0 ? (
          <div className={styles.stateBlock}>
            <div className={styles.stateIcon} aria-hidden="true">🧾</div>
            <h3>Chưa có giao dịch nào</h3>
            <p>Lịch sử thanh toán và hóa đơn của bạn sẽ hiển thị tại đây khi có giao dịch mới.</p>
          </div>
        ) : (
          <div className={styles.txList} role="table" aria-label="Danh sách giao dịch">
            <div className={styles.txHeader} role="row" aria-hidden="true">
              <span>Ngày</span>
              <span>Mô tả</span>
              <span style={{ textAlign: 'right' }}>Số tiền</span>
              <span>Trạng thái</span>
              <span style={{ textAlign: 'right' }}>Hóa đơn</span>
            </div>

            {transactions.map((tx) => (
              <div key={tx.id} className={styles.txItem} role="row">
                <span className={styles.txDate} role="cell">
                  {tx.date}
                </span>
                <span className={styles.txDesc} role="cell" title={tx.desc}>
                  {tx.desc}
                </span>
                <span
                  className={`${styles.txAmount} ${tx.amount === '0 đ' ? styles.txAmountZero : ''}`}
                  role="cell"
                >
                  {tx.amount}
                </span>
                <span role="cell">
                  <span
                    className={`${styles.txStatus} ${
                      tx.status === 'ok' ? styles.txStatusOk : styles.txStatusFail
                    }`}
                  >
                    {tx.status === 'ok' ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="#1e8a5a"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path
                          d="M2.5 2.5l5 5M7.5 2.5l-5 5"
                          stroke="#c0392b"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {tx.statusLabel}
                  </span>
                </span>
                <span className={styles.txAction} role="cell">
                  {tx.hasInvoice ? (
                    <button
                      type="button"
                      className={styles.invoiceBtn}
                      onClick={() => handleDownloadInvoice(tx)}
                      disabled={downloadingId === tx.id}
                      aria-label={`Tải hóa đơn giao dịch ${tx.date}`}
                    >
                      {downloadingId === tx.id ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <circle
                              cx="6.5"
                              cy="6.5"
                              r="5"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeDasharray="8 8"
                            >
                              <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 6.5 6.5"
                                to="360 6.5 6.5"
                                dur=".8s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </svg>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <path
                              d="M6.5 1v8M3.5 6.5l3 3 3-3M2 11h9"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Hóa đơn
                        </>
                      )}
                    </button>
                  ) : (
                    <span className={styles.noAction} aria-label="Không có hóa đơn">
                      –
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Saved payment methods */}
        <p className={styles.sectionHeading}>Phương thức thanh toán đã lưu</p>
        <div className={styles.savedMethods}>
          {savedCards.map((card) => (
            <div key={card.id} className={styles.savedMethodCard} aria-label={card.label}>
              <div className={styles.savedMethodLogo} aria-hidden="true">
                <svg viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="28">
                  <text
                    x="2"
                    y="13"
                    fontFamily="Arial, sans-serif"
                    fontSize="14"
                    fontWeight="900"
                    fill="#fff"
                    fontStyle="italic"
                  >
                    VISA
                  </text>
                </svg>
              </div>
              <div className={styles.savedMethodInfo}>
                <p className={styles.cardLabel}>{card.label}</p>
                <p className={styles.cardSub}>{card.sub}</p>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemoveCard(card.id)}
                aria-label={`Xóa ${card.label}`}
              >
                <Icon name="trash" />
                Xóa
              </button>
            </div>
          ))}

          <button
            type="button"
            className={`btn btn-quiet ${styles.addMethodBtn}`}
            onClick={handleAddPaymentMethod}
          >
            <Icon name="plus" />
            Thêm phương thức thanh toán
          </button>
        </div>
      </article>
    </div>
  );
}
