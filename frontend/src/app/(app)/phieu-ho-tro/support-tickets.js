'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Icon, Input, Modal, Pagination, Select, Textarea, useToast } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import {
  TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, TICKETS_PAGE_SIZE,
  filterTickets, readTickets, saveTicket, validateTicket,
} from '@/lib/support-tickets.mjs';
import styles from './page.module.css';

const options = labels => Object.entries(labels).map(([value, label]) => ({ value, label }));
const tabs = [{ value: '', label: 'Tất cả', id: 'all' }, ...options(TICKET_STATUSES).map(tab => ({ ...tab, id: tab.value }))];
const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

function CreateTicketDialog({ onClose, onSave, saving, saveError }) {
  const [values, setValues] = useState({ title: '', description: '', category: 'technical', priority: 'medium' });
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const titleInput = useRef(null);
  useEffect(() => { titleInput.current?.focus(); }, []);
  function update(name, value) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (attempted || errors[name]) setErrors(validateTicket(next));
  }
  function submit(event) {
    event.preventDefault();
    if (saving) return;
    setAttempted(true);
    const nextErrors = validateTicket(values);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) event.currentTarget.elements.namedItem(firstError)?.focus();
    else onSave(values);
  }
  return <Modal isOpen onClose={onClose} loading={saving} title="Tạo phiếu hỗ trợ" className={styles.dialog}>
    <form className={styles.form} noValidate onSubmit={submit} aria-busy={saving}>
      <p className={styles.dialogDescription}>Chia sẻ vấn đề để chúng mình có thể giúp bạn.</p>
      <Input ref={titleInput} autoFocus name="title" label="Tiêu đề" required maxLength={150}
        placeholder="Nhập tiêu đề yêu cầu hỗ trợ" value={values.title} disabled={saving}
        onChange={event => update('title', event.target.value)}
        onBlur={() => setErrors(previous => ({ ...previous, title: validateTicket(values).title }))}
        error={errors.title} aria-describedby={`${errors.title ? 'ticket-title-error ' : ''}ticket-title-counter`} id="ticket-title" />
      <p className={`field-counter ${styles.counter}`} id="ticket-title-counter">{values.title.length}/150 ký tự</p>
      <Textarea name="description" label="Mô tả" required rows={5}
        placeholder="Mô tả vấn đề bạn gặp phải và các bước đã thực hiện…" value={values.description} disabled={saving}
        onChange={event => update('description', event.target.value)}
        onBlur={() => setErrors(previous => ({ ...previous, description: validateTicket(values).description }))}
        error={errors.description} />
      <div className={styles.formGrid}>
        <Select name="category" label="Loại vấn đề" options={options(TICKET_CATEGORIES)} value={values.category}
          disabled={saving} onChange={event => update('category', event.target.value)} />
        <Select name="priority" label="Độ ưu tiên" options={options(TICKET_PRIORITIES)} value={values.priority}
          disabled={saving} onChange={event => update('priority', event.target.value)} />
      </div>
      {saveError && <p className={styles.saveError} role="alert">Không lưu được phiếu hỗ trợ. Vui lòng cho phép lưu dữ liệu trong trình duyệt và thử lại.</p>}
      <div className={styles.dialogActions}>
        <button type="button" className="btn btn-quiet" disabled={saving} onClick={onClose}>Hủy</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Tạo phiếu hỗ trợ'}</button>
      </div>
    </form>
  </Modal>;
}

