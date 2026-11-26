'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminPageHead, Pill, Who } from '@/components/admin/AdminPageHead';
import { AdminTable } from '@/components/admin/AdminTable';
import { Drawer, Icon, Select, Textarea, useToast } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { listAdminSupportTickets, respondToSupportTicket } from '@/lib/support-api';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, TICKETS_PAGE_SIZE } from '@/lib/support-tickets.mjs';
import { filterAdminTickets, validateSupportUpdate, SUPPORT_SORTS } from '@/lib/support-admin.mjs';
import styles from './page.module.css';

const options = labels => Object.entries(labels).map(([value, label]) => ({ value, label }));
const tabs = [{ value: '', label: 'Tất cả', id: 'all' }, ...options(TICKET_STATUSES).map(tab => ({ ...tab, id: tab.value }))];
const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
const EMPTY_FILTERS = { category: '', priority: '', sort: 'newest' };
const PRIORITY_TONES = { low: 'mute', medium: 'acc', high: 'warn', critical: 'bad' };
const STATUS_TONES = { open: 'acc', resolved: 'ok' };

function Badge({ priority, status }) {
  return priority ? <Pill tone={PRIORITY_TONES[priority]}>{TICKET_PRIORITIES[priority]}</Pill>
    : <Pill tone={STATUS_TONES[status]}>{TICKET_STATUSES[status]}</Pill>;
}

function TicketDetail({ selected, onClose, onSaved }) {
  const { ticket, owner } = selected;
  const client = useQueryClient();
  const [values, setValues] = useState({ message: '', status: ticket.status, priority: ticket.priority });
  const [attempted, setAttempted] = useState(false);
  const textarea = useRef(null);
  const busy = useRef(false);
  const mutation = useMutation({
    mutationFn: next => respondToSupportTicket(ticket, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      void client.invalidateQueries({ queryKey: ['support-tickets'] });
      onSaved();
    },
    onError: () => { void client.invalidateQueries({ queryKey: ['admin-support-tickets'] }); },
  });
  const conflict = mutation.error?.code === 'VERSION_CONFLICT';
  const error = attempted ? validateSupportUpdate(ticket, values) : '';
  function submit(event) {
    event.preventDefault();
    if (busy.current || conflict) return;
    setAttempted(true);
    if (validateSupportUpdate(ticket, values)) { textarea.current?.focus(); return; }
    busy.current = true;
    mutation.mutate(values, { onSettled: () => { busy.current = false; } });
  }
  const history = Array.isArray(ticket.history) ? ticket.history.filter(item => item && typeof item === 'object') : [];
  return <Drawer isOpen title={ticket.title} onClose={onClose} loading={mutation.isPending} footer={
    <div className={styles.drawerActions}>
      <button className="adm-btn" type="button" onClick={onClose} disabled={mutation.isPending}>Đóng</button>
      <button className="adm-btn adm-btn-primary" type="submit" form="reply-form" disabled={mutation.isPending || conflict}><Icon name="check" />{mutation.isPending ? 'Đang lưu…' : 'Lưu xử lý'}</button>
    </div>
  }>
    <h3 className="adm-section-title">Thông tin phiếu</h3>
    <dl className={`adm-kv ${styles.ticketDetails}`}>
      <dt>Mã phiếu</dt><dd>#{ticket.id}</dd>
      <dt>Học viên</dt><dd><Who name={owner.tenHienThi || 'Học viên'} sub={owner.email || 'Chưa có email'} /></dd>
      <dt>Loại vấn đề</dt><dd>{TICKET_CATEGORIES[ticket.category]}</dd>
      <dt>Trạng thái</dt><dd><Badge status={ticket.status} /></dd>
      <dt>Độ ưu tiên</dt><dd><Badge priority={ticket.priority} /></dd>
      <dt>Thời điểm gửi</dt><dd><time dateTime={ticket.createdAt}>{dateTime.format(new Date(ticket.createdAt))}</time></dd>
    </dl>
    <h3 className="adm-section-title">Nội dung yêu cầu</h3>
    <p className={`adm-quote ${styles.message}`}>{ticket.description}</p>
    <section className={styles.history} aria-labelledby="history-title"><h3 className="adm-section-title" id="history-title">Lịch sử xử lý</h3>
      <ol>{history.length ? history.map((item, index) => <li key={`${item.createdAt}-${index}`}>
        <strong>{typeof item.author === 'string' ? item.author : 'Quản trị viên'}</strong>
        <p>{typeof item.message === 'string' ? item.message : ''}</p><p className="adm-muted">{typeof item.action === 'string' ? item.action : ''}</p>
        {Number.isFinite(Date.parse(item.createdAt)) && <time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time>}
      </li>) : <li className="adm-muted">Chưa có phản hồi.</li>}</ol>
    </section>
    <form id="reply-form" noValidate onSubmit={submit} aria-busy={mutation.isPending}>
      <div className={styles.replyHeading}><h3 className="adm-section-title">Phản hồi học viên</h3><span className="adm-muted" id="reply-counter">{values.message.length}/2000</span></div>
      <Textarea className="adm-textarea" ref={textarea} id="reply-content" label="Nội dung phản hồi" rows={4} maxLength={2000}
        value={values.message} disabled={mutation.isPending} error={error} aria-describedby={`reply-counter${error ? ' reply-content-error' : ''}`}
        placeholder="Nhập hướng dẫn hoặc kết quả xử lý cho học viên…" onChange={event => setValues(previous => ({ ...previous, message: event.target.value }))} />
      <div className={styles.replyOptions}>
        <Select className="adm-select" id="detail-status" label="Trạng thái sau khi lưu" options={options(TICKET_STATUSES)} value={values.status} disabled={mutation.isPending} onChange={event => setValues(previous => ({ ...previous, status: event.target.value }))} />
        <Select className="adm-select" id="detail-priority" label="Độ ưu tiên" options={options(TICKET_PRIORITIES)} value={values.priority} disabled={mutation.isPending} onChange={event => setValues(previous => ({ ...previous, priority: event.target.value }))} />
      </div>
      {mutation.isError && <p className={`adm-notice adm-notice-bad ${styles.saveError}`} role="alert"><Icon name="alert" />{mutation.error.message || 'Không lưu được thay đổi. Vui lòng thử lại.'}</p>}
    </form>
  </Drawer>;
}

