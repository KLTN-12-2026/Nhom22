'use client';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon, Pagination } from '@/components/ui';

const MUC_DO = { THONG_TIN: 'Thông tin', QUAN_TRONG: 'Quan trọng' };

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const emptyForm = () => ({
  tieuDe: '', noiDung: '', mucDo: 'THONG_TIN', lienKet: '',
  batDauAt: toLocalInput(new Date().toISOString()), ketThucAt: '', hienThi: true, version: null
});

const statusOf = (a, now) => {
  if (!a.hienThi) return 'Đang ẩn';
  if (Date.parse(a.batDauAt) > now) return 'Chờ hiển thị';
  if (a.ketThucAt && Date.parse(a.ketThucAt) <= now) return 'Đã hết hạn';
  return 'Đang hiển thị';
};

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const dialogRef = useRef(null);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => { if (editing && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [editing]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'announcements', page],
    queryFn: () => apiFetch(`/api/v1/admin/announcements?page=${page}&size=20`)
  });
  const list = data?.items || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(id ? `/api/v1/admin/announcements/${id}` : '/api/v1/admin/announcements', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: (_, { id }) => {
      invalidate();
      setEditing(null);
      setNotice(id ? 'Đã lưu thông báo' : 'Đã tạo thông báo');
    },
    onError: (err) => {
      const fields = {};
      (err.data?.fieldErrors || err.fieldErrors || []).forEach((f) => { fields[f.field] = f.message; });
      setFieldErrors(fields);
      setFormError(Object.keys(fields).length ? '' : err.message || 'Chưa lưu được thông báo');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => { invalidate(); setNotice('Đã xóa thông báo'); },
    onError: (err) => setNotice(err.message || 'Chưa xóa được thông báo')
  });

  const open = (item) => {
    setFieldErrors({});
    setFormError('');
    setForm(item ? {
      tieuDe: item.tieuDe, noiDung: item.noiDung, mucDo: item.mucDo, lienKet: item.lienKet || '',
      batDauAt: toLocalInput(item.batDauAt), ketThucAt: toLocalInput(item.ketThucAt), hienThi: item.hienThi, version: item.version
    } : emptyForm());
    setEditing(item ? item.id : 'new');
  };

  const submit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      id: editing === 'new' ? null : editing,
      body: {
        tieuDe: form.tieuDe, noiDung: form.noiDung, mucDo: form.mucDo, lienKet: form.lienKet.trim() || null,
        batDauAt: fromLocalInput(form.batDauAt), ketThucAt: fromLocalInput(form.ketThucAt), hienThi: form.hienThi,
        version: form.version
      }
    });
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const err = (key) => fieldErrors[key] ? <p className="field-error" id={`${key}-error`}>{fieldErrors[key]}</p> : null;

  return (
    <>
      <div className="page page-grid with-side">
        <section className="sheet" aria-labelledby="page-title">
          <div className="form-head">
            <div className="form-code"><span>Quản trị</span><span>Thông báo hệ thống</span></div>
            <h1 id="page-title">Thông báo hệ thống</h1>
            <p>Thông báo đang hiệu lực hiện ở đầu trang “Hôm nay học gì?” của mọi người học.</p>
            {notice && <p className="notice notice-success" role="status">{notice}</p>}
          </div>

          <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
            <button type="button" className="btn btn-primary" onClick={() => open(null)}>
              <Icon name="plus" /><span>Tạo thông báo</span>
            </button>
          </div>

          <div data-view={isLoading ? 'loading' : isError ? 'error' : list.length === 0 ? 'empty' : 'ready'}>
            <div data-when="loading"><div className="skeleton"><div className="sk sk-row"></div><div className="sk sk-row"></div></div></div>
            <div data-when="ready">
              <div className="table-wrap">
                <table className="data-table admin-table">
                  <caption className="sr-only">Danh sách thông báo hệ thống</caption>
                  <thead>
                    <tr>
                      <th scope="col">Tiêu đề</th>
                      <th scope="col">Mức độ</th>
                      <th scope="col">Hiệu lực</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={a.id}>
                        <td style={{ overflowWrap: 'anywhere' }}>{a.tieuDe}</td>
                        <td>{MUC_DO[a.mucDo] || a.mucDo}</td>
                        <td className="small">{fmt(a.batDauAt)} → {a.ketThucAt ? fmt(a.ketThucAt) : 'không hạn'}</td>
                        <td>{statusOf(a, now)}</td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="btn btn-edit btn-sm" onClick={() => open(a)}><Icon name="edit" /> Sửa</button>
                            <button type="button" className="btn btn-danger btn-sm" disabled={deleteMutation.isPending}
                              onClick={() => { if (confirm(`Xóa thông báo “${a.tieuDe}”?`)) deleteMutation.mutate(a.id); }}>
                              <Icon name="trash" /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div data-when="empty"><div className="empty"><h2>Chưa có thông báo</h2><p>Tạo thông báo đầu tiên bằng nút phía trên.</p></div></div>
            <div data-when="error"><ErrorState description={error?.message} onRetry={refetch} /></div>
          </div>
          <Pagination page={page + 1} totalPages={data?.totalPages || 0} onPageChange={(n) => setPage(n - 1)} />
        </section>

        <aside className="side-col">
          <section className="panel" aria-labelledby="r-title">
            <h2 className="panel-title" id="r-title">Quy tắc</h2>
            <ul className="small muted" style={{ paddingLeft: '1.1rem', display: 'grid', gap: 'var(--space-2)' }}>
              <li>Người học thấy tối đa 5 thông báo đang hiệu lực; mức “Quan trọng” hiện trước.</li>
              <li>Người học có thể ẩn thông báo trên máy của mình.</li>
              <li>Liên kết chỉ nhận đường dẫn nội bộ, ví dụ /thanh-toan-goi.</li>
              <li>Mọi thao tác tạo, sửa, xóa được ghi vào nhật ký quản trị.</li>
            </ul>
          </section>
        </aside>
      </div>

      {editing && (
        <dialog ref={dialogRef} className="dialog" onCancel={() => setEditing(null)}>
          <form className="dialog-body" noValidate onSubmit={submit}>
            <div className="dialog-head"><h2>{editing === 'new' ? 'Tạo thông báo' : 'Sửa thông báo'}</h2></div>
            {formError && <p className="notice notice-danger" role="alert">{formError}</p>}
            <div className="field" data-invalid={fieldErrors.tieuDe ? '' : undefined}>
              <label className="field-label" htmlFor="tieuDe">Tiêu đề</label>
              <input className="input" id="tieuDe" maxLength={200} value={form.tieuDe} onChange={set('tieuDe')} aria-invalid={fieldErrors.tieuDe ? 'true' : undefined} autoFocus />
              {err('tieuDe')}
            </div>
            <div className="field" data-invalid={fieldErrors.noiDung ? '' : undefined}>
              <label className="field-label" htmlFor="noiDung">Nội dung</label>
              <textarea className="textarea" id="noiDung" rows={4} maxLength={2000} value={form.noiDung} onChange={set('noiDung')} aria-invalid={fieldErrors.noiDung ? 'true' : undefined} />
              {err('noiDung')}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="mucDo">Mức độ</label>
              <select className="select" id="mucDo" value={form.mucDo} onChange={set('mucDo')}>
                {Object.entries(MUC_DO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field" data-invalid={fieldErrors.lienKet ? '' : undefined}>
              <label className="field-label" htmlFor="lienKet">Liên kết (không bắt buộc)</label>
              <input className="input" id="lienKet" maxLength={300} placeholder="/thanh-toan-goi" value={form.lienKet} onChange={set('lienKet')} aria-invalid={fieldErrors.lienKet ? 'true' : undefined} />
              {err('lienKet')}
            </div>
            <div className="field" data-invalid={fieldErrors.batDauAt ? '' : undefined}>
              <label className="field-label" htmlFor="batDauAt">Bắt đầu hiển thị</label>
              <input className="input" type="datetime-local" id="batDauAt" value={form.batDauAt} onChange={set('batDauAt')} aria-invalid={fieldErrors.batDauAt ? 'true' : undefined} />
              {err('batDauAt')}
            </div>
            <div className="field" data-invalid={fieldErrors.ketThucAt ? '' : undefined}>
              <label className="field-label" htmlFor="ketThucAt">Kết thúc (bỏ trống nếu không hạn)</label>
              <input className="input" type="datetime-local" id="ketThucAt" value={form.ketThucAt} onChange={set('ketThucAt')} aria-invalid={fieldErrors.ketThucAt ? 'true' : undefined} />
              {err('ketThucAt')}
            </div>
            <label className="choice">
              <input type="checkbox" checked={form.hienThi} onChange={set('hienThi')} />
              <span className="bubble box" aria-hidden="true"><svg className="box-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
              <span className="choice-body"><span className="choice-title">Cho hiển thị</span></span>
            </label>
            <div className="dialog-actions">
              <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
