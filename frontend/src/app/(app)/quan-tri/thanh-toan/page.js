'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Icon, Modal, useToast } from '@/components/ui';
import {
  DEMO_CLOCK, STORAGE_KEY, PAYMENT_STATUSES, transactions, createDemo, readDemo,
  planName, money, date, time, normalize, isExpired, isSoon, subscriptionStatus,
  filterPayments, paymentsCsv, receiptHtml,
} from '@/lib/payment-admin.mjs';
import styles from './page.module.css';

const PAYMENT_FILTERS = { query: '', status: '', plan: '', from: '', to: '' };
const SUB_FILTERS = { query: '', status: '', plan: '' };
const TABS = [['payments', 'Giao dịch'], ['subscriptions', 'Gói người dùng'], ['plans', 'Cấu hình gói']];
const PAGE_SIZE = 6;
const subscribe = () => () => {};

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles[status[1]]}`}>{status[0]}</span>;
}

function DataTable({ headers, rows, caption }) {
  return <div className={styles.tableWrap}><table className={styles.table}>
    <caption className="sr-only">{caption}</caption>
    <thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>{row.cells.map((cell, i) => <td key={headers[i]} data-label={headers[i]}><div>{cell}</div></td>)}</tr>)}</tbody>
  </table></div>;
}

function Empty({ title, description, children }) {
  return <div className={styles.empty}><Icon name="file" className="icon-lg" /><h3>{title}</h3><p>{description}</p>{children}</div>;
}

function PlanSelect({ value, onChange }) {
  return <label className="field">Gói dịch vụ<select className="select" value={value} onChange={onChange}><option value="">Tất cả gói</option><option value="PRO">Pro</option><option value="PREMIUM">Premium</option></select></label>;
}

export default function PaymentAdminPage() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <PaymentAdmin /> : <div className="page sheet skeleton" role="status"><span className="sr-only">Đang tải dữ liệu thanh toán…</span><div className="sk sk-row" /></div>;
}

function PaymentAdmin() {
  const { toast } = useToast();
  const [data, setData] = useState(() => {
    try { return readDemo(window.sessionStorage); } catch { return createDemo(); }
  });
  const [tab, setTab] = useState('payments');
  const [filters, setFilters] = useState(PAYMENT_FILTERS);
  const [subFilters, setSubFilters] = useState(SUB_FILTERS);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [formError, setFormError] = useState('');
  const [conflict, setConflict] = useState(false);

  const items = filterPayments(filters);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const paid = transactions.filter(t => t.status === 'THANH_CONG');
  const query = normalize(subFilters.query.trim());
  const subscriptions = data.subscriptions.filter(s => (!query || normalize(`${s.name} ${s.email}`).includes(query)) &&
    (!subFilters.plan || s.plan === subFilters.plan) && (!subFilters.status || (subFilters.status === 'expired' ? isExpired(s) : subFilters.status === 'soon' ? isSoon(s) : !isExpired(s))));

  function persist(next, message) {
    setData(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      toast(message, { variant: 'success' });
    } catch {
      toast(`${message} Thay đổi chỉ được giữ đến khi tải lại trang.`);
    }
  }

  function openDialog(value) {
    setFormError('');
    setConflict(false);
    setDialog(value);
  }

  function updateFilter(key, value) {
    setFilters(previous => ({ ...previous, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(PAYMENT_FILTERS);
    setPage(1);
  }

  function savePlan(event) {
    event.preventDefault();
    if (conflict) return;
    const fields = new FormData(event.currentTarget);
    const existing = data.plans.find(p => p.code === dialog.plan.code);
    if (existing.version !== dialog.plan.version) {
      setConflict(true);
      setFormError('Cấu hình đã thay đổi ở phiên khác. Tải lại cấu hình trước khi chỉnh sửa.');
      return;
    }
    const updated = { ...existing, version: existing.version + 1 };
    for (const key of ['month', 'year', 'cards', 'ai', 'images']) {
      updated[key] = key === 'cards' && fields.get(key) === '' ? null : Number(fields.get(key));
      if (updated[key] !== null && (!Number.isSafeInteger(updated[key]) || updated[key] < (['month', 'year', 'cards'].includes(key) ? 1 : 0) || updated[key] > 1000000000)) {
        setFormError('Nhập số nguyên trong giới hạn cho phép. Giá và số thẻ phải lớn hơn 0.');
        return;
      }
    }
    for (const key of ['active', 'speech', 'premium']) updated[key] = fields.has(key);
    persist({ ...data, plans: data.plans.map(p => p.code === updated.code ? updated : p), audit: [...data.audit, { action: 'SUA_GOI_DICH_VU', target: updated.code, at: DEMO_CLOCK }] }, `Đã lưu cấu hình gói ${planName(updated.code)} trong dữ liệu mẫu.`);
    setDialog(null);
  }

  function tabKeyDown(event) {
    const index = TABS.findIndex(([id]) => id === tab);
    const next = event.key === 'ArrowRight' ? (index + 1) % TABS.length : event.key === 'ArrowLeft' ? (index + TABS.length - 1) % TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : null;
    if (next !== null) {
      event.preventDefault();
      setTab(TABS[next][0]);
      event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
    }
  }

  const summary = [
    ['Tổng đã thanh toán', money(paid.reduce((sum, t) => sum + t.amount, 0)), `${paid.length} giao dịch thành công`],
    ['Tổng giao dịch', transactions.length, 'Toàn bộ dữ liệu mẫu'],
    ['Gói còn hiệu lực', data.subscriptions.filter(s => !isExpired(s)).length, 'Tính tại mốc dữ liệu mẫu'],
    ['Sắp hết hạn', data.subscriptions.filter(isSoon).length, 'Trong 7 ngày tới'],
  ];

  return <div className={`page ${styles.page}`}>
    <div className={styles.demo}><span>Bản trải nghiệm · Dữ liệu mô phỏng</span><span>Quản trị thanh toán</span></div>
    <article className="sheet" aria-labelledby="page-title">
      <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/quan-tri/chu-de">Quản trị</Link><span aria-hidden="true">/</span><span aria-current="page">Quản lý thanh toán</span></nav>
      <div className={styles.heading}>
        <div className="form-head"><h1 id="page-title">Quản lý thanh toán</h1><p>Theo dõi giao dịch, quản lý thời hạn và quyền lợi gói dịch vụ.</p></div>
        <span className={styles.environment}><span aria-hidden="true" /> VNPay Sandbox</span>
      </div>
      <div className={styles.summary} aria-label="Tổng quan dữ liệu mẫu">
        {summary.map(([label, value, note], index) => <article key={label}><p>{label}</p><strong className={index === 0 ? styles.positive : undefined}>{value}</strong><small>{note}</small></article>)}
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Quản lý thanh toán" onKeyDown={tabKeyDown}>
        {TABS.map(([id, label]) => <button key={id} type="button" className={styles.tab} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      <section id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" tabIndex={0} hidden={tab !== 'payments'}>
        <div className={styles.sectionHead}><div><h2>Danh sách giao dịch</h2><p>Tra cứu các đơn mua và gia hạn gói qua VNPay.</p></div><button className="btn btn-export" type="button" disabled={!items.length} onClick={() => {
          download(paymentsCsv(items), 'giao-dich-mau-2026-11.csv', 'text/csv;charset=utf-8');
          toast(`Đã xuất ${items.length} giao dịch theo bộ lọc hiện tại.`);
        }}><Icon name="download" /> Xuất CSV</button></div>
        <form className={styles.filters} aria-label="Lọc giao dịch" onSubmit={event => event.preventDefault()} onReset={clearFilters}>
          <label className={`field ${styles.search}`}>Tìm giao dịch<input className="input" type="search" placeholder="Mã đơn, tên hoặc email…" autoComplete="off" value={filters.query} onChange={event => updateFilter('query', event.target.value)} /></label>
          <label className="field">Trạng thái<select className="select" value={filters.status} onChange={event => updateFilter('status', event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(PAYMENT_STATUSES).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <PlanSelect value={filters.plan} onChange={event => updateFilter('plan', event.target.value)} />
          <label className="field">Từ ngày<input className="input" type="date" value={filters.from} aria-describedby="payment-feedback" onChange={event => updateFilter('from', event.target.value)} /></label>
          <label className="field">Đến ngày<input className="input" type="date" value={filters.to} aria-describedby="payment-feedback" aria-invalid={!!(filters.from && filters.to && filters.from > filters.to)} onChange={event => updateFilter('to', event.target.value)} /></label>
          <button className="btn btn-quiet" type="reset">Xóa bộ lọc</button>
        </form>
        <p className={styles.feedback} id="payment-feedback" role="status" aria-live="polite">{filters.from && filters.to && filters.from > filters.to ? 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.' : ''}</p>
        {items.length ? <DataTable headers={['Mã đơn / Thời gian', 'Người dùng', 'Gói dịch vụ', 'Số tiền', 'Trạng thái', 'Thao tác']} caption="Các giao dịch thanh toán qua VNPay" rows={items.slice(offset, offset + PAGE_SIZE).map(t => ({ id: t.id, cells: [
          <><strong>{t.id}</strong><small>{date(t.created)} · {time(t.created)}</small></>,
          <><strong>{t.name}</strong><small>{t.email}</small></>,
          <><span className={styles.planLabel}>{planName(t.plan)}</span><small>{t.cycle === 'NAM' ? '12 tháng' : '1 tháng'}</small></>,
          <span className={styles.money}>{money(t.amount)}</span>, <StatusBadge status={PAYMENT_STATUSES[t.status]} />,
          <button type="button" className="btn btn-quiet" aria-label={`Xem chi tiết đơn ${t.id}`} onClick={() => openDialog({ type: 'detail', transaction: t })}>Chi tiết ↗</button>,
        ] }))} /> : <Empty title="Không có giao dịch" description="Thử thay đổi từ khóa hoặc xóa bộ lọc để xem thêm kết quả."><button className="btn btn-secondary" type="button" onClick={clearFilters}>Xóa bộ lọc</button></Empty>}
        <div className={styles.tableFooter}><span role="status" aria-live="polite">{items.length ? `Hiển thị ${offset + 1}–${Math.min(offset + PAGE_SIZE, items.length)} / ${items.length} giao dịch` : '0 giao dịch'}</span><nav className="pager" aria-label="Phân trang giao dịch">
          <button type="button" disabled={currentPage === 1} aria-label="Trang trước" onClick={() => setPage(currentPage - 1)}><Icon name="chevron-left" /></button>
          {Array.from({ length: pages }, (_, index) => <button key={index} type="button" aria-label={`Trang ${index + 1}`} aria-current={currentPage === index + 1 ? 'page' : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>)}
          <button type="button" disabled={currentPage === pages} aria-label="Trang sau" onClick={() => setPage(currentPage + 1)}><Icon name="chevron-right" /></button>
        </nav></div>
      </section>

      <section id="panel-subscriptions" role="tabpanel" aria-labelledby="tab-subscriptions" tabIndex={0} hidden={tab !== 'subscriptions'}>
        <div className={styles.sectionHead}><div><h2>Gói người dùng</h2><p>Theo dõi hiệu lực gói và các tài khoản cần gia hạn.</p></div></div>
        <form className={styles.filters} aria-label="Lọc gói người dùng" onSubmit={event => event.preventDefault()} onReset={() => setSubFilters(SUB_FILTERS)}>
          <label className={`field ${styles.search}`}>Người dùng<input className="input" type="search" placeholder="Tên hoặc email…" value={subFilters.query} onChange={event => setSubFilters({ ...subFilters, query: event.target.value })} /></label>
          <PlanSelect value={subFilters.plan} onChange={event => setSubFilters({ ...subFilters, plan: event.target.value })} />
          <label className="field">Hiệu lực<select className="select" value={subFilters.status} onChange={event => setSubFilters({ ...subFilters, status: event.target.value })}><option value="">Tất cả trạng thái</option><option value="active">Còn hiệu lực</option><option value="soon">Sắp hết hạn 7 ngày</option><option value="expired">Đã hết hạn</option></select></label>
          <button className="btn btn-quiet" type="reset">Xóa bộ lọc</button>
        </form>
        {subscriptions.length ? <DataTable headers={['Người dùng', 'Gói dịch vụ', 'Bắt đầu', 'Hết hạn', 'Trạng thái']} caption="Gói dịch vụ của người dùng" rows={subscriptions.map(s => ({ id: s.id, cells: [
          <><strong>{s.name}</strong><small>{s.email}</small></>, <span className={styles.planLabel}>{planName(s.plan)}</span>, date(s.start),
          <><strong>{date(s.expiry)}</strong><small>{time(s.expiry)} · Giờ Việt Nam</small></>, <StatusBadge status={subscriptionStatus(s)} />,
        ] }))} /> : <Empty title="Không có gói phù hợp" description="Thử thay đổi tên, email hoặc điều kiện lọc." />}
      </section>

      <section id="panel-plans" role="tabpanel" aria-labelledby="tab-plans" tabIndex={0} hidden={tab !== 'plans'}>
        <div className={styles.sectionHead}><div><h2>Cấu hình gói dịch vụ</h2><p>Thiết lập giá và quyền lợi cho các đơn mua mới.</p></div></div>
        <div className={styles.planGrid}>{data.plans.map(p => <article key={p.code} className={styles.planCard}>
          <div className={styles.sectionHead}><h3>{planName(p.code)}</h3><StatusBadge status={p.active ? ['Đang mở bán', 'success'] : ['Ngừng mở bán', 'expired']} /></div>
          <p className={styles.price}>{money(p.month)} <small>/ tháng</small></p><p className={styles.yearPrice}>{money(p.year)} / năm</p>
          <ul className={styles.featureList}>{[['Số thẻ tối đa', p.cards === null ? 'Không giới hạn' : p.cards.toLocaleString('vi-VN')], ['AI văn bản / ngày', `${p.ai} lượt`], ['Ảnh AI / ngày', `${p.images} ảnh`], ['Đánh giá phát âm', p.speech ? 'Có' : 'Không'], ['Bộ mẫu cao cấp', p.premium ? 'Có' : 'Không']].map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul>
          <button className="btn btn-secondary" type="button" aria-label={`Chỉnh sửa gói ${planName(p.code)}`} onClick={() => openDialog({ type: 'plan', plan: p })}><Icon name="edit" /> Chỉnh sửa gói</button><p className={styles.caption}>Phiên bản {p.version}</p>
        </article>)}</div>
        <p className={styles.info}>Giá mới chỉ áp dụng cho đơn tạo sau khi lưu. Đơn đã tạo giữ nguyên số tiền và gói người dùng đang dùng giữ nguyên thời hạn.</p>
      </section>

    </article>

    <Modal isOpen={!!dialog} onClose={() => setDialog(null)} title={dialog?.type === 'detail' ? 'Chi tiết giao dịch' : dialog?.type === 'plan' ? `Chỉnh sửa gói ${planName(dialog.plan.code)}` : ''} className={styles.dialog}>
      {dialog?.type === 'detail' && <TransactionDetail transaction={dialog.transaction} onClose={() => setDialog(null)} />}
      {dialog?.type === 'plan' && <form key={`${dialog.plan.code}-${dialog.plan.version}-${conflict}`} onSubmit={savePlan}>
        <p className={styles.dialogSubtitle}>Phiên bản {dialog.plan.version} · Thay đổi trên dữ liệu mẫu</p>
        <div className={styles.editGrid}>{[['Giá tháng (VND)', 'month', 1], ['Giá năm (VND)', 'year', 1], ['Số thẻ tối đa (trống = không giới hạn)', 'cards', 1], ['AI văn bản / ngày', 'ai', 0], ['Ảnh AI / ngày', 'images', 0]].map(([label, name, min]) => <label className="field" key={name}>{label}<input className="input" name={name} type="number" min={min} max={1000000000} step={1} defaultValue={dialog.plan[name] ?? ''} placeholder={name === 'cards' ? 'Không giới hạn' : undefined} required={name !== 'cards'} disabled={conflict} /></label>)}
          {[['active', 'Mở bán gói'], ['speech', 'Đánh giá phát âm'], ['premium', 'Bộ mẫu cao cấp']].map(([name, label]) => <label className={styles.check} key={name}><input name={name} type="checkbox" defaultChecked={dialog.plan[name]} disabled={conflict} /> {label}</label>)}
        </div>
        <p className={styles.formError} role="alert">{formError}</p>
        <div className={styles.actions}><button className="btn btn-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>{conflict && <button className="btn btn-secondary" type="button" onClick={() => openDialog({ type: 'plan', plan: data.plans.find(p => p.code === dialog.plan.code) })}>Tải lại cấu hình</button>}<button className="btn btn-primary" type="submit" disabled={conflict}>Lưu thay đổi</button></div>
      </form>}
    </Modal>
  </div>;
}

function TransactionDetail({ transaction: t, onClose }) {
  const details = [['Mã đơn', t.id], ['Người thanh toán', t.name], ['Email', t.email], ['Gói dịch vụ', `${planName(t.plan)} · ${t.cycle === 'NAM' ? '12 tháng' : '1 tháng'}`], ['Tạo lúc', `${time(t.created)} ${date(t.created)}`], ['Cổng thanh toán', 'VNPay Sandbox'], ['Mã giao dịch VNPay', t.gatewayId || 'Chưa có'], ['Mã phản hồi', t.response ? `${t.response} · ${t.response === '00' ? 'Thành công' : 'Người dùng hủy giao dịch'}` : 'Chưa nhận phản hồi']];
  return <><p className={styles.dialogSubtitle}>Thông tin giao dịch mẫu · Giờ Việt Nam</p><div className={styles.detailTotal}><div><span className={styles.caption}>Số tiền thanh toán</span><strong>{money(t.amount)}</strong></div><StatusBadge status={PAYMENT_STATUSES[t.status]} /></div>
    <dl className={styles.detailList}>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className={styles.actions}><button className="btn btn-secondary" type="button" onClick={onClose}>Đóng</button>{t.status === 'THANH_CONG' && <button className="btn btn-primary" type="button" onClick={() => download(receiptHtml(t), `${t.id}-bien-nhan-mau.html`, 'text/html;charset=utf-8')}><Icon name="download" /> Tải biên nhận mẫu</button>}</div>
  </>;
}