export default function SupportIntake() {
  const { data: user } = useMe();
  const { toast } = useToast();
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const status = Object.hasOwn(TICKET_STATUSES, params.get('status')) ? params.get('status') : '';
  const [search, setSearch] = useState(''), [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS), [draft, setDraft] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false), [page, setPage] = useState(1), [selected, setSelected] = useState(null);
  const searchInput = useRef(null), categorySelect = useRef(null), filterButton = useRef(null), panel = useRef(null), trigger = useRef(null);
  const query = useQuery({
    queryKey: ['admin-support-tickets', user?.id],
    queryFn: listAdminSupportTickets,
    enabled: !!user?.vaiTro?.includes('ADMIN'),
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
  });
  const entries = query.data || [];
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { if (showFilters) categorySelect.current?.focus(); }, [showFilters]);
  function setStatus(nextStatus) {
    const next = new URLSearchParams(params.toString());
    if (nextStatus) next.set('status', nextStatus); else next.delete('status');
    router.push(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }); setPage(1);
  }
  function reset() {
    setSearch(''); setDebounced(''); setFilters(EMPTY_FILTERS); setDraft(EMPTY_FILTERS); setStatus('');
  }
  function removeFilter(key) {
    if (key === 'search') { setSearch(''); setDebounced(''); }
    else if (key === 'status') setStatus('');
    else { setFilters(previous => ({ ...previous, [key]: '' })); setDraft(previous => ({ ...previous, [key]: '' })); }
    setPage(1); searchInput.current?.focus();
  }
  function closeDetail() {
    setSelected(null);
    requestAnimationFrame(() => { if (trigger.current?.isConnected) trigger.current.focus(); else panel.current?.focus(); });
  }
  function selectTab(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next !== null) { event.preventDefault(); setStatus(tabs[next].value); event.currentTarget.parentElement.children[next].focus(); }
  }
  const withoutStatus = filterAdminTickets(entries, { ...filters, search: debounced });
  const matches = withoutStatus.filter(entry => !status || entry.ticket.status === status);
  const totalPages = Math.ceil(matches.length / TICKETS_PAGE_SIZE), currentPage = Math.min(page, Math.max(1, totalPages)), start = (currentPage - 1) * TICKETS_PAGE_SIZE;
  const chips = [
    { key: 'search', label: debounced && `Tìm: ${debounced}` }, { key: 'status', label: TICKET_STATUSES[status] },
    { key: 'category', label: TICKET_CATEGORIES[filters.category] }, { key: 'priority', label: filters.priority && `Ưu tiên: ${TICKET_PRIORITIES[filters.priority]}` },
  ].filter(chip => chip.label);
  const summary = [
    { label: 'Tổng số phiếu', count: entries.length, tone: 'all' },
    { label: 'Đang mở', count: entries.filter(({ ticket }) => ticket.status === 'open').length, tone: 'open' },
    { label: 'Ưu tiên cao', count: entries.filter(({ ticket }) => ticket.status === 'open' && ['high', 'critical'].includes(ticket.priority)).length, tone: 'urgent' },
    { label: 'Đã giải quyết', count: entries.filter(({ ticket }) => ticket.status === 'resolved').length, tone: 'resolved' },
  ];

  function openDetail(event, entry) {
    trigger.current = event.currentTarget;
    setSelected(entry);
  }

  async function refresh() {
    const result = await query.refetch();
    if (!result.isError) toast('Đã làm mới danh sách phiếu hỗ trợ.', { variant: 'success' });
  }

  const columns = [
    {
      key: 'ticket', header: 'Phiếu hỗ trợ', className: styles.ticketCell,
      render: entry => (
        <>
          <button className={`adm-a ${styles.ticketTitle}`} type="button" onClick={event => openDetail(event, entry)}>{entry.ticket.title}</button>
          <div className={`adm-muted ${styles.ticketMeta}`}>
            <span>#{entry.ticket.id}</span><span>{TICKET_CATEGORIES[entry.ticket.category]}</span>
            <time dateTime={entry.ticket.createdAt}>{date.format(new Date(entry.ticket.createdAt))}</time>
          </div>
        </>
      ),
    },
    {
      key: 'owner', header: 'Học viên',
      render: ({ owner }) => <Who name={owner.tenHienThi || 'Học viên'} sub={owner.email || 'Chưa có email'} />,
    },
    { key: 'priority', header: 'Độ ưu tiên', render: ({ ticket }) => <Badge priority={ticket.priority} /> },
    { key: 'status', header: 'Trạng thái', render: ({ ticket }) => <Badge status={ticket.status} /> },
    {
      key: 'actions', header: 'Thao tác', srHeader: true, align: 'right',
      render: entry => <button className="adm-btn adm-btn-sm" type="button" aria-label={`Xem phiếu ${entry.ticket.id} của ${entry.owner.tenHienThi}`} onClick={event => openDetail(event, entry)}><Icon name="eye" />Xem</button>,
    },
  ];

  return (
    <div className={`adm-page ${styles.page}`}>
      <AdminPageHead title="Tiếp nhận hỗ trợ" description="Lắng nghe, phản hồi và giải quyết yêu cầu của học viên." actions={
        <button className="adm-btn" type="button" disabled={query.isFetching} onClick={refresh}><Icon name="refresh" />{query.isFetching ? 'Đang tải…' : 'Làm mới'}</button>
      } />

      <section className="adm-card" aria-label="Tổng quan phiếu hỗ trợ">
        <div className={`adm-card-body ${styles.summaryBody}`}>
          <dl className={styles.summary}>{summary.map(item => (
            <div key={item.tone}><dt>{item.label}</dt><dd data-count-tone={item.tone}>{query.isPending ? '—' : item.count}</dd></div>
          ))}</dl>
        </div>
      </section>

      <section className="adm-card" aria-label="Danh sách phiếu hỗ trợ">
        <div className={`adm-toolbar ${styles.toolbar}`}>
          <div className={styles.searchRow}>
            <label className="sr-only" htmlFor="support-search">Tìm theo mã phiếu, nội dung, tên hoặc email học viên</label>
            <input ref={searchInput} className={`adm-input ${styles.search}`} id="support-search" type="search" placeholder="Tìm mã phiếu, nội dung, email học viên…" autoComplete="off" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
            <button ref={filterButton} className="adm-btn" type="button" aria-expanded={showFilters} aria-controls="support-filters" onClick={() => { setDraft(filters); setShowFilters(!showFilters); }}><Icon name="filter" />Bộ lọc{chips.length > 0 && <span className={styles.count}>{chips.length}</span>}</button>
          </div>
          <form className={styles.filters} id="support-filters" hidden={!showFilters} onSubmit={event => { event.preventDefault(); setFilters(draft); setPage(1); setShowFilters(false); filterButton.current?.focus(); }}>
            <Select className="adm-select" ref={categorySelect} id="filter-category" label="Loại vấn đề" placeholder="Tất cả loại vấn đề" options={options(TICKET_CATEGORIES)} value={draft.category} onChange={event => setDraft(previous => ({ ...previous, category: event.target.value }))} />
            <Select className="adm-select" id="filter-priority" label="Độ ưu tiên" placeholder="Tất cả độ ưu tiên" options={options(TICKET_PRIORITIES)} value={draft.priority} onChange={event => setDraft(previous => ({ ...previous, priority: event.target.value }))} />
            <Select className="adm-select" id="filter-sort" label="Sắp xếp" options={options(SUPPORT_SORTS)} value={draft.sort} onChange={event => setDraft(previous => ({ ...previous, sort: event.target.value }))} />
            <button className="adm-btn adm-btn-primary" type="submit">Áp dụng</button>
          </form>
          <div className={styles.statusRow}>
            <div className={`adm-seg ${styles.tabs}`} role="tablist" aria-label="Trạng thái phiếu hỗ trợ">{tabs.map((tab, index) => (
              <button key={tab.id} type="button" id={`support-tab-${tab.id}`} role="tab" aria-controls="support-panel" aria-selected={status === tab.value} tabIndex={status === tab.value ? 0 : -1} onClick={() => setStatus(tab.value)} onKeyDown={event => selectTab(event, index)}>
                {tab.label}<span className={styles.count}>{tab.value ? withoutStatus.filter(({ ticket }) => ticket.status === tab.value).length : withoutStatus.length}</span>
              </button>
            ))}</div>
            <span className="adm-muted">{SUPPORT_SORTS[filters.sort]}</span>
          </div>
          {chips.length > 0 && <div className={styles.chips} aria-label="Bộ lọc đang áp dụng">{chips.map(chip => (
            <button key={chip.key} className={`adm-btn adm-btn-sm ${styles.chip}`} type="button" aria-label={`Gỡ bộ lọc ${chip.label}`} onClick={() => removeFilter(chip.key)}><span>{chip.label}</span><Icon name="x" /></button>
          ))}<button className="adm-btn adm-btn-sm" type="button" onClick={reset}>Đặt lại</button></div>}
        </div>

        <section ref={panel} id="support-panel" role="tabpanel" aria-labelledby={`support-tab-${status || 'all'}`} tabIndex={0} aria-busy={query.isPending}>
          <AdminTable
            caption="Danh sách yêu cầu hỗ trợ của học viên"
            columns={columns}
            rows={matches.slice(start, start + TICKETS_PAGE_SIZE)}
            rowKey="key"
            loading={query.isPending}
            error={query.isError ? query.error : null}
            onRetry={query.refetch}
            emptyTitle={chips.length ? 'Không tìm thấy phiếu hỗ trợ' : 'Chưa có phiếu hỗ trợ'}
            emptyText={chips.length ? 'Thử tìm từ khóa khác hoặc thay đổi bộ lọc.' : 'Các yêu cầu mới của học viên sẽ xuất hiện tại đây.'}
            emptyAction={chips.length > 0 && <button className="adm-btn" type="button" onClick={reset}>Đặt lại bộ lọc</button>}
            pagination={matches.length > 0 ? {
              page: currentPage - 1, size: TICKETS_PAGE_SIZE, totalPages, totalElements: matches.length,
              onPageChange: next => { setPage(next + 1); panel.current?.focus(); },
            } : null}
          />
        </section>
      </section>

      <p className={`adm-muted ${styles.footer}`}><Icon name="info" />Phản hồi và trạng thái được lưu cho học viên xem trong trang Phiếu hỗ trợ của họ.</p>
      {selected && <TicketDetail key={selected.key} selected={selected} onClose={closeDetail} onSaved={() => { closeDetail(); toast('Đã lưu xử lý phiếu hỗ trợ.', { variant: 'success' }); }} />}
    </div>
  );
}
