'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, Modal, Pagination, Select, Textarea, useToast } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useSupportTicketSync } from '@/hooks/useSupportTicketSync';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, TICKETS_PAGE_SIZE } from '@/lib/support-tickets.mjs';
import { filterAdminTickets, readAdminTickets, saveSupportUpdate, validateSupportUpdate, SUPPORT_SORTS, SUPPORT_UPDATE_EVENT } from '@/lib/support-admin.mjs';
import styles from './page.module.css';

const options = labels => Object.entries(labels).map(([value, label]) => ({ value, label }));
const tabs = [{ value: '', label: 'Tất cả', id: 'all' }, ...options(TICKET_STATUSES).map(tab => ({ ...tab, id: tab.value }))];
const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
const EMPTY_FILTERS = { category: '', priority: '', sort: 'newest' };

function Badge({ priority, status }) {
  return <span className={styles.badge} data-priority={priority} data-state={status}>{priority ? TICKET_PRIORITIES[priority] : TICKET_STATUSES[status]}</span>;
}

function TicketDetail({ selected, actor, onClose, onSaved }) {
  const { ticket, owner } = selected;
  const client = useQueryClient();
  const [values, setValues] = useState({ message: '', status: ticket.status, priority: ticket.priority });
  const [attempted, setAttempted] = useState(false);
  const textarea = useRef(null);
  const busy = useRef(false);
  const mutation = useMutation({
    mutationFn: async next => {
      await new Promise(resolve => setTimeout(resolve, 450));
      return saveSupportUpdate(window.localStorage, selected, next, actor);
    },
    onSuccess: result => {
      client.setQueryData(['support-tickets-demo', result.ownerId], result.tickets);
      window.dispatchEvent(new Event(SUPPORT_UPDATE_EVENT));
      onSaved();
    },
    onError: () => { void client.invalidateQueries({ queryKey: ['admin-support-tickets-demo'] }); },
  });
  const conflict = mutation.error?.code === 'SUPPORT_CONFLICT';
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
  return <Modal isOpen title={ticket.title} onClose={onClose} loading={mutation.isPending} className={styles.dialog}>
    <p className={styles.eyebrow}>Phiếu #{ticket.id}</p>
    <div className={styles.detailMeta}><Badge status={ticket.status} /><Badge priority={ticket.priority} /><span>{TICKET_CATEGORIES[ticket.category]}</span></div>
    <section className={styles.message} aria-label="Nội dung yêu cầu">
      <div className={styles.sender}><strong>{owner.tenHienThi}</strong><small>{owner.email || 'Chưa có email trong dữ liệu mẫu'}</small></div>
      <p>{ticket.description}</p><time dateTime={ticket.createdAt}>Gửi lúc {dateTime.format(new Date(ticket.createdAt))}</time>
    </section>
    <section className={styles.history} aria-labelledby="history-title"><h3 id="history-title">Lịch sử xử lý</h3>
      <ol>{history.length ? history.map((item, index) => <li key={`${item.createdAt}-${index}`}>
        <strong>{typeof item.author === 'string' ? item.author : 'Quản trị viên'}</strong>
        <p>{typeof item.message === 'string' ? item.message : ''}</p><p className="muted">{typeof item.action === 'string' ? item.action : ''}</p>
        {Number.isFinite(Date.parse(item.createdAt)) && <time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time>}
      </li>) : <li className="muted">Chưa có phản hồi được lưu trong bản mẫu.</li>}</ol>
    </section>
    <form id="reply-form" noValidate onSubmit={submit} aria-busy={mutation.isPending}>
      <div className={styles.replyHeading}><h3>Phản hồi học viên</h3><span id="reply-counter">{values.message.length}/2000</span></div>
      <Textarea ref={textarea} id="reply-content" label="Nội dung phản hồi" rows={4} maxLength={2000}
        value={values.message} disabled={mutation.isPending} error={error} aria-describedby={`reply-counter${error ? ' reply-content-error' : ''}`}
        placeholder="Nhập hướng dẫn hoặc kết quả xử lý cho học viên…" onChange={event => setValues(previous => ({ ...previous, message: event.target.value }))} />
      <div className={styles.replyOptions}>
        <Select id="detail-status" label="Trạng thái sau khi lưu" options={options(TICKET_STATUSES)} value={values.status} disabled={mutation.isPending} onChange={event => setValues(previous => ({ ...previous, status: event.target.value }))} />
        <Select id="detail-priority" label="Độ ưu tiên" options={options(TICKET_PRIORITIES)} value={values.priority} disabled={mutation.isPending} onChange={event => setValues(previous => ({ ...previous, priority: event.target.value }))} />
      </div>
      {mutation.isError && <p className={styles.saveError} role="alert">{conflict ? mutation.error.message : 'Không lưu được thay đổi. Kiểm tra quyền lưu dữ liệu của trình duyệt rồi thử lại.'}</p>}
      <div className={styles.dialogActions}><button className="btn btn-quiet" type="button" onClick={onClose} disabled={mutation.isPending}>Đóng</button><button className="btn btn-primary" type="submit" disabled={mutation.isPending || conflict}><Icon name="check" />{mutation.isPending ? 'Đang lưu…' : 'Lưu xử lý'}</button></div>
    </form>
  </Modal>;
}

