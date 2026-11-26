'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Icon, Modal, useToast } from '@/components/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState } from '@/components/ui';
import { billingKeys, loadAdminBilling, planPayload, mapPayment, mapPlan, money, date, time, normalize, isCancelled, isExpired, isActiveSubscription, isSoon, subscriptionStatus, statuses as PAYMENT_STATUSES, paymentsCsv } from '@/lib/billing-api';
const planName = code => code === 'PRO' ? 'Pro' : code === 'PREMIUM' ? 'Premium' : code;
import styles from './page.module.css';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill, Who } from '@/components/admin/AdminPageHead';

const PAYMENT_FILTERS = { query: '', status: '', plan: '', from: '', to: '' };
const SUB_FILTERS = { query: '', status: '', plan: '' };
const TABS = [['payments', 'Giao dịch'], ['subscriptions', 'Gói người dùng'], ['plans', 'Cấu hình gói']];
const PAGE_SIZE = 20;
const TONE = { success: 'ok', pending: 'warn', failed: 'bad', expired: 'mute' };
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
  return <Pill tone={TONE[status[1]] || 'mute'}>{status[0]}</Pill>;
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
  const queryClient = useQueryClient();
  const billing = useQuery({ queryKey: billingKeys.admin, queryFn: loadAdminBilling, refetchInterval: 30000 });
  const data = billing.data || { transactions: [], plans: [], subscriptions: [] };
  const transactions = data.transactions;
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('payments');
  const [filters, setFilters] = useState(PAYMENT_FILTERS);
  const [subFilters, setSubFilters] = useState(SUB_FILTERS);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [formError, setFormError] = useState('');
  const [conflict, setConflict] = useState(false);

  const items = transactions.filter(t => (!filters.query || normalize(`${t.id} ${t.email}`).includes(normalize(filters.query.trim()))) && (!filters.status || t.status === filters.status) && (!filters.plan || t.plan === filters.plan) && (!filters.from || new Date(t.created).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) >= filters.from) && (!filters.to || new Date(t.created).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) <= filters.to) && !(filters.from && filters.to && filters.from > filters.to));
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const paid = transactions.filter(t => t.status === 'THANH_CONG');
  const query = normalize(subFilters.query.trim());
  const subscriptions = data.subscriptions.filter(s => (!query || normalize(`${s.name} ${s.email}`).includes(query)) &&
    (!subFilters.plan || s.plan === subFilters.plan) && (!subFilters.status || (subFilters.status === 'cancelled' ? isCancelled(s) : subFilters.status === 'expired' ? isExpired(s) : subFilters.status === 'soon' ? isSoon(s) : isActiveSubscription(s))));

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

  async function savePlan(event) {
    event.preventDefault();
    if (conflict || saving) return;
    const fields = new FormData(event.currentTarget);
    const existing = data.plans.find(p => p.code === dialog.plan.code);
    if (!existing || existing.version !== dialog.plan.version) {
      setConflict(true);
      setFormError('Cấu hình đã thay đổi ở phiên khác. Tải lại cấu hình trước khi chỉnh sửa.');
      return;
    }
    const updated = { ...existing };
    for (const key of ['month', 'year', 'cards']) {
      updated[key] = key === 'cards' && fields.get(key) === '' ? null : Number(fields.get(key));
      if (updated[key] !== null && (!Number.isSafeInteger(updated[key]) || updated[key] < (key === 'cards' ? 1 : 1000) || updated[key] > (key === 'month' ? 100000000 : 1000000000))) {
        setFormError('Nhập số nguyên trong giới hạn cho phép. Giá tối thiểu 1.000 đ; giá tháng tối đa 100 triệu, giá năm tối đa 1 tỷ.');
        return;
      }
    }
    for (const key of ['active', 'speech', 'stats']) updated[key] = fields.has(key);
    setSaving(true);
    setFormError('');
    try {
      await apiFetch(`/api/v1/admin/plans/${encodeURIComponent(updated.code)}`, { method: 'PUT', body: JSON.stringify(planPayload(updated)) });
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast('Đã lưu cấu hình gói.', { variant: 'success' });
      setDialog(null);
    } catch (error) {
      setFormError(error.message);
      if (error.status === 409) setConflict(true);
    } finally { setSaving(false); }
  }
  async function showDetail(id) {
    try {
      const detail = await apiFetch(`/api/v1/admin/payments/${encodeURIComponent(id)}`);
      openDialog({ type: 'detail', transaction: mapPayment(detail.giaoDich) });
    } catch (error) { toast(error.message, { variant: 'error' }); }
  }
  async function reloadPlan() {
    try {
      const plans = await apiFetch('/api/v1/admin/plans');
      const plan = plans.find(p => p.ma === dialog.plan.code);
      if (!plan) throw new Error('Gói không còn tồn tại.');
      openDialog({ type: 'plan', plan: mapPlan(plan) });
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    } catch (error) { setFormError(error.message); }
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
    ['Tổng giao dịch', transactions.length, 'Toàn bộ giao dịch'],
    ['Gói còn hiệu lực', data.subscriptions.filter(isActiveSubscription).length, 'Tính tại thời điểm hiện tại'],
    ['Sắp hết hạn', data.subscriptions.filter(isSoon).length, 'Trong 7 ngày tới'],
  ];

  const head = <AdminPageHead title="Thanh toán & gói" description="Theo dõi giao dịch VNPay, thời hạn gói của người dùng và cấu hình giá, quyền lợi từng gói." actions={<><Link href="/quan-tri/doanh-thu" className="adm-btn"><Icon name="chart" />Doanh thu</Link><button type="button" className="adm-btn" onClick={() => billing.refetch()} disabled={billing.isFetching}><Icon name="refresh" />{billing.isFetching ? 'Đang tải…' : 'Làm mới'}</button></>} />;
  if (billing.isPending) return <div className="adm-page">{head}<div className="adm-card adm-empty" role="status">Đang tải dữ liệu thanh toán…</div></div>;
  if (billing.isError) return <div className="adm-page">{head}<div className="adm-card"><ErrorState description={billing.error.message} onRetry={() => billing.refetch()} /></div></div>;
  return <div className={`adm-page ${styles.page}`}>
    {head}
    <article className="adm-card" style={{ padding: 16 }} aria-label="Quản lý thanh toán">
      <div className={styles.summary} aria-label="Tổng quan thanh toán">
        {summary.map(([label, value, note], index) => <article key={label}><p>{label}</p><strong className={index === 0 ? styles.positive : undefined}>{value}</strong><small>{note}</small></article>)}
      </div>
      <div className={`tabs ${styles.tabsGap}`} role="tablist" aria-label="Quản lý thanh toán" onKeyDown={tabKeyDown}>
        {TABS.map(([id, label]) => <button key={id} type="button" className="tab" id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      <section id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" tabIndex={0} hidden={tab !== 'payments'}>
        <div className={styles.sectionHead}><div><h2>Danh sách giao dịch</h2><p>Tra cứu các đơn mua và gia hạn gói qua VNPay.</p></div><button className="adm-btn" type="button" disabled={!items.length} onClick={() => {
          download(paymentsCsv(items), 'giao-dich.csv', 'text/csv;charset=utf-8');
          toast(`Đã xuất ${items.length} giao dịch theo bộ lọc hiện tại.`);
        }}><Icon name="download" /> Xuất CSV</button></div>
        <form className={styles.filters} aria-label="Lọc giao dịch" onSubmit={event => event.preventDefault()} onReset={clearFilters}>
          <label className={`field ${styles.search}`}>Tìm giao dịch<input className="input" type="search" placeholder="Mã đơn hoặc email…" autoComplete="off" value={filters.query} onChange={event => updateFilter('query', event.target.value)} /></label>
          <label className="field">Trạng thái<select className="select" value={filters.status} onChange={event => updateFilter('status', event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(PAYMENT_STATUSES).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <PlanSelect value={filters.plan} onChange={event => updateFilter('plan', event.target.value)} />
          <label className="field">Từ ngày<input className="input" type="date" value={filters.from} aria-describedby="payment-feedback" onChange={event => updateFilter('from', event.target.value)} /></label>
          <label className="field">Đến ngày<input className="input" type="date" value={filters.to} aria-describedby="payment-feedback" aria-invalid={!!(filters.from && filters.to && filters.from > filters.to)} onChange={event => updateFilter('to', event.target.value)} /></label>
          <button className="btn btn-quiet" type="reset">Xóa bộ lọc</button>
        </form>
        <p className={styles.feedback} id="payment-feedback" role="status" aria-live="polite">{filters.from && filters.to && filters.from > filters.to ? 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.' : ''}</p>
        <div className="adm-card" style={{ boxShadow: 'none' }}><AdminTable
          caption="Các giao dịch thanh toán qua VNPay"
          rows={items.slice(offset, offset + PAGE_SIZE)}
          onRowClick={t => showDetail(t.id)}
          rowLabel={t => `Chi tiết đơn ${t.id}`}
          columns={[
            { key: 'id', header: 'Mã đơn', sortValue: t => Date.parse(t.created), render: t => <span><b style={{ fontWeight: 650 }}>{t.id}</b><br /><span className="adm-muted">{date(t.created)} · {time(t.created)}</span></span> },
            { key: 'user', header: 'Người dùng', sortValue: t => t.name, render: t => <Who name={t.name} sub={t.email} /> },
            { key: 'plan', header: 'Gói', sortValue: t => t.plan, render: t => <span><Pill tone="acc">{planName(t.plan)}</Pill><br /><span className="adm-muted">{t.cycle === 'NAM' ? '12 tháng' : '1 tháng'}</span></span> },
            { key: 'amount', header: 'Số tiền', align: 'right', sortValue: t => t.amount, render: t => money(t.amount) },
            { key: 'status', header: 'Trạng thái', sortValue: t => t.status, render: t => <StatusBadge status={PAYMENT_STATUSES[t.status]} /> },
            { key: 'detail', header: 'Thao tác', srHeader: true, render: t => <div className="adm-row-actions"><button type="button" className="adm-btn adm-btn-sm" aria-label={`Xem chi tiết đơn ${t.id}`} onClick={() => showDetail(t.id)}>Chi tiết</button></div> },
          ]}
          emptyTitle="Không có giao dịch"
          emptyText="Thử thay đổi từ khóa hoặc xóa bộ lọc."
          emptyAction={<button className="adm-btn" type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
          pagination={{ page: currentPage - 1, size: PAGE_SIZE, totalElements: items.length, totalPages: pages, onPageChange: value => setPage(value + 1) }}
        /></div>
      </section>

      <section id="panel-subscriptions" role="tabpanel" aria-labelledby="tab-subscriptions" tabIndex={0} hidden={tab !== 'subscriptions'}>
        <div className={styles.sectionHead}><div><h2>Gói người dùng</h2><p>Theo dõi hiệu lực gói và các tài khoản cần gia hạn.</p></div></div>
        <form className={styles.filters} aria-label="Lọc gói người dùng" onSubmit={event => event.preventDefault()} onReset={() => setSubFilters(SUB_FILTERS)}>
          <label className={`field ${styles.search}`}>Người dùng<input className="input" type="search" placeholder="Tên hoặc email…" value={subFilters.query} onChange={event => setSubFilters({ ...subFilters, query: event.target.value })} /></label>
          <PlanSelect value={subFilters.plan} onChange={event => setSubFilters({ ...subFilters, plan: event.target.value })} />
          <label className="field">Hiệu lực<select className="select" value={subFilters.status} onChange={event => setSubFilters({ ...subFilters, status: event.target.value })}><option value="">Tất cả trạng thái</option><option value="active">Còn hiệu lực</option><option value="soon">Sắp hết hạn 7 ngày</option><option value="expired">Đã hết hạn</option><option value="cancelled">Đã hủy</option></select></label>
          <button className="btn btn-quiet" type="reset">Xóa bộ lọc</button>
        </form>
        <div className="adm-card" style={{ boxShadow: 'none' }}><AdminTable
          caption="Gói dịch vụ của người dùng"
          rows={subscriptions}
          columns={[
            { key: 'user', header: 'Người dùng', sortValue: x => x.name, render: x => <Who name={x.name} sub={x.email} /> },
            { key: 'plan', header: 'Gói', sortValue: x => x.plan, render: x => <Pill tone="acc">{planName(x.plan)}</Pill> },
            { key: 'start', header: 'Bắt đầu', nowrap: true, sortValue: x => Date.parse(x.start), render: x => date(x.start) },
            { key: 'expiry', header: 'Hết hạn', nowrap: true, sortValue: x => Date.parse(x.expiry), render: x => <span><b style={{ fontWeight: 500 }}>{date(x.expiry)}</b><br /><span className="adm-muted">{time(x.expiry)} · giờ Việt Nam</span></span> },
            { key: 'status', header: 'Trạng thái', render: x => <StatusBadge status={subscriptionStatus(x)} /> },
          ]}
          emptyTitle="Không có gói phù hợp"
          emptyText="Thử thay đổi tên, email hoặc điều kiện lọc."
        /></div>
      </section>

      <section id="panel-plans" role="tabpanel" aria-labelledby="tab-plans" tabIndex={0} hidden={tab !== 'plans'}>
        <div className={styles.sectionHead}><div><h2>Cấu hình gói dịch vụ</h2><p>Thiết lập giá và quyền lợi cho các đơn mua mới.</p></div></div>
        <div className={styles.planGrid}>{data.plans.map(p => <article key={p.code} className={styles.planCard}>
          <div className={styles.sectionHead}><h3>{planName(p.code)}</h3><StatusBadge status={p.active ? ['Đang mở bán', 'success'] : ['Ngừng mở bán', 'expired']} /></div>
          <p className={styles.price}>{money(p.month)} <small>/ tháng</small></p><p className={styles.yearPrice}>{money(p.year)} / năm</p>
          <ul className={styles.featureList}>{[['Số thẻ tối đa', p.cards === null ? 'Không giới hạn' : p.cards.toLocaleString('vi-VN')], ['Đánh giá phát âm', p.speech ? 'Có' : 'Không'], ['Thống kê nâng cao', p.stats ? 'Có' : 'Chỉ 7 ngày']].map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul>
          <button className="btn btn-secondary" type="button" aria-label={`Chỉnh sửa gói ${planName(p.code)}`} onClick={() => openDialog({ type: 'plan', plan: p })}><Icon name="edit" /> Chỉnh sửa gói</button><p className={styles.caption}>Phiên bản {p.version}</p>
        </article>)}</div>
        <p className={styles.info}>Giá mới chỉ áp dụng cho đơn tạo sau khi lưu. Đơn đã tạo giữ nguyên số tiền và gói người dùng đang dùng giữ nguyên thời hạn.</p>
      </section>

    </article>

    <Modal isOpen={!!dialog} onClose={() => { if (!saving) setDialog(null); }} loading={saving} title={dialog?.type === 'detail' ? 'Chi tiết giao dịch' : dialog?.type === 'plan' ? `Chỉnh sửa gói ${planName(dialog.plan.code)}` : ''} className={styles.dialog}>
      {dialog?.type === 'detail' && <TransactionDetail transaction={dialog.transaction} onClose={() => setDialog(null)} />}
      {dialog?.type === 'plan' && <form key={`${dialog.plan.code}-${dialog.plan.version}-${conflict}`} onSubmit={savePlan}>
        <p className={styles.dialogSubtitle}>Phiên bản {dialog.plan.version}</p>
        <div className={styles.editGrid}>{[['Giá tháng (VND)', 'month', 1000], ['Giá năm (VND)', 'year', 1000], ['Số thẻ tối đa (trống = không giới hạn)', 'cards', 1]].map(([label, name, min]) => <label className="field" key={name}>{label}<input className="input" name={name} type="number" min={min} max={name === 'month' ? 100000000 : 1000000000} step={1} defaultValue={dialog.plan[name] ?? ''} placeholder={name === 'cards' ? 'Không giới hạn' : undefined} required={name !== 'cards'} disabled={conflict || saving} /></label>)}
          {[['active', 'Mở bán gói'], ['speech', 'Đánh giá phát âm'], ['stats', 'Thống kê nâng cao (khoảng dài, từng bộ thẻ)']].map(([name, label]) => <label className={styles.check} key={name}><input name={name} type="checkbox" defaultChecked={dialog.plan[name]} disabled={conflict || saving} /> {label}</label>)}
        </div>
        <p className={styles.formError} role="alert">{formError}</p>
        <div className={styles.actions}><button className="btn btn-quiet" type="button" onClick={() => setDialog(null)} disabled={saving}>Hủy</button>{conflict && <button className="btn btn-secondary" type="button" onClick={reloadPlan}>Tải lại cấu hình</button>}<button className="btn btn-primary" type="submit" disabled={conflict || saving}>Lưu thay đổi</button></div>
      </form>}
    </Modal>
  </div>;
}

function TransactionDetail({ transaction: t, onClose }) {
  const details = [['Mã đơn', t.id], ['Người thanh toán', t.name], ['Email', t.email], ['Gói dịch vụ', `${planName(t.plan)} · ${t.cycle === 'NAM' ? '12 tháng' : '1 tháng'}`], ['Tạo lúc', `${time(t.created)} ${date(t.created)}`], ['Cổng thanh toán', t.gateway === 'MO_PHONG' ? 'Mô phỏng' : 'VNPay'], ['Mã giao dịch VNPay', t.gatewayId || 'Chưa có'], ['Mã phản hồi', t.response ? `${t.response} · ${t.response === '00' ? 'Thành công' : 'Người dùng hủy giao dịch'}` : 'Chưa nhận phản hồi']];
  return <><p className={styles.dialogSubtitle}>Thông tin giao dịch · Giờ Việt Nam</p><div className={styles.detailTotal}><div><span className={styles.caption}>Số tiền thanh toán</span><strong>{money(t.amount)}</strong></div><StatusBadge status={PAYMENT_STATUSES[t.status]} /></div>
    <dl className={styles.detailList}>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className={styles.actions}><button className="btn btn-secondary" type="button" onClick={onClose}>Đóng</button></div>
  </>;
}
