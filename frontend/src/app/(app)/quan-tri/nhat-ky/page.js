'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill } from '@/components/admin/AdminPageHead';
import { apiFetch } from '@/lib/api-client';
import { ACTION_LABEL, ACTION_TONE, relativeTime } from '@/lib/admin-dashboard.mjs';
import { fetchAllPages, setParams } from '@/lib/admin-table.mjs';

const KIND = {
  NGUOI_DUNG: 'Tài khoản', BO_THE: 'Bộ thẻ', THE_TU_VUNG: 'Thẻ', GOI_DICH_VU: 'Gói dịch vụ', DANG_KY_GOI: 'Gói người dùng',
  YEU_CAU_AI: 'Đầu ra AI', HAN_MUC_DICH_VU: 'Hạn mức dịch vụ', THONG_BAO_HE_THONG: 'Thông báo hệ thống',
};
const FIELD = { trangThai: 'Trạng thái', vaiTro: 'Vai trò', quyenTruyCap: 'Xuất bản', trangThaiKiemDuyet: 'Kiểm duyệt', ten: 'Tên', moTa: 'Mô tả', mucTieu: 'Mục tiêu', chuDeId: 'Chủ đề', trinhDo: 'Trình độ', tu: 'Từ', nghiaVi: 'Nghĩa', tuLoai: 'Từ loại', phienAm: 'Phiên âm', viDuEn: 'Ví dụ', dichVi: 'Dịch ví dụ', soLuotNgay: 'Số lượt/ngày', hetHanAt: 'Hết hạn', giaThang: 'Giá tháng', giaNam: 'Giá năm', tieuDe: 'Tiêu đề', noiDung: 'Nội dung', hienThi: 'Hiển thị' };
const VALUE = { HOAT_DONG: 'Đang hoạt động', BI_KHOA: 'Bị khóa', CHUA_XAC_THUC: 'Chưa xác thực', DANG_XOA: 'Đang xóa', ADMIN: 'Quản trị viên', USER: 'Người học', CONG_KHAI: 'Công khai', RIENG_TU: 'Riêng tư', BINH_THUONG: 'Bình thường', DA_AN: 'Đã ẩn', GIAO_TIEP: 'Giao tiếp', MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao', CHO_DUYET: 'Chờ duyệt', DA_DUYET: 'Đã duyệt', TU_CHOI: 'Từ chối', THU_HOI: 'Thu hồi' };
const PAGE_SIZE = 20;
const cap = text => (text ? text[0].toUpperCase() + text.slice(1) : text);
const actionText = code => cap(ACTION_LABEL[code] || String(code).toLowerCase().replaceAll('_', ' '));
const fullTime = iso => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });

function show(value) {
  if (value === null || value === undefined || value === '') return <span className="adm-muted">(trống)</span>;
  if (Array.isArray(value)) return value.map(x => VALUE[x] || x).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return VALUE[value] || String(value);
}

function targetLink(target) {
  if (!target) return null;
  if (target.loai === 'NGUOI_DUNG' && target.ten) return `/quan-tri/tai-khoan?q=${encodeURIComponent(target.ten)}`;
  if (target.loai === 'BO_THE' && target.id) return `/quan-tri/bo-mau?id=${target.id}`;
  if (target.loai === 'HAN_MUC_DICH_VU') return '/quan-tri/dich-vu';
  if (target.loai === 'THONG_BAO_HE_THONG') return '/quan-tri/thong-bao';
  if (target.loai === 'GOI_DICH_VU' || target.loai === 'DANG_KY_GOI') return '/quan-tri/thanh-toan';
  return null;
}

function Diff({ log }) {
  const keys = [...new Set(Object.keys(log.truoc || {}).concat(Object.keys(log.sau || {})))];
  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 10 }}>
      {log.lyDo && <p className="adm-quote"><b>Lý do:</b> {log.lyDo}</p>}
      {keys.length > 0 && (
        <table className="adm-diff">
          <thead><tr><th>Trường</th><th>Trước</th><th>Sau</th></tr></thead>
          <tbody>{keys.map(key => <tr key={key}><td>{FIELD[key] || key}</td><td>{show(log.truoc?.[key])}</td><td>{show(log.sau?.[key])}</td></tr>)}</tbody>
        </table>
      )}
      <p className="adm-muted" style={{ margin: 0 }}>Mã nhật ký #{log.id} · {fullTime(log.createdAt)}</p>
    </div>
  );
}

function auditUrl({ q, hanhDong, loai, tuNgay, denNgay, page, size }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (q) params.set('q', q);
  if (hanhDong) params.set('hanhDong', hanhDong);
  if (loai) params.set('loai', loai);
  if (tuNgay) params.set('tuNgay', tuNgay);
  if (denNgay) params.set('denNgay', denNgay);
  return `/api/v1/admin/audit-logs?${params}`;
}

function AuditContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = {
    q: params.get('q') || '',
    hanhDong: params.get('hanhDong') || '',
    loai: params.get('loai') || '',
    tuNgay: params.get('tuNgay') || '',
    denNgay: params.get('denNgay') || '',
  };
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const [search, setSearch] = useState(filters.q);
  const go = changes => router.replace(`${pathname}${setParams(params, changes)}`, { scroll: false });
  const badRange = filters.tuNgay && filters.denNgay && filters.tuNgay > filters.denNgay;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit', filters, page],
    queryFn: () => apiFetch(auditUrl({ ...filters, page, size: PAGE_SIZE })),
    placeholderData: previous => previous,
    enabled: !badRange,
  });

  const columns = [
    { key: 'time', header: 'Thời gian', nowrap: true, sortValue: l => Date.parse(l.createdAt), csv: l => fullTime(l.createdAt), render: l => <span title={fullTime(l.createdAt)}>{relativeTime(l.createdAt)}</span> },
    { key: 'actor', header: 'Người thực hiện', sortValue: l => l.nguoiThucHien?.tenHienThi, csv: l => l.nguoiThucHien?.tenHienThi || 'Hệ thống', render: l => l.nguoiThucHien?.tenHienThi || <span className="adm-muted">Hệ thống</span> },
    { key: 'action', header: 'Hành động', sortValue: l => actionText(l.hanhDong), csv: l => actionText(l.hanhDong), render: l => <Pill tone={ACTION_TONE[l.hanhDong] || 'acc'}>{actionText(l.hanhDong)}</Pill> },
    { key: 'target', header: 'Đối tượng', csv: l => `${KIND[l.doiTuong?.loai] || l.doiTuong?.loai || ''}: ${l.doiTuong?.ten || ''}`, render: l => {
      const link = targetLink(l.doiTuong);
      const name = l.doiTuong?.ten || (l.doiTuong?.id ? `#${l.doiTuong.id}` : '(không rõ)');
      return <span style={{ display: 'block', maxWidth: 340 }}><span className="adm-muted">{KIND[l.doiTuong?.loai] || l.doiTuong?.loai}</span><br />{link ? <Link className="adm-a" href={link}>{name}</Link> : name}</span>;
    } },
    { key: 'reason', header: 'Lý do', csv: l => l.lyDo || '', render: l => (l.lyDo ? <span className="adm-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 320 }}>{l.lyDo}</span> : <span className="adm-muted">—</span>) },
    { key: 'before', header: 'Trước', hidden: true, csv: l => (l.truoc ? JSON.stringify(l.truoc) : '') },
    { key: 'after', header: 'Sau', hidden: true, csv: l => (l.sau ? JSON.stringify(l.sau) : '') },
  ];

  const toolbar = (
    <>
      <form role="search" onSubmit={event => { event.preventDefault(); go({ q: search.trim() }); }} style={{ display: 'contents' }}>
        <label className="sr-only" htmlFor="audit-q">Tìm theo người làm, đối tượng hoặc lý do</label>
        <input id="audit-q" className="adm-input" type="search" placeholder="Người làm, đối tượng, lý do… Enter" value={search} onChange={event => setSearch(event.target.value)} />
      </form>
      <label className="sr-only" htmlFor="audit-action">Hành động</label>
      <select id="audit-action" className="adm-select" value={filters.hanhDong} onChange={event => go({ hanhDong: event.target.value })}>
        <option value="">Mọi hành động</option>
        {Object.keys(ACTION_LABEL).map(code => <option key={code} value={code}>{actionText(code)}</option>)}
      </select>
      <label className="sr-only" htmlFor="audit-kind">Đối tượng</label>
      <select id="audit-kind" className="adm-select" value={filters.loai} onChange={event => go({ loai: event.target.value })}>
        <option value="">Mọi đối tượng</option>
        {Object.entries(KIND).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="adm-muted" htmlFor="audit-from">Từ</label>
      <input id="audit-from" className="adm-input" type="date" value={filters.tuNgay} onChange={event => go({ tuNgay: event.target.value })} aria-invalid={!!badRange} />
      <label className="adm-muted" htmlFor="audit-to">đến</label>
      <input id="audit-to" className="adm-input" type="date" value={filters.denNgay} onChange={event => go({ denNgay: event.target.value })} aria-invalid={!!badRange} />
      {Object.values(filters).some(Boolean) && <button type="button" className="adm-btn" onClick={() => { setSearch(''); router.replace(pathname, { scroll: false }); }}>Xóa lọc</button>}
    </>
  );

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Nhật ký thao tác"
        meta={data ? data.totalElements.toLocaleString('vi-VN') : null}
        description="Ai làm gì, trên đối tượng nào, vì sao, giá trị trước và sau. Nhật ký chỉ đọc. Bấm mũi tên ở đầu dòng để xem thay đổi chi tiết."
        actions={<button type="button" className="adm-btn" onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" />{isFetching ? 'Đang tải…' : 'Làm mới'}</button>}
      />
      {badRange && <p className="adm-notice adm-notice-bad" role="alert"><Icon name="alert" />Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>}
      <section className="adm-card">
        <AdminTable
          caption="Nhật ký thao tác quản trị"
          columns={columns.filter(c => !c.hidden)}
          rows={badRange ? [] : data?.items || []}
          loading={isLoading && !badRange}
          error={error}
          onRetry={refetch}
          toolbar={toolbar}
          expand={log => <Diff log={log} />}
          emptyTitle="Không có thao tác phù hợp"
          emptyText="Đổi bộ lọc hoặc khoảng ngày."
          pagination={data && !badRange ? { page, size: PAGE_SIZE, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: value => go({ page: value || null }) } : null}
          exportCsv={{ filename: 'nhat-ky-quan-tri.csv', columns, fetchAll: () => fetchAllPages((p, size) => apiFetch(auditUrl({ ...filters, page: p, size }))) }}
        />
      </section>
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<div className="adm-empty" role="status">Đang tải…</div>}>
      <AuditContent />
    </Suspense>
  );
}
