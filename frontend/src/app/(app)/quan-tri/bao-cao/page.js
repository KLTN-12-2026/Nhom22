'use client';
import { Fragment, Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Icon } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { apiFetch } from '@/lib/api-client';
import { relativeTime } from '@/lib/admin-dashboard.mjs';
import { handledId } from '@/lib/realtime.mjs';
import { useRealtimeEvent } from '@/hooks/useEventStream';
import { useCooldown } from '@/hooks/useCooldown';
import { SNAPSHOT_LABELS, snapshotEntries } from '@/lib/moderation-admin.mjs';
import {
  REASON_MAX, REPORT_REASON, REPORT_STATUS, REPORT_TABS, TARGET_TYPE, contentLink, listReports, reasonError,
  resolveReport,
} from '@/lib/admin-ops.mjs';

const fullTime = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');

function StatusPill({ status }) {
  const [label, tone] = REPORT_STATUS[status] || [status, 'mute'];
  return <span className={`adm-pill adm-pill-${tone}`}>{label}</span>;
}

function SnapshotValue({ value }) {
  if (value == null || value === '') return <span className="adm-muted">Chưa có</span>;
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.length ? <ol>{value.map((item, index) => <li key={index}><SnapshotValue value={item} /></li>)}</ol> : <span className="adm-muted">Không có mục nào</span>;
  if (typeof value === 'object') return <dl className="adm-kv">{Object.entries(value).map(([key, item]) => <Fragment key={key}><dt>{SNAPSHOT_LABELS[key] || key}</dt><dd><SnapshotValue value={item} /></dd></Fragment>)}</dl>;
  return String(value);
}

const DECISIONS = {
  content: [
    { value: 'GIU', title: 'Giữ nội dung', hint: 'Báo cáo không đúng, nội dung tiếp tục hiển thị.', button: 'Giữ nội dung', done: 'Đã giữ nội dung và đóng mọi báo cáo đang chờ về nội dung này.' },
    { value: 'AN', title: 'Ẩn nội dung', hint: 'Gỡ khỏi thư viện; chủ sở hữu vẫn thấy trạng thái đã ẩn.', button: 'Ẩn nội dung', danger: true, done: 'Đã ẩn nội dung và đóng mọi báo cáo đang chờ về nội dung này.' },
  ],
  user: [
    { value: 'GIU', title: 'Không vi phạm', hint: 'Giữ nguyên hồ sơ, đóng các báo cáo đang chờ.', button: 'Đóng báo cáo', done: 'Đã đóng mọi báo cáo đang chờ về người dùng này.' },
    { value: 'AN', title: 'Ẩn ảnh đại diện', hint: 'Ảnh bị báo cáo thay bằng ảnh mặc định ở mọi nơi; người dùng được báo và có thể tải ảnh khác.', button: 'Ẩn ảnh đại diện', danger: true, done: 'Đã ẩn ảnh đại diện và báo cho người dùng.' },
    { value: 'KHOA', title: 'Khóa tài khoản', hint: 'Đăng xuất mọi thiết bị, chặn đăng nhập, ẩn hồ sơ và bộ thẻ công khai. Người dùng nhận email kèm lý do. Mở khóa ở màn Tài khoản.', button: 'Khóa tài khoản', danger: true, done: 'Đã khóa tài khoản và gửi email cho người dùng.' },
  ],
};

