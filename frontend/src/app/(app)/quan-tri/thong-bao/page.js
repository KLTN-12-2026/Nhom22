'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, Modal, useToast } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill } from '@/components/admin/AdminPageHead';
import { useAdminConfirm } from '@/components/admin/AdminConfirm';
import { apiFetch } from '@/lib/api-client';

const MUC_DO = { THONG_TIN: ['Thông tin', 'acc'], QUAN_TRONG: ['Quan trọng', 'bad'] };
const STATE = { live: ['Đang hiển thị', 'ok'], scheduled: ['Chờ hiển thị', 'warn'], expired: ['Đã hết hạn', 'mute'], hidden: ['Đang ẩn', 'mute'] };
const PAGE_SIZE = 20;

const toLocalInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = value => (value ? new Date(value).toISOString() : null);
const fmt = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const emptyForm = () => ({ tieuDe: '', noiDung: '', mucDo: 'THONG_TIN', lienKet: '', batDauAt: toLocalInput(new Date().toISOString()), ketThucAt: '', hienThi: true, version: null });

function stateOf(item, now) {
  if (!item.hienThi) return 'hidden';
  if (Date.parse(item.batDauAt) > now) return 'scheduled';
  if (item.ketThucAt && Date.parse(item.ketThucAt) <= now) return 'expired';
  return 'live';
}

