'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, Modal, useToast } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill } from '@/components/admin/AdminPageHead';
import { useAdminConfirm } from '@/components/admin/AdminConfirm';
import { apiFetch } from '@/lib/api-client';

const EMPTY = { giaoDienMa: '', ngayLe: '', soNgayTruoc: 10, soNgaySau: 3 };
const vnDate = value => value ? value.split('-').reverse().join('/') : '';

function EventForm({ item, festivals, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { giaoDienMa: item.giaoDienMa, ngayLe: item.ngayLe, soNgayTruoc: item.soNgayTruoc, soNgaySau: item.soNgaySau } : { ...EMPTY, giaoDienMa: festivals[0]?.ma || '' });
  const [errorText, setErrorText] = useState('');
  const save = useMutation({
    mutationFn: body => apiFetch(item ? `/api/v1/admin/theme-events/${item.id}` : '/api/v1/admin/theme-events', { method: item ? 'PUT' : 'POST', body: JSON.stringify(body) }),
    onSuccess: onSaved,
    onError: err => setErrorText(err.message),
  });
  const set = key => event => { setErrorText(''); setForm(prev => ({ ...prev, [key]: event.target.value })); };
  return (
    <form noValidate onSubmit={event => { event.preventDefault(); if (form.ngayLe) save.mutate({ ...form, soNgayTruoc: Number(form.soNgayTruoc), soNgaySau: Number(form.soNgaySau) }); }}>
      <label className="adm-label" htmlFor="ev-theme">Giao diện lễ hội</label>
      <select id="ev-theme" className="adm-input" style={{ width: '100%' }} value={form.giaoDienMa} onChange={set('giaoDienMa')} disabled={!!item}>
        {festivals.map(theme => <option key={theme.ma} value={theme.ma}>{theme.ten}</option>)}
      </select>
      <label className="adm-label" htmlFor="ev-date" style={{ marginTop: 12 }}>Ngày lễ (dương lịch)</label>
      <input id="ev-date" type="date" className="adm-input" style={{ width: '100%' }} value={form.ngayLe} onChange={set('ngayLe')} required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div><label className="adm-label" htmlFor="ev-before">Mở trước (ngày)</label><input id="ev-before" type="number" min="0" max="60" className="adm-input" style={{ width: '100%' }} value={form.soNgayTruoc} onChange={set('soNgayTruoc')} /></div>
        <div><label className="adm-label" htmlFor="ev-after">Giữ sau (ngày)</label><input id="ev-after" type="number" min="0" max="30" className="adm-input" style={{ width: '100%' }} value={form.soNgaySau} onChange={set('soNgaySau')} /></div>
      </div>
      {errorText && <p className="adm-error" role="alert">{errorText}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="adm-btn" onClick={onClose}>Hủy</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={save.isPending || !form.ngayLe || !form.giaoDienMa}>{save.isPending ? 'Đang lưu…' : 'Lưu'}</button>
      </div>
    </form>
  );
}

export default function AdminThemeEventsPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const [editing, setEditing] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin-theme-events'], queryFn: () => apiFetch('/api/v1/admin/theme-events') });
  const { data: catalog } = useQuery({ queryKey: ['themes'], queryFn: () => apiFetch('/api/v1/me/themes') });
  const festivals = (catalog?.danhSach || []).filter(theme => theme.nhom === 'LE_HOI');
  const nameOf = ma => festivals.find(theme => theme.ma === ma)?.ten || ma;
  const refresh = () => { client.invalidateQueries({ queryKey: ['admin-theme-events'] }); client.invalidateQueries({ queryKey: ['themes'] }); };

  const remove = useMutation({
    mutationFn: id => apiFetch(`/api/v1/admin/theme-events/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refresh(); toast('Đã xóa lịch lễ.', { variant: 'success' }); },
    onError: err => toast(err.message, { variant: 'error' }),
  });
  async function askDelete(item) {
    const ok = await confirm({ title: 'Xóa lịch lễ', message: `Xóa lịch “${nameOf(item.giaoDienMa)}” ngày ${vnDate(item.ngayLe)}? Người dùng Free/Pro sẽ không được mở giao diện này vào dịp đó.`, confirmLabel: 'Xóa', tone: 'danger' });
    if (ok) remove.mutate(item.id);
  }

  const columns = [
    { key: 'theme', header: 'Giao diện', sortValue: x => nameOf(x.giaoDienMa), render: x => <b style={{ fontWeight: 500 }}>{nameOf(x.giaoDienMa)}</b> },
    { key: 'day', header: 'Ngày lễ', sortValue: x => x.ngayLe, render: x => vnDate(x.ngayLe) },
    { key: 'window', header: 'Mở cho mọi người', render: x => `${vnDate(x.moTu)} → ${vnDate(x.denHet)}` },
    { key: 'state', header: 'Trạng thái', render: x => x.dangMo ? <Pill tone="ok">Đang mở</Pill> : <Pill>{x.denHet < new Date().toISOString().slice(0, 10) ? 'Đã qua' : 'Sắp tới'}</Pill> },
    { key: 'actions', header: 'Thao tác', srHeader: true, render: x => (
      <div className="adm-row-actions">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => setEditing(x)}><Icon name="edit" />Sửa</button>
        <button type="button" className="adm-btn adm-btn-sm" disabled={remove.isPending} onClick={() => askDelete(x)} aria-label={`Xóa lịch ${nameOf(x.giaoDienMa)}`}><Icon name="trash" /></button>
      </div>
    ) },
  ];

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Lịch giao diện lễ hội"
        meta={data ? data.length : null}
        description="Mỗi dịp lễ, giao diện tương ứng mở cho mọi gói trong khoảng ngày bên dưới. Premium luôn dùng được mọi giao diện. Tết và Trung Thu theo âm lịch nên cần thêm ngày dương lịch cho từng năm."
        actions={<button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing('new')} disabled={!festivals.length}><Icon name="plus" />Thêm lịch lễ</button>}
      />
      <section className="adm-card">
        <AdminTable caption="Lịch lễ" columns={columns} rows={data || []} loading={isLoading} error={error} onRetry={refetch} onRowClick={x => setEditing(x)} rowLabel={x => `Sửa ${nameOf(x.giaoDienMa)}`} emptyTitle="Chưa có lịch lễ" emptyText="Thêm ngày lễ để mở giao diện cho mọi người." />
      </section>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Thêm lịch lễ' : 'Sửa lịch lễ'}>
        {editing && <EventForm item={editing === 'new' ? null : editing} festivals={festivals} onClose={() => setEditing(null)} onSaved={() => { refresh(); setEditing(null); toast('Đã lưu lịch lễ.', { variant: 'success' }); }} />}
      </Modal>
      {dialog}
    </div>
  );
}
