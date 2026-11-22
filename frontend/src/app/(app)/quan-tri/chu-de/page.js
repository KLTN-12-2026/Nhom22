'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, Modal, useToast } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { useAdminConfirm } from '@/components/admin/AdminConfirm';
import { apiFetch } from '@/lib/api-client';

const KINDS = {
  topics: { label: 'Chủ đề', one: 'chủ đề', max: 100, placeholder: 'Ví dụ: Y tế và sức khỏe', deleteHint: 'Chỉ xóa được khi không còn bộ thẻ nào dùng chủ đề này.' },
  tags: { label: 'Nhãn', one: 'nhãn', max: 50, placeholder: 'Ví dụ: Part 6', deleteHint: 'Chỉ xóa được khi không còn thẻ nào gắn nhãn này.' },
};
const PAGE_SIZE = 20;

function RenameForm({ kind, item, onClose, onSaved }) {
  const [name, setName] = useState(item.ten);
  const [moTa, setMoTa] = useState(item.moTa || '');
  const [fieldError, setFieldError] = useState('');
  const [conflict, setConflict] = useState(false);
  const save = useMutation({
    mutationFn: () => apiFetch(`/api/v1/admin/${kind}/${item.id}`, { method: 'PUT', body: JSON.stringify({ ten: name.trim(), version: item.version, ...(kind === 'topics' ? { moTa: moTa.trim() || null } : {}) }) }),
    onSuccess: onSaved,
    onError: err => {
      if (err.code === 'VERSION_CONFLICT' || (err.status === 409 && !err.fieldErrors?.length)) { setConflict(true); setFieldError(err.message); return; }
      setFieldError(err.fieldErrors?.find(f => f.field === 'ten')?.message || err.message);
    },
  });
  return (
    <form noValidate onSubmit={event => { event.preventDefault(); if (name.trim()) save.mutate(); }}>
      <label className="adm-label" htmlFor="rename-name">Tên</label>
      <input id="rename-name" className="adm-input" style={{ width: '100%' }} maxLength={KINDS[kind].max} value={name} onChange={event => setName(event.target.value)} autoFocus aria-invalid={!!fieldError} aria-describedby={fieldError ? 'rename-err' : undefined} disabled={conflict} />
      {kind === 'topics' && (
        <>
          <label className="adm-label" htmlFor="rename-desc" style={{ marginTop: 12 }}>Mô tả (không bắt buộc)</label>
          <textarea id="rename-desc" className="adm-textarea" rows={2} maxLength={500} value={moTa} onChange={event => setMoTa(event.target.value)} disabled={conflict} />
        </>
      )}
      {fieldError && <p id="rename-err" className="adm-error" role="alert">{fieldError}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="adm-btn" onClick={onClose}>{conflict ? 'Đóng và tải lại' : 'Hủy'}</button>
        {!conflict && <button type="submit" className="adm-btn adm-btn-primary" disabled={save.isPending || !name.trim()}>{save.isPending ? 'Đang lưu…' : 'Lưu'}</button>}
      </div>
    </form>
  );
}

export default function AdminTopicsPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const [kind, setKind] = useState('topics');
  const [page, setPage] = useState(0);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState(null);
  const K = KINDS[kind];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', kind, page],
    queryFn: () => apiFetch(`/api/v1/admin/${kind}?page=${page}&size=${PAGE_SIZE}`),
    placeholderData: previous => previous,
  });
  const invalidate = () => ['admin', 'topics', 'public-topics', 'public-tags', 'admin-topics'].forEach(key => client.invalidateQueries({ queryKey: key === 'admin' ? ['admin', kind] : [key] }));

  const add = useMutation({
    mutationFn: name => apiFetch(`/api/v1/admin/${kind}`, { method: 'POST', body: JSON.stringify({ ten: name }) }),
    onSuccess: () => { invalidate(); setNewName(''); setAddError(''); toast(`Đã thêm ${K.one}.`, { variant: 'success' }); },
    onError: err => setAddError(err.fieldErrors?.find(f => f.field === 'ten')?.message || err.message),
  });
  const remove = useMutation({
    mutationFn: id => apiFetch(`/api/v1/admin/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: () => { invalidate(); toast(`Đã xóa ${K.one}.`, { variant: 'success' }); },
    onError: err => toast(err.message, { variant: 'error' }),
  });

  async function askDelete(item) {
    const ok = await confirm({ title: `Xóa ${K.one}`, message: `Xóa “${item.ten}”? ${K.deleteHint}`, confirmLabel: 'Xóa', tone: 'danger' });
    if (ok) remove.mutate(item.id);
  }

  const switchKind = next => { setKind(next); setPage(0); setNewName(''); setAddError(''); };

  const columns = [
    { key: 'name', header: 'Tên', sortValue: x => x.ten, render: x => <span><b style={{ fontWeight: 500 }}>{x.ten}</b>{x.moTa && <><br /><span className="adm-muted">{x.moTa}</span></>}</span> },
    { key: 'id', header: 'Mã', align: 'right', sortValue: x => Number(x.id), render: x => `#${x.id}` },
    { key: 'actions', header: 'Thao tác', srHeader: true, render: x => (
      <div className="adm-row-actions">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => setEditing(x)}><Icon name="edit" />Sửa</button>
        <button type="button" className="adm-btn adm-btn-sm" disabled={remove.isPending} onClick={() => askDelete(x)} aria-label={`Xóa ${x.ten}`}><Icon name="trash" /></button>
      </div>
    ) },
  ];

  const toolbar = (
    <>
      <div className="adm-seg" role="tablist" aria-label="Danh mục">
        {Object.entries(KINDS).map(([value, k]) => <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => switchKind(value)}>{k.label}</button>)}
      </div>
      <form onSubmit={event => { event.preventDefault(); if (newName.trim()) add.mutate(newName.trim()); }} style={{ display: 'flex', gap: 8, flex: '1 1 320px', flexWrap: 'wrap' }}>
        <label className="sr-only" htmlFor="new-name">Tên {K.one} mới</label>
        <input id="new-name" className="adm-input" style={{ flex: '1 1 200px' }} maxLength={K.max} placeholder={K.placeholder} value={newName} onChange={event => { setNewName(event.target.value); setAddError(''); }} aria-invalid={!!addError} aria-describedby={addError ? 'new-name-err' : undefined} />
        <button type="submit" className="adm-btn adm-btn-primary" disabled={add.isPending || !newName.trim()}><Icon name="plus" />{add.isPending ? 'Đang thêm…' : `Thêm ${K.one}`}</button>
        {addError && <p id="new-name-err" className="adm-error" role="alert" style={{ flexBasis: '100%' }}>{addError}</p>}
      </form>
    </>
  );

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Chủ đề & nhãn"
        meta={data ? data.totalElements : null}
        description="Chủ đề dùng để lọc thư viện; nhãn gắn vào từng thẻ (ví dụ “Part 5”, “Cụm động từ”). Tên không trùng nhau, không phân biệt hoa thường và dấu."
      />
      <section className="adm-card">
        <AdminTable
          key={kind}
          caption={`Danh sách ${K.one}`}
          columns={columns}
          rows={data?.items || []}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          toolbar={toolbar}
          onRowClick={x => setEditing(x)}
          rowLabel={x => `Sửa ${x.ten}`}
          emptyTitle={`Chưa có ${K.one} nào`}
          emptyText="Thêm mục đầu tiên bằng ô phía trên."
          pagination={data ? { page, size: PAGE_SIZE, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: setPage } : null}
        />
      </section>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Sửa ${K.one}`}>
        {editing && <RenameForm key={`${editing.id}-${editing.version}`} kind={kind} item={editing} onClose={() => { setEditing(null); refetch(); }} onSaved={() => { invalidate(); setEditing(null); toast('Đã lưu.', { variant: 'success' }); }} />}
      </Modal>
      {dialog}
    </div>
  );
}