function AnnouncementForm({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(() => (editing === 'new' ? emptyForm() : {
    tieuDe: editing.tieuDe, noiDung: editing.noiDung, mucDo: editing.mucDo, lienKet: editing.lienKet || '',
    batDauAt: toLocalInput(editing.batDauAt), ketThucAt: toLocalInput(editing.ketThucAt), hienThi: editing.hienThi, version: editing.version,
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const save = useMutation({
    mutationFn: body => apiFetch(editing === 'new' ? '/api/v1/admin/announcements' : `/api/v1/admin/announcements/${editing.id}`, { method: editing === 'new' ? 'POST' : 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => onSaved(editing === 'new' ? 'Đã tạo thông báo.' : 'Đã lưu thông báo.'),
    onError: err => {
      const fields = {};
      (err.fieldErrors || []).forEach(f => { fields[f.field] = f.message; });
      setFieldErrors(fields);
      setFormError(Object.keys(fields).length ? '' : err.status === 409 ? 'Thông báo vừa được người khác sửa. Đóng và mở lại để lấy bản mới.' : err.message);
    },
  });
  const set = key => event => setForm(current => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const field = (key, label, input, span) => (
    <div className={span ? 'adm-span' : undefined}>
      <label className="adm-label" htmlFor={`ann-${key}`}>{label}</label>
      {input}
      {fieldErrors[key] && <p className="adm-error" id={`ann-${key}-err`}>{fieldErrors[key]}</p>}
    </div>
  );
  const invalid = key => (fieldErrors[key] ? { 'aria-invalid': true, 'aria-describedby': `ann-${key}-err` } : {});
  const submit = event => {
    event.preventDefault();
    save.mutate({
      tieuDe: form.tieuDe, noiDung: form.noiDung, mucDo: form.mucDo, lienKet: form.lienKet.trim() || null,
      batDauAt: fromLocalInput(form.batDauAt), ketThucAt: fromLocalInput(form.ketThucAt), hienThi: form.hienThi, version: form.version,
    });
  };
  return (
    <form onSubmit={submit} noValidate>
      {formError && <p className="adm-notice adm-notice-bad" role="alert" style={{ marginBottom: 12 }}><Icon name="alert" />{formError}</p>}
      <div className="adm-form-grid">
        {field('tieuDe', 'Tiêu đề', <input id="ann-tieuDe" className="adm-input" maxLength={200} value={form.tieuDe} onChange={set('tieuDe')} autoFocus {...invalid('tieuDe')} />, true)}
        {field('noiDung', 'Nội dung', <textarea id="ann-noiDung" className="adm-textarea" rows={4} maxLength={2000} value={form.noiDung} onChange={set('noiDung')} {...invalid('noiDung')} />, true)}
        {field('mucDo', 'Mức độ', <select id="ann-mucDo" className="adm-select" value={form.mucDo} onChange={set('mucDo')}>{Object.entries(MUC_DO).map(([k, [v]]) => <option key={k} value={k}>{v}</option>)}</select>)}
        {field('lienKet', 'Liên kết nội bộ (không bắt buộc)', <input id="ann-lienKet" className="adm-input" maxLength={300} placeholder="/thanh-toan-goi" value={form.lienKet} onChange={set('lienKet')} {...invalid('lienKet')} />)}
        {field('batDauAt', 'Bắt đầu hiển thị', <input id="ann-batDauAt" className="adm-input" type="datetime-local" value={form.batDauAt} onChange={set('batDauAt')} {...invalid('batDauAt')} />)}
        {field('ketThucAt', 'Kết thúc (trống = không hạn)', <input id="ann-ketThucAt" className="adm-input" type="datetime-local" value={form.ketThucAt} onChange={set('ketThucAt')} {...invalid('ketThucAt')} />)}
        <label className="adm-check adm-span"><input type="checkbox" checked={form.hienThi} onChange={set('hienThi')} />Cho hiển thị</label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="adm-btn" onClick={onClose}>Hủy</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu'}</button>
      </div>
    </form>
  );
}

export default function AdminAnnouncementsPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [now] = useState(() => Date.now());
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'announcements', page],
    queryFn: () => apiFetch(`/api/v1/admin/announcements?page=${page}&size=${PAGE_SIZE}`),
    placeholderData: previous => previous,
  });
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    client.invalidateQueries({ queryKey: ['announcements'] });
  };
  const remove = useMutation({
    mutationFn: id => apiFetch(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => { invalidate(); toast('Đã xóa thông báo.', { variant: 'success' }); },
    onError: err => toast(err.message, { variant: 'error' }),
  });

  async function askDelete(item) {
    const ok = await confirm({ title: 'Xóa thông báo', message: `Xóa “${item.tieuDe}”? Người học sẽ không còn thấy thông báo này.`, confirmLabel: 'Xóa', tone: 'danger' });
    if (ok) remove.mutate(item.id);
  }

  const columns = [
    { key: 'title', header: 'Tiêu đề', sortValue: a => a.tieuDe, render: a => <span style={{ display: 'block', maxWidth: 420 }}><b style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{a.tieuDe}</b><span className="adm-muted" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.noiDung}</span></span> },
    { key: 'level', header: 'Mức độ', sortValue: a => a.mucDo, render: a => { const [label, tone] = MUC_DO[a.mucDo] || [a.mucDo, 'mute']; return <Pill tone={tone}>{label}</Pill>; } },
    { key: 'range', header: 'Hiệu lực', nowrap: true, sortValue: a => Date.parse(a.batDauAt), render: a => <span className="adm-muted">{fmt(a.batDauAt)} → {a.ketThucAt ? fmt(a.ketThucAt) : 'không hạn'}</span> },
    { key: 'state', header: 'Trạng thái', sortValue: a => stateOf(a, now), render: a => { const [label, tone] = STATE[stateOf(a, now)]; return <Pill tone={tone}>{label}</Pill>; } },
    { key: 'actions', header: 'Thao tác', srHeader: true, render: a => (
      <div className="adm-row-actions">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => setEditing(a)}><Icon name="edit" />Sửa</button>
        <button type="button" className="adm-btn adm-btn-sm" disabled={remove.isPending} onClick={() => askDelete(a)} aria-label={`Xóa ${a.tieuDe}`}><Icon name="trash" /></button>
      </div>
    ) },
  ];

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Thông báo hệ thống"
        meta={data ? data.totalElements : null}
        description="Thông báo đang hiệu lực hiện ở đầu trang Hôm nay của mọi người học (tối đa 5, mức Quan trọng trước). Người học có thể ẩn trên máy của mình. Mọi thay đổi được ghi nhật ký."
        actions={<button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />Tạo thông báo</button>}
      />
      <section className="adm-card">
        <AdminTable
          caption="Danh sách thông báo hệ thống"
          columns={columns}
          rows={data?.items || []}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onRowClick={a => setEditing(a)}
          rowLabel={a => `Sửa ${a.tieuDe}`}
          emptyTitle="Chưa có thông báo"
          emptyText="Tạo thông báo đầu tiên bằng nút phía trên."
          pagination={data ? { page, size: PAGE_SIZE, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: setPage } : null}
        />
      </section>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Tạo thông báo' : 'Sửa thông báo'} size="lg">
        {editing && <AnnouncementForm key={editing === 'new' ? 'new' : `${editing.id}-${editing.version}`} editing={editing} onClose={() => setEditing(null)} onSaved={message => { invalidate(); setEditing(null); toast(message, { variant: 'success' }); }} />}
      </Modal>
      {dialog}
    </div>
  );
}
