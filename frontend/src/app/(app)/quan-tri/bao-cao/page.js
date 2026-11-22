'use client';

import { Fragment, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { REPORT_KINDS, REPORT_REASONS, REPORT_STATES, SNAPSHOT_LABELS, reportQuery, reportTitle, resolutionPayload, snapshotEntries } from '@/lib/moderation-admin.mjs';
import { useCooldown } from '@/hooks/useCooldown';
import { Button, ErrorState, Icon, Modal, Pagination, Select, Textarea } from '@/components/ui';
import styles from './page.module.css';

const queueKey = ['admin-reports'];
const options = labels => Object.entries(labels).map(([value, label]) => ({ value, label }));
const date = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

function ReportState({ state }) {
  const shown = REPORT_STATES[state];
  return <span className={`stamp ${shown?.style || 'stamp-quiet'}`}>{shown?.label || state}</span>;
}

function SnapshotValue({ value }) {
  if (value == null || value === '') return <span className="muted">Chưa có</span>;
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.length ? <ol className={styles.evidenceList}>{value.map((item, index) => <li key={index}><SnapshotValue value={item} /></li>)}</ol> : <span className="muted">Không có mục nào</span>;
  if (typeof value === 'object') return <dl className={styles.evidenceDetails}>{Object.entries(value).map(([key, item]) => <Fragment key={key}><dt>{SNAPSHOT_LABELS[key] || key}</dt><dd><SnapshotValue value={item} /></dd></Fragment>)}</dl>;
  return String(value);
}

export default function ReportsAdminPage() {
  const client = useQueryClient();
  const [state, setState] = useState('CHO_XU_LY');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('GIU');
  const [reason, setReason] = useState('');
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const queue = useQuery({
    queryKey: [...queueKey, state, kind, page],
    queryFn: () => apiFetch(`/api/v1/admin/reports?${reportQuery({ trangThai: state, loaiDoiTuong: kind, page })}`),
    staleTime: 0,
    refetchInterval: 30000,
  });
  const resolve = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/admin/reports/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
    retry: false,
    onSuccess: (_, { body }) => {
      setSelected(null);
      setMessage(body.quyetDinh === 'AN' ? 'Đã ẩn nội dung và ghi lý do xử lý.' : 'Đã giữ nội dung và ghi lý do xử lý.');
      for (const queryKey of [queueKey, ['admin-audit'], ['library-decks'], ['library-deck'], ['ai-history'], ['ai-request']]) {
        void client.invalidateQueries({ queryKey });
      }
    },
  });
  const cooldown = useCooldown(resolve.error);
  const conflict = resolve.error?.status === 409 || resolve.error?.status === 404;
  const pending = selected?.trangThai === 'CHO_XU_LY';
  const reports = queue.data?.items || [];
  const total = queue.data?.totalElements || 0;
  const orderNote = state === 'CHO_XU_LY' ? 'Báo cáo chờ xử lý, cũ trước' : 'Báo cáo nội dung, mới trước';

  const openReview = report => {
    setSelected(report); setDecision('GIU'); setReason(''); setFields({}); resolve.reset();
  };
  const reloadQueue = () => {
    setSelected(null); resolve.reset();
    void client.invalidateQueries({ queryKey: queueKey });
  };
  const submit = async event => {
    event.preventDefault();
    if (busy.current || resolve.isPending || !pending || conflict || cooldown) return;
    let body;
    try { body = resolutionPayload(decision, reason); }
    catch (error) {
      setFields({ [error.field]: error.message });
      event.currentTarget.elements.namedItem(error.field)?.focus();
      return;
    }
    busy.current = true;
    setFields({});
    try { await resolve.mutateAsync({ id: selected.id, body }); }
    catch (error) { setFields(Object.fromEntries((error.fieldErrors || []).map(({ field, message }) => [field, message]))); }
    finally { busy.current = false; }
  };

  return <div className={`page ${styles.page}`}>
    <article className="sheet" aria-labelledby="page-title">
      <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/quan-tri">Quản trị</Link><span aria-hidden="true">/</span><span aria-current="page">Hàng đợi báo cáo</span></nav>
      <div className="form-head">
        <div className="form-code"><span>Quản trị</span><span>Kiểm duyệt nội dung</span></div>
        <h1 id="page-title">Hàng đợi báo cáo</h1>
        <p>Xem bằng chứng, chọn quyết định và lưu lý do.</p>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select id="report-state" label="Trạng thái" value={state} options={[{ value: '', label: 'Tất cả' }, ...Object.entries(REPORT_STATES).map(([value, item]) => ({ value, label: item.label }))]} onChange={event => { setState(event.target.value); setPage(0); }} />
          <Select id="report-kind" label="Loại nội dung" value={kind} options={[{ value: '', label: 'Tất cả nội dung' }, ...options(REPORT_KINDS)]} onChange={event => { setKind(event.target.value); setPage(0); }} />
        </div>
        <Button variant="secondary" loading={queue.isFetching} onClick={() => queue.refetch()}><Icon name="refresh" />Làm mới</Button>
      </div>
      {message && <p className={`notice notice-success ${styles.message}`} role="status">{message}</p>}
      {queue.isPending ? <div className="skeleton" role="status" aria-label="Đang tải hàng đợi báo cáo"><div className="sk sk-row" /><div className="sk sk-row" /><div className="sk sk-row" /></div>
        : queue.isError ? <ErrorState title="Chưa tải được hàng đợi báo cáo" description={queue.error.message} onRetry={queue.refetch} />
        : reports.length === 0 ? <div className="empty"><Icon name="check" /><h2>Không có báo cáo ở trạng thái này</h2><p>{page > 0 ? 'Trang này không còn báo cáo. Quay về trang đầu để xem hàng đợi hiện tại.' : 'Các báo cáo phù hợp với bộ lọc sẽ hiển thị tại đây.'}</p>
          {page > 0 ? <Button variant="secondary" onClick={() => setPage(0)}>Về trang đầu</Button> : (state !== '' || kind !== '') && <Button variant="secondary" onClick={() => { setState(''); setKind(''); setPage(0); }}>Xem tất cả báo cáo</Button>}
        </div> : <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption><strong>{total.toLocaleString('vi-VN')} báo cáo</strong><span>{orderNote}</span></caption>
              <thead><tr><th scope="col">Nội dung</th><th scope="col">Lý do</th><th scope="col">Người báo cáo</th><th scope="col">Trạng thái</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead>
              <tbody>{reports.map(report => <tr key={report.id}>
                <td data-label="Nội dung"><div className={styles.target}><span className={styles.type}>{REPORT_KINDS[report.loaiDoiTuong] || report.loaiDoiTuong} #{report.doiTuongId}</span><strong>{reportTitle(report)}</strong><span className={styles.meta}>Báo cáo #{report.id}</span></div></td>
                <td data-label="Lý do">{REPORT_REASONS[report.lyDo] || report.lyDo}</td>
                <td data-label="Người báo cáo"><span>{report.nguoiBaoCao?.tenHienThi || 'Người dùng ẩn danh'}</span><time className={styles.meta} dateTime={report.createdAt}>{date(report.createdAt)}</time></td>
                <td data-label="Trạng thái"><ReportState state={report.trangThai} /></td>
                <td data-label="Thao tác"><Button variant="secondary" onClick={() => openReview(report)} aria-label={`${report.trangThai === 'CHO_XU_LY' ? 'Xử lý' : 'Xem'} báo cáo #${report.id}`}><Icon name={report.trangThai === 'CHO_XU_LY' ? 'edit' : 'eye'} />{report.trangThai === 'CHO_XU_LY' ? 'Xử lý' : 'Xem'}</Button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <Pagination className={styles.pager} page={page + 1} totalPages={queue.data.totalPages} onPageChange={value => setPage(value - 1)} />
        </>}
    </article>

    <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Báo cáo #${selected?.id || ''}`} loading={resolve.isPending} className={styles.reviewDialog}
      footer={<><Button variant="secondary" disabled={resolve.isPending} onClick={() => setSelected(null)}>{pending ? 'Hủy' : 'Đóng'}</Button>
        {pending && (conflict ? <Button onClick={reloadQueue}><Icon name="refresh" />Tải lại hàng đợi</Button> : <Button type="submit" form="resolve-report-form" variant={decision === 'AN' ? 'danger-solid' : 'primary'} loading={resolve.isPending} disabled={cooldown > 0}>{resolve.isPending ? 'Đang lưu…' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Lưu quyết định'}</Button>)}
      </>}>
      {selected && <div className={styles.reviewBody}>
        <div className={styles.reviewHeading}><span className={styles.type}>{REPORT_KINDS[selected.loaiDoiTuong]} #{selected.doiTuongId}</span><h3>{reportTitle(selected)}</h3><ReportState state={selected.trangThai} /></div>
        <section className={styles.evidence} aria-labelledby="evidence-title"><h3 id="evidence-title">Bản chụp lúc báo cáo</h3><p className="muted small">{date(selected.createdAt)} · Nội dung được lưu khi người học gửi báo cáo.</p>
          {snapshotEntries(selected.noiDung).length > 0 ? <dl className={styles.evidenceDetails}>{snapshotEntries(selected.noiDung).map(([key, value]) => <Fragment key={key}><dt>{SNAPSHOT_LABELS[key] || key}</dt><dd><SnapshotValue value={value} /></dd></Fragment>)}</dl> : <p className="muted">Không có thông tin bổ sung trong bản chụp.</p>}
        </section>
        <section className={styles.complaint} aria-labelledby="complaint-title"><h3 id="complaint-title">{REPORT_REASONS[selected.lyDo] || selected.lyDo}</h3><p>{selected.moTa}</p><p className="muted small">Người báo cáo: {selected.nguoiBaoCao?.tenHienThi || 'Người dùng ẩn danh'}</p></section>
        {pending ? <form id="resolve-report-form" className={styles.form} onSubmit={submit} noValidate>
          <fieldset className={styles.fields} disabled={resolve.isPending || conflict}>
            <Select id="decision" name="quyetDinh" label="Quyết định" required value={decision} error={fields.quyetDinh} options={[{ value: 'GIU', label: 'Giữ nội dung' }, { value: 'AN', label: 'Ẩn nội dung' }]} onChange={event => { setDecision(event.target.value); setFields(current => ({ ...current, quyetDinh: undefined })); }} />
            <Textarea id="resolve-reason" name="lyDo" label="Lý do quyết định" required value={reason} minLength={10} maxLength={500} error={fields.lyDo} onChange={event => { setReason(event.target.value); setFields(current => ({ ...current, lyDo: undefined })); }} />
          </fieldset>
          <p className="muted small">Nhập từ 10 đến 500 ký tự. Quyết định áp cho mọi báo cáo đang chờ của cùng nội dung và được ghi vào nhật ký thao tác.</p>
          {decision === 'AN' && <p className="notice notice-warning">Nội dung sẽ bị ẩn khỏi thư viện hoặc đầu ra AI tương ứng sau khi lưu.</p>}
          {resolve.error && <p className={`notice ${conflict ? 'notice-warning' : 'notice-danger'}`} role="alert">{conflict ? `${resolve.error.message} Tải lại hàng đợi để xem trạng thái hiện tại.` : resolve.error.message}</p>}
        </form> : <section className={styles.resolution} aria-labelledby="resolution-title"><h3 id="resolution-title">Kết quả xử lý</h3><p>{selected.lyDoXuLy || 'Chưa có lý do xử lý'}</p><p className="muted small">{selected.nguoiXuLy?.tenHienThi || 'Quản trị viên'} · {date(selected.xuLyAt)}</p></section>}
      </div>}
    </Modal>
  </div>;
}