export default function SupportIntake() {
  useSupportTicketSync();
  const { data: user } = useMe();
  const { toast } = useToast();
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const status = Object.hasOwn(TICKET_STATUSES, params.get('status')) ? params.get('status') : '';
  const [search, setSearch] = useState(''), [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS), [draft, setDraft] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false), [page, setPage] = useState(1), [selected, setSelected] = useState(null);
  const searchInput = useRef(null), categorySelect = useRef(null), filterButton = useRef(null), panel = useRef(null), trigger = useRef(null);
  const query = useQuery({
    queryKey: ['admin-support-tickets-demo', user?.id],
    queryFn: () => readAdminTickets(window.localStorage),
    enabled: !!user?.vaiTro?.includes('ADMIN'),
    staleTime: Infinity,
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
    { label: 'Tổng số phiếu', count: entries.length, note: 'Tất cả yêu cầu của học viên', tone: 'all' },
    { label: 'Đang mở', count: entries.filter(({ ticket }) => ticket.status === 'open').length, note: 'Cần theo dõi và phản hồi', tone: 'open' },
    { label: 'Ưu tiên cao', count: entries.filter(({ ticket }) => ticket.status === 'open' && ['high', 'critical'].includes(ticket.priority)).length, note: 'Phiếu đang mở cần chú ý', tone: 'urgent' },
    { label: 'Đã giải quyết', count: entries.filter(({ ticket }) => ticket.status === 'resolved').length, note: 'Yêu cầu đã được xử lý', tone: 'resolved' },
  ];
  return <div className={`page ${styles.page}`}>
    <p className={styles.demoNotice} role="note"><Icon name="info" />Bản trải nghiệm · Phiếu và phản hồi chỉ lưu trên trình duyệt, chưa gửi đến dịch vụ hỗ trợ.</p>
    <article className="sheet" aria-labelledby="support-page-title">
      <header className={styles.heading}><div><p className={styles.eyebrow}>Quản trị / Hỗ trợ học viên</p><h1 id="support-page-title">Tiếp nhận hỗ trợ</h1><p className="muted">Lắng nghe, phản hồi và giải quyết yêu cầu của học viên.</p></div>
        <button className="btn btn-secondary" type="button" disabled={query.isFetching} onClick={async () => { const result = await query.refetch(); if (!result.isError) toast('Đã làm mới danh sách phiếu hỗ trợ.', { variant: 'success' }); }}><Icon name="refresh" />{query.isFetching ? 'Đang tải…' : 'Làm mới'}</button>
      </header>
      <section className={styles.summary} aria-label="Tổng quan phiếu hỗ trợ">{summary.map(item => <article key={item.tone}><span>{item.label}</span><strong data-count-tone={item.tone}>{query.isPending ? '—' : item.count}</strong><small>{item.note}</small></article>)}</section>
      <div className={styles.toolbar}><div className={`input-with-icon ${styles.search}`}><Icon name="search" /><label className="sr-only" htmlFor="support-search">Tìm theo mã phiếu, nội dung, tên hoặc email học viên</label><input ref={searchInput} className="input" id="support-search" type="search" placeholder="Tìm mã phiếu, nội dung, email học viên…" autoComplete="off" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
        <button ref={filterButton} className="btn btn-secondary" type="button" aria-expanded={showFilters} aria-controls="support-filters" onClick={() => { setDraft(filters); setShowFilters(!showFilters); }}><Icon name="filter" />Bộ lọc{chips.length > 0 && <span className={styles.count}>{chips.length}</span>}</button>
      </div>
      {showFilters && <form className={styles.filters} id="support-filters" onSubmit={event => { event.preventDefault(); setFilters(draft); setPage(1); setShowFilters(false); filterButton.current?.focus(); }}>
        <Select ref={categorySelect} id="filter-category" label="Loại vấn đề" placeholder="Tất cả loại vấn đề" options={options(TICKET_CATEGORIES)} value={draft.category} onChange={event => setDraft(previous => ({ ...previous, category: event.target.value }))} />
        <Select id="filter-priority" label="Độ ưu tiên" placeholder="Tất cả độ ưu tiên" options={options(TICKET_PRIORITIES)} value={draft.priority} onChange={event => setDraft(previous => ({ ...previous, priority: event.target.value }))} />
        <Select id="filter-sort" label="Sắp xếp" options={options(SUPPORT_SORTS)} value={draft.sort} onChange={event => setDraft(previous => ({ ...previous, sort: event.target.value }))} /><button className="btn btn-primary" type="submit">Áp dụng</button>
      </form>}
      <div className={`tabs ${styles.tabs}`} role="tablist" aria-label="Trạng thái phiếu hỗ trợ">{tabs.map((tab, index) => <button key={tab.id} className="tab" type="button" id={`support-tab-${tab.id}`} role="tab" aria-controls="support-panel" aria-selected={status === tab.value} tabIndex={status === tab.value ? 0 : -1} onClick={() => setStatus(tab.value)} onKeyDown={event => selectTab(event, index)}>{tab.label}<span className={styles.count}>{tab.value ? withoutStatus.filter(({ ticket }) => ticket.status === tab.value).length : withoutStatus.length}</span></button>)}</div>
      {chips.length > 0 && <div className={styles.chips} aria-label="Bộ lọc đang áp dụng">{chips.map(chip => <button key={chip.key} className={styles.chip} type="button" aria-label={`Gỡ bộ lọc ${chip.label}`} onClick={() => removeFilter(chip.key)}><span>{chip.label}</span><Icon name="x" /></button>)}<button className="btn btn-quiet btn-sm" type="button" data-reset onClick={reset}>Đặt lại</button></div>}
      <div className={styles.listHeading}><p role="status" aria-live="polite">{query.isPending ? 'Đang tải phiếu hỗ trợ…' : `${matches.length} phiếu hỗ trợ`}</p><span>{SUPPORT_SORTS[filters.sort]}</span></div>
      <section ref={panel} id="support-panel" role="tabpanel" aria-labelledby={`support-tab-${status || 'all'}`} tabIndex={0} aria-busy={query.isPending}>
        {query.isError ? <div className={styles.empty} role="alert"><Icon name="alert" /><h2>Không tải được phiếu hỗ trợ</h2><button className="btn btn-secondary" type="button" onClick={() => query.refetch()}>Thử lại</button></div>
          : query.isPending ? <div className="skeleton" aria-hidden="true"><div className="sk sk-row" /></div>
            : matches.length > 0 ? <div className={styles.tableWrap}><table className={styles.table}><caption className="sr-only">Danh sách yêu cầu hỗ trợ của học viên</caption><thead><tr><th scope="col">Phiếu hỗ trợ</th><th scope="col">Học viên</th><th scope="col">Độ ưu tiên</th><th scope="col">Trạng thái</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead><tbody>
              {matches.slice(start, start + TICKETS_PAGE_SIZE).map(entry => <tr key={entry.key}>
                <td><button className={styles.ticketTitle} type="button" data-ticket={entry.key} onClick={event => { trigger.current = event.currentTarget; setSelected(entry); }}>{entry.ticket.title}</button><div className={styles.ticketMeta}><span>#{entry.ticket.id}</span><span>{TICKET_CATEGORIES[entry.ticket.category]}</span><time dateTime={entry.ticket.createdAt}>{date.format(new Date(entry.ticket.createdAt))}</time></div></td>
                <td><span className={styles.student}>{entry.owner.tenHienThi}</span><span className={styles.email}>{entry.owner.email || 'Chưa có email trong dữ liệu mẫu'}</span></td>
                <td><Badge priority={entry.ticket.priority} /></td><td><Badge status={entry.ticket.status} /></td>
                <td><button className="btn btn-quiet btn-icon" type="button" aria-label={`Xem phiếu ${entry.ticket.id} của ${entry.owner.tenHienThi}`} onClick={event => { trigger.current = event.currentTarget; setSelected(entry); }}><Icon name="eye" /></button></td>
              </tr>)}
            </tbody></table></div> : <div className={styles.empty}><Icon name="mail" /><h2>{chips.length ? 'Không tìm thấy phiếu hỗ trợ' : 'Chưa có phiếu hỗ trợ'}</h2><p>{chips.length ? 'Thử tìm từ khóa khác hoặc thay đổi bộ lọc.' : 'Các yêu cầu mới của học viên sẽ xuất hiện tại đây.'}</p>{chips.length > 0 && <button className="btn btn-secondary" type="button" data-reset onClick={reset}>Đặt lại bộ lọc</button>}</div>}
      </section>
      {matches.length > 0 && <div className={styles.pagination}><p>Hiển thị {start + 1}–{Math.min(start + TICKETS_PAGE_SIZE, matches.length)} trên {matches.length} phiếu</p><Pagination page={currentPage} totalPages={totalPages} onPageChange={next => { setPage(next); panel.current?.focus(); }} /></div>}
      <footer className={styles.footer}><Icon name="info" /><p>Phản hồi và trạng thái chỉ được lưu trong trình duyệt của bản trải nghiệm, không gửi email hay yêu cầu thật.</p></footer>
    </article>
    {selected && <TicketDetail key={selected.key} selected={selected} actor={user} onClose={closeDetail} onSaved={() => { closeDetail(); toast('Đã lưu xử lý phiếu hỗ trợ mẫu.', { variant: 'success' }); }} />}
  </div>;
}