export default function SupportTickets() {
  const { data: user } = useMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = Object.hasOwn(TICKET_STATUSES, searchParams.get('status')) ? searchParams.get('status') : '';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', priority: '' });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const searchInput = useRef(null);
  const createButton = useRef(null);
  const filterButton = useRef(null);
  const categorySelect = useRef(null);
  const panel = useRef(null);
  const queryKey = ['support-tickets-demo', user?.id];
  const ticketsQuery = useQuery({
    queryKey,
    queryFn: () => readTickets({ getItem: key => window.localStorage.getItem(key) }, user.id),
    enabled: user?.id != null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const tickets = ticketsQuery.data || [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => { if (showFilters) categorySelect.current?.focus(); }, [showFilters]);

  function setStatus(value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('status', value);
    else params.delete('status');
    router.push(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false });
    setPage(1);
  }
  function resetFilters() {
    setSearch(''); setDebouncedSearch('');
    setFilters({ category: '', priority: '' }); setDraftFilters({ category: '', priority: '' });
    setStatus('');
  }
  function closeDialog() {
    setCreating(false);
    requestAnimationFrame(() => createButton.current?.focus());
  }
  const createTicket = useMutation({
    mutationFn: values => saveTicket(window.localStorage, user.id, values),
    onSuccess: updated => {
      queryClient.setQueryData(queryKey, updated);
      resetFilters(); setShowFilters(false); closeDialog();
      toast('Đã lưu phiếu hỗ trợ mẫu trên trình duyệt.', { variant: 'success' });
    },
  });
  const matchesWithoutStatus = filterTickets(tickets, { ...filters, search: debouncedSearch });
  const matches = matchesWithoutStatus.filter(ticket => !status || ticket.status === status);
  const totalPages = Math.ceil(matches.length / TICKETS_PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const start = (currentPage - 1) * TICKETS_PAGE_SIZE;
  const chips = [
    { key: 'search', label: debouncedSearch && `Tìm kiếm: ${debouncedSearch}` },
    { key: 'status', label: TICKET_STATUSES[status] },
    { key: 'category', label: TICKET_CATEGORIES[filters.category] },
    { key: 'priority', label: filters.priority && `Ưu tiên: ${TICKET_PRIORITIES[filters.priority]}` },
  ].filter(chip => chip.label);
  function removeFilter(key) {
    if (key === 'search') { setSearch(''); setDebouncedSearch(''); }
    else if (key === 'status') setStatus('');
    else {
      setFilters(previous => ({ ...previous, [key]: '' }));
      setDraftFilters(previous => ({ ...previous, [key]: '' }));
    }
    setPage(1); filterButton.current?.focus();
  }
  function selectTab(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next !== null) {
      event.preventDefault(); setStatus(tabs[next].value);
      event.currentTarget.parentElement.children[next].focus();
    }
  }

  return <div className={`page ${styles.page}`}>
    <p className={styles.demoNotice} role="note"><Icon name="info" />Bản trải nghiệm · Dữ liệu mẫu được lưu trên trình duyệt, chưa gửi đến đội ngũ hỗ trợ.</p>
    <article className="sheet" aria-labelledby="support-page-title">
      <header className={styles.heading}>
        <div><p className={styles.eyebrow}>Tài khoản / Hỗ trợ học viên</p>
          <h1 id="support-page-title">Phiếu hỗ trợ</h1><p className="muted">Quản lý và theo dõi các yêu cầu hỗ trợ</p>
        </div>
        <button ref={createButton} type="button" className="btn btn-primary" disabled={!ticketsQuery.data} onClick={() => { createTicket.reset(); setCreating(true); }}><Icon name="plus" />Tạo phiếu hỗ trợ</button>
      </header>
      <section className={styles.workspace} aria-label="Quản lý phiếu hỗ trợ">
        <div className={styles.toolbar}>
          <div className={`input-with-icon ${styles.search}`}><Icon name="search" />
            <label className="sr-only" htmlFor="ticket-search">Tìm kiếm theo tiêu đề hoặc mô tả</label>
            <input ref={searchInput} className="input" id="ticket-search" type="search" autoComplete="off" placeholder="Tìm theo tiêu đề hoặc mô tả…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
          </div>
          <button ref={filterButton} type="button" className="btn btn-secondary" aria-expanded={showFilters} aria-controls="ticket-filters"
            aria-label={chips.length ? `Lọc, ${chips.length} bộ lọc đang bật` : 'Lọc'}
            onClick={() => { setDraftFilters(filters); setShowFilters(!showFilters); }}>
            <Icon name="filter" />Lọc{chips.length > 0 && <span className={styles.filterCount}>{chips.length}</span>}
          </button>
        </div>
        {showFilters && <form id="ticket-filters" className={styles.filters} onSubmit={event => {
          event.preventDefault(); setFilters(draftFilters); setPage(1); setShowFilters(false); filterButton.current?.focus();
        }}>
          <Select ref={categorySelect} label="Loại vấn đề" placeholder="Tất cả loại vấn đề" options={options(TICKET_CATEGORIES)} value={draftFilters.category} onChange={event => setDraftFilters(previous => ({ ...previous, category: event.target.value }))} />
          <Select label="Độ ưu tiên" placeholder="Tất cả độ ưu tiên" options={options(TICKET_PRIORITIES)} value={draftFilters.priority} onChange={event => setDraftFilters(previous => ({ ...previous, priority: event.target.value }))} />
          <button type="submit" className="btn btn-primary">Áp dụng</button>
        </form>}
        <div className={`tabs ${styles.tabs}`} role="tablist" aria-label="Trạng thái phiếu hỗ trợ">
          {tabs.map((tab, index) => <button key={tab.id} type="button" className="tab" id={`tickets-tab-${tab.id}`} role="tab"
            aria-selected={status === tab.value} aria-controls="tickets-panel" tabIndex={status === tab.value ? 0 : -1}
            onClick={() => setStatus(tab.value)} onKeyDown={event => selectTab(event, index)}>
            {tab.label}<span className={styles.count}>{tab.value ? matchesWithoutStatus.filter(ticket => ticket.status === tab.value).length : matchesWithoutStatus.length}</span>
          </button>)}
        </div>
        {chips.length > 0 && <div className={styles.chips} aria-label="Bộ lọc đang áp dụng">
          {chips.map(chip => <button key={chip.key} type="button" className={styles.chip} aria-label={`Gỡ bộ lọc ${chip.label}`} onClick={() => removeFilter(chip.key)}><span>{chip.label}</span><Icon name="x" /></button>)}
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => { resetFilters(); searchInput.current?.focus(); }}>Đặt lại</button>
        </div>}
        <div className={styles.listHeading}><p role="status" aria-live="polite">{ticketsQuery.isPending ? 'Đang tải phiếu hỗ trợ…' : `${matches.length} phiếu hỗ trợ`}</p><span>Mới nhất trước</span></div>
        <div ref={panel} id="tickets-panel" role="tabpanel" aria-labelledby={`tickets-tab-${status || 'all'}`} tabIndex={0} aria-busy={ticketsQuery.isPending}>
          {ticketsQuery.isError ? <div className={styles.empty} role="alert"><Icon name="alert" /><h2>Không tải được phiếu hỗ trợ</h2><button type="button" className="btn btn-secondary" onClick={() => ticketsQuery.refetch()}>Thử lại</button></div>
            : ticketsQuery.isPending ? <div className="skeleton" aria-hidden="true"><div className="sk sk-row" /></div>
              : matches.length > 0 ? <ul className={styles.list} aria-label="Danh sách phiếu hỗ trợ">
                {matches.slice(start, start + TICKETS_PAGE_SIZE).map(ticket => <li key={ticket.id} className={styles.row}>
                  <div><h2>{ticket.title}</h2><p className={styles.description} title={ticket.description}>{ticket.description}</p>
                    <div className={styles.meta}><span className={styles.ticketId}>#{ticket.id}</span><span className={styles.category}><Icon name="tag" />{TICKET_CATEGORIES[ticket.category]}</span><span className={styles.priority} data-priority={ticket.priority}>{TICKET_PRIORITIES[ticket.priority]}</span></div>
                  </div>
                  <div className={styles.side}><span className={styles.status} data-state={ticket.status}><Icon name={ticket.status === 'resolved' ? 'check' : 'clock'} />{TICKET_STATUSES[ticket.status]}</span><time dateTime={ticket.createdAt} title={dateTimeFormat.format(new Date(ticket.createdAt))}>{dateFormat.format(new Date(ticket.createdAt))}</time></div>
                </li>)}
              </ul> : <div className={styles.empty}>
                <span className={styles.emptyIcon}><Icon name="search" /></span>
                <h2>{chips.length ? 'Không tìm thấy' : 'Chưa có phiếu hỗ trợ'}</h2>
                <p>{chips.length ? 'Thử thay đổi bộ lọc' : 'Tạo phiếu đầu tiên để chia sẻ vấn đề bạn gặp phải.'}</p>
                <button type="button" className="btn btn-secondary" onClick={() => { if (chips.length) { resetFilters(); searchInput.current?.focus(); } else { createTicket.reset(); setCreating(true); } }}>{chips.length ? 'Đặt lại' : 'Tạo phiếu hỗ trợ'}</button>
              </div>}
        </div>
        {matches.length > 0 && <div className={styles.pagination}>
          <p>Hiển thị {start + 1}–{Math.min(start + TICKETS_PAGE_SIZE, matches.length)} trên {matches.length} phiếu</p>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={next => { setPage(next); panel.current?.focus(); }} />
        </div>}
      </section>
      <footer className={styles.footer}><Icon name="info" /><p>Bạn cần giúp đỡ? Tạo phiếu để đội ngũ hỗ trợ theo dõi và xử lý yêu cầu của bạn.</p></footer>
    </article>
    {creating && <CreateTicketDialog onClose={closeDialog} onSave={createTicket.mutate} saving={createTicket.isPending} saveError={createTicket.error} />}
  </div>;
}