function ResolveForm({ report, onDone }) {
  const client = useQueryClient();
  const options = DECISIONS[report.loaiDoiTuong === 'NGUOI_DUNG' ? 'user' : 'content'];
  const [quyetDinh, setQuyetDinh] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [touched, setTouched] = useState(false);
  const chosen = options.find(option => option.value === quyetDinh);
  const mutation = useMutation({
    mutationFn: () => resolveReport(apiFetch, report.id, { quyetDinh, lyDo }),
    onSuccess: result => {
      client.invalidateQueries({ queryKey: ['admin-reports'] });
      client.invalidateQueries({ queryKey: ['admin-dashboard'] });
      onDone(result, chosen?.done || 'Đã xử lý báo cáo.');
    },
    onError: error => {
      if (error.status === 409 || error.status === 404) client.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
  const reasonMsg = reasonError(lyDo);
  const serverField = mutation.error?.fieldErrors?.find(f => f.field === 'lyDo')?.message;
  const submit = event => {
    event.preventDefault();
    setTouched(true);
    if (!quyetDinh || reasonMsg) return;
    mutation.mutate();
  };
  return (
    <form id="resolve-form" onSubmit={submit} noValidate>
      <p className="adm-section-title">Quyết định</p>
      <fieldset className="adm-choice" aria-label="Quyết định xử lý">
        {options.map(option => (
          <label key={option.value}><input type="radio" name="quyetDinh" value={option.value} checked={quyetDinh === option.value} onChange={() => setQuyetDinh(option.value)} /><span><b>{option.title}</b><small>{option.hint}</small></span></label>
        ))}
      </fieldset>
      {touched && !quyetDinh && <p className="adm-error" role="alert">Chọn một quyết định.</p>}
      <label className="adm-label" htmlFor="resolve-reason" style={{ marginTop: 14 }}>Lý do xử lý</label>
      <textarea id="resolve-reason" className="adm-textarea" rows={4} maxLength={REASON_MAX + 50} value={lyDo} onChange={event => setLyDo(event.target.value)} aria-invalid={touched && !!(reasonMsg || serverField)} aria-describedby="resolve-reason-hint" placeholder={report.loaiDoiTuong === 'NGUOI_DUNG' ? 'Ví dụ: Ảnh đại diện có hình ảnh phản cảm.' : 'Ví dụ: Đã đối chiếu từ điển, nghĩa tiếng Việt đúng.'} />
      <p id="resolve-reason-hint" className={touched && (reasonMsg || serverField) ? 'adm-error' : 'adm-hint'}>
        {touched && (reasonMsg || serverField) ? (reasonMsg || serverField) : `${lyDo.trim().length}/${REASON_MAX} ký tự · lý do được ghi vào nhật ký quản trị${quyetDinh === 'KHOA' ? ' và gửi cho người dùng qua email' : ''}.`}
      </p>
      {mutation.isError && !serverField && (
        <p className="adm-notice adm-notice-bad" role="alert" style={{ marginTop: 12 }}><Icon name="alert" />{mutation.error.status === 409 ? 'Báo cáo này vừa được người khác xử lý. Danh sách đã được tải lại.' : mutation.error.message}</p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="submit" className={`adm-btn ${chosen?.danger ? 'adm-btn-danger' : 'adm-btn-primary'}`} disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu…' : chosen?.button || 'Xác nhận'}
        </button>
      </div>
    </form>
  );
}

function ReportDetail({ report, onDone }) {
  const rows = snapshotEntries(report.noiDung);
  const link = contentLink(report);
  return (
    <>
      <p className="adm-section-title">Báo cáo</p>
      <dl className="adm-kv">
        <dt>Trạng thái</dt><dd><StatusPill status={report.trangThai} /></dd>
        <dt>Loại nội dung</dt><dd>{TARGET_TYPE[report.loaiDoiTuong] || report.loaiDoiTuong} · #{report.doiTuongId}</dd>
        <dt>Lý do</dt><dd>{REPORT_REASON[report.lyDo] || report.lyDo}</dd>
        <dt>Người báo cáo</dt><dd>{report.nguoiBaoCao?.tenHienThi || '—'}</dd>
        <dt>Thời điểm</dt><dd>{fullTime(report.createdAt)}</dd>
      </dl>
      <p className="adm-section-title">Mô tả của người báo cáo</p>
      {report.moTa ? <p className="adm-quote">{report.moTa}</p> : <p className="adm-muted">Người báo cáo không ghi thêm mô tả.</p>}
      <p className="adm-section-title">Nội dung lúc bị báo cáo</p>
      {report.loaiDoiTuong === 'NGUOI_DUNG' && (report.anhDaiDienUrl
        ? <img src={report.anhDaiDienUrl} alt={`Ảnh đại diện lúc bị báo cáo của ${report.noiDung?.ten || 'người dùng'}`} width={96} height={96} style={{ display: 'block', objectFit: 'cover', borderRadius: 'var(--radius-control)', border: '1px solid var(--line)', margin: '0 0 8px' }} />
        : <p className="adm-muted">Không có ảnh đại diện lúc bị báo cáo.</p>)}
      <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{report.noiDung?.ten || '—'}</p>
      {rows.length ? <dl className="adm-kv">{rows.map(([key, value]) => <Fragment key={key}><dt>{SNAPSHOT_LABELS[key] || key}</dt><dd><SnapshotValue value={value} /></dd></Fragment>)}</dl> : <p className="adm-muted">Không có thêm trường nào.</p>}
      {link && <p style={{ margin: '10px 0 0' }}><Link className="adm-btn adm-btn-sm" href={link} target="_blank" rel="noopener"><Icon name="link" />{report.loaiDoiTuong === 'NGUOI_DUNG' ? 'Mở hồ sơ tài khoản' : 'Mở nội dung hiện tại'}</Link></p>}
      {report.trangThai === 'CHO_XU_LY' ? <ResolveForm key={report.id} report={report} onDone={onDone} /> : (
        <>
          <p className="adm-section-title">Kết quả xử lý</p>
          <dl className="adm-kv">
            <dt>Người xử lý</dt><dd>{report.nguoiXuLy?.tenHienThi || '—'}</dd>
            <dt>Thời điểm</dt><dd>{fullTime(report.xuLyAt)}</dd>
            <dt>Lý do</dt><dd>{report.lyDoXuLy || '—'}</dd>
          </dl>
        </>
      )}
    </>
  );
}

function ReportsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const trangThai = params.has('trangThai') ? params.get('trangThai') : 'CHO_XU_LY';
  const loaiDoiTuong = params.get('loai') || '';
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');

  const setQuery = changes => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => { if (value === null || value === undefined) next.delete(key); else next.set(key, value); });
    if (!('page' in changes)) next.delete('page');
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-reports', trangThai, loaiDoiTuong, page],
    queryFn: () => listReports(apiFetch, { trangThai, loaiDoiTuong, page }),
    placeholderData: previous => previous,
    refetchInterval: 30_000,
  });
  const pending = useQuery({
    queryKey: ['admin-reports', 'CHO_XU_LY', '', 'count'],
    queryFn: () => listReports(apiFetch, { trangThai: 'CHO_XU_LY', size: 1 }),
    staleTime: 30_000,
  });
  const items = data?.items || [];
  const [takenOver, setTakenOver] = useState('');

  useRealtimeEvent('MUC_DA_XU_LY', id => {
    const reportId = handledId(id, 'BAO_CAO');
    if (!reportId || !selected || String(selected.id) !== reportId || selected.trangThai !== 'CHO_XU_LY') return;
    setSelected(null);
    setTakenOver('Báo cáo bạn đang mở vừa được quản trị viên khác xử lý. Danh sách đã được tải lại.');
  });

  const done = (result, message) => {
    setSelected(result);
    setNotice(message);
  };

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1>Báo cáo vi phạm</h1>
          <p>Người học báo cáo bộ thẻ, thẻ, đầu ra AI hoặc người dùng khác. Xem bản chụp lúc bị báo cáo rồi quyết định giữ, ẩn hoặc khóa tài khoản; mỗi quyết định ghi vào nhật ký và báo cho người báo cáo.</p>
        </div>
        <div className="adm-head-actions">
          <button type="button" className="adm-btn" onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" />{isFetching ? 'Đang tải…' : 'Làm mới'}</button>
          <Link href="/quan-tri/nhat-ky" className="adm-btn"><Icon name="clock" />Nhật ký</Link>
        </div>
      </div>

      {notice && <p className="adm-notice adm-notice-ok" role="status"><Icon name="check" />{notice}</p>}
      {takenOver && <p className="adm-notice adm-notice-warn" role="alert"><Icon name="alert" />{takenOver}</p>}

      <section className="adm-card">
        <AdminTable
          caption="Báo cáo nội dung"
          rows={items}
          loading={isLoading}
          error={isError ? error : null}
          onRetry={refetch}
          onRowClick={report => { setNotice(''); setTakenOver(''); setSelected(report); }}
          rowLabel={report => `Báo cáo về ${report.noiDung?.ten || report.doiTuongId}`}
          toolbar={<>
            <div className="adm-seg" role="tablist" aria-label="Trạng thái báo cáo">
              {REPORT_TABS.map(tab => (
                <button key={tab.value || 'all'} type="button" role="tab" aria-selected={trangThai === tab.value} onClick={() => setQuery({ trangThai: tab.value })}>
                  {tab.label}{tab.value === 'CHO_XU_LY' && pending.data?.totalElements ? ` (${pending.data.totalElements})` : ''}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="report-type">Loại nội dung</label>
            <select id="report-type" className="adm-select" value={loaiDoiTuong} onChange={event => setQuery({ loai: event.target.value || null })}>
              <option value="">Mọi loại nội dung</option>
              {Object.entries(TARGET_TYPE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {trangThai === 'CHO_XU_LY' && <span className="adm-muted">cũ nhất trước</span>}
          </>}
          columns={[
            { key: 'content', header: 'Nội dung', sortValue: r => r.noiDung?.ten, render: r => <span style={{ display: 'block', minWidth: 200 }}><b style={{ fontWeight: 500 }}>{r.noiDung?.ten || `#${r.doiTuongId}`}</b><br /><span className="adm-muted">{TARGET_TYPE[r.loaiDoiTuong] || r.loaiDoiTuong}</span></span> },
            { key: 'reason', header: 'Lý do', sortValue: r => r.lyDo, render: r => <span style={{ display: 'block', minWidth: 200, maxWidth: 360 }}><span className="adm-pill adm-pill-mute">{REPORT_REASON[r.lyDo] || r.lyDo}</span><span className="adm-muted" style={{ marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.moTa}</span></span> },
            { key: 'reporter', header: 'Người báo cáo', sortValue: r => r.nguoiBaoCao?.tenHienThi, render: r => r.nguoiBaoCao?.tenHienThi || '—' },
            { key: 'time', header: 'Gửi lúc', nowrap: true, sortValue: r => Date.parse(r.createdAt), render: r => <span title={fullTime(r.createdAt)}>{relativeTime(r.createdAt)}</span> },
            { key: 'status', header: 'Trạng thái', sortValue: r => r.trangThai, render: r => <StatusPill status={r.trangThai} /> },
            { key: 'actions', header: 'Thao tác', srHeader: true, render: r => <div className="adm-row-actions"><button type="button" className={`adm-btn adm-btn-sm ${r.trangThai === 'CHO_XU_LY' ? 'adm-btn-primary' : ''}`} onClick={() => { setNotice(''); setTakenOver(''); setSelected(r); }}>{r.trangThai === 'CHO_XU_LY' ? 'Xem & xử lý' : 'Xem'}</button></div> },
          ]}
          emptyTitle={trangThai === 'CHO_XU_LY' ? 'Không còn báo cáo nào chờ xử lý' : 'Không có báo cáo phù hợp'}
          emptyText={trangThai === 'CHO_XU_LY' ? 'Hàng đợi đã sạch.' : 'Thử đổi bộ lọc.'}
          pagination={data ? { page, size: 20, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: value => setQuery({ page: value ? String(value) : null }) } : null}
        />
      </section>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.trangThai === 'CHO_XU_LY' ? 'Xử lý báo cáo' : 'Chi tiết báo cáo'}>
        {selected && <ReportDetail report={selected} onDone={done} />}
      </Drawer>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="adm-empty" role="status">Đang tải…</div>}>
      <ReportsContent />
    </Suspense>
  );
}
