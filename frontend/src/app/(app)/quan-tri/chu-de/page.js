'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Pagination, Icon } from '@/components/ui';
import styles from './page.module.css';

export default function AdminTopicsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const dialogRef = useRef(null);
  const [kind, setKind] = useState('topics'); // 'topics' or 'tags'
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // For renaming topics
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => { if (renamingId && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [renamingId]);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', kind, page],
    queryFn: () => apiFetch(`/api/v1/admin/${kind}?page=${page}&size=20`)
  });

  const list = data?.items || [];

  const addMutation = useMutation({
    mutationFn: (name) => apiFetch(`/api/v1/admin/${kind}`, {
      method: 'POST',
      body: JSON.stringify({ ten: name })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-tags'] });
      setNameInput('');
      setErrorMsg('');
      setSuccessMsg(kind === 'topics' ? 'Đã thêm chủ đề' : 'Đã thêm nhãn');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi thêm mới');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/admin/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-tags'] });
      setSuccessMsg('Đã xóa');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi khi xóa');
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name, version }) => apiFetch(`/api/v1/admin/${kind}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ten: name, version, ...(kind === 'topics' ? { moTa: list.find(item => item.id === id)?.moTa } : {}) })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-topics'] });
      queryClient.invalidateQueries({ queryKey: ['public-tags'] });
      setRenamingId(null);
      setSuccessMsg('Đã lưu tên');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi đổi tên');
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    addMutation.mutate(nameInput);
  };

  const handleDelete = (item) => {
    const msg = kind === "topics"
      ? `Xóa “${item.ten}”? Chủ đề sẽ biến khỏi bộ lọc thư viện.`
      : `Xóa “${item.ten}”? Chỉ xóa được nhãn khi không còn thẻ sử dụng.`;
    if (confirm(msg)) {
      deleteMutation.mutate(item.id);
    }
  };

  const openRename = (item) => {
    setRenamingId(item.id);
    setNewName(item.ten);
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    renameMutation.mutate({ id: renamingId, name: newName, version: list.find(item => item.id === renamingId)?.version });
  };

  const LABEL = {
    topics: ["Tên chủ đề mới", "Thêm chủ đề", "Số bộ thẻ", "Ví dụ: Y tế và sức khỏe", "Danh sách chủ đề"],
    tags: ["Tên nhãn mới", "Thêm nhãn", "Số thẻ", "Ví dụ: Part 6", "Danh sách nhãn"]
  };
  const L = LABEL[kind];

  return (
    <>
      <div className="page page-grid with-side">
        <section className="sheet" aria-labelledby="page-title">
          <div className="form-head">
            <div className="form-code"><span>Quản trị</span><span>Danh mục nội dung</span></div>
            <h1 id="page-title">Chủ đề và nhãn</h1>
            {successMsg && <p className="notice notice-success" role="status">{successMsg}</p>}
            {errorMsg && <p className="notice notice-error" role="alert">{errorMsg}</p>}
            {renameMutation.error?.status === 409 && <button type="button" className="btn btn-secondary" onClick={() => { setRenamingId(null); refetch(); }}>Tải lại danh mục</button>}
            <p>Chủ đề dùng để lọc thư viện. Nhãn gắn vào từng thẻ, ví dụ “Part 5” hay “Cụm động từ”.</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Danh mục">
            <button
              className="tab"
              role="tab"
              aria-selected={kind === 'topics'}
              onClick={() => { setKind('topics'); setPage(0); setRenamingId(null); setErrorMsg(''); }}
            >
              Chủ đề
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={kind === 'tags'}
              onClick={() => { setKind('tags'); setPage(0); setRenamingId(null); setErrorMsg(''); }}
            >
              Nhãn
            </button>
          </div>

          <form className={styles.addForm} id="add" noValidate onSubmit={handleAdd}>
            <div className="field" style={{ flex: '1 1 260px' }}>
              <label className="field-label" htmlFor="name">{L[0]}</label>
              <input
                className="input"
                id="name"
                name="name"
                maxLength={kind === 'topics' ? 100 : 50}
                autoComplete="off"
                placeholder={L[3]}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
              />
              <p className="field-error" style={{ display: errorMsg ? 'block' : 'none' }}>{errorMsg}</p>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addMutation.isPending}
              style={{ marginTop: '26px' }}
            >
              <Icon name={kind === 'topics' ? 'folder' : 'tag'} />
              <span>{addMutation.isPending ? 'Đang thêm...' : L[1]}</span>
            </button>
          </form>

          <div data-view={isLoading ? 'loading' : isError ? 'error' : list.length === 0 ? 'empty' : 'ready'}>
            <div data-when="loading">
              <div className="skeleton">
                <div className="sk sk-row"></div>
                <div className="sk sk-row"></div>
              </div>
            </div>

            <div data-when="ready">
              <div className="table-wrap">
                <table className={`data-table ${styles.adminTable}`}>
                  <caption className="sr-only">{L[4]}</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '3rem' }}>Số</th>
                      <th scope="col">Tên</th>
                      <th scope="col">{L[2]}</th>
                      <th scope="col"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item, i) => (
                      <tr key={item.id}>
                        <td className="num">{i + 1}</td>
                        <td className={styles.name}>{item.ten}</td>
                        <td>{'—'}</td>
                        <td>
                          {(
                            <button type="button" className="btn btn-edit btn-sm" disabled={renameMutation.isPending || deleteMutation.isPending} onClick={() => openRename(item)}>
                              <Icon name="edit" /> Đổi tên
                            </button>
                          )}
                          <button type="button" className="btn btn-danger btn-sm" disabled={renameMutation.isPending || deleteMutation.isPending} onClick={() => handleDelete(item)}>
                            <Icon name="trash" /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div data-when="empty">
              <div className="empty">
                <h2>Chưa có mục nào</h2>
                <p>Thêm mục đầu tiên bằng ô phía trên.</p>
              </div>
            </div>

            <div data-when="error">
              <ErrorState description={error?.message} onRetry={refetch} />
            </div>
          </div>
          <Pagination page={page + 1} totalPages={data?.totalPages || 0} onPageChange={n => setPage(n - 1)} />
        </section>

        <aside className="side-col">
          <section className="panel" aria-labelledby="r-title">
            <h2 className="panel-title" id="r-title">Quy tắc</h2>
            <ul className="small muted" style={{ paddingLeft: '1.1rem', display: 'grid', gap: 'var(--space-2)' }}>
              <li>Tên không trùng nhau, không phân biệt hoa thường và dấu.</li>
              <li>Chỉ xóa được chủ đề khi không còn bộ thẻ nào dùng.</li>
              <li>Chỉ xóa được nhãn khi không còn thẻ nào dùng.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Rename Dialog */}
      {renamingId && (
        <dialog ref={dialogRef} className="dialog" onCancel={() => setRenamingId(null)}>
          <form className="dialog-body" noValidate onSubmit={handleRename}>
            <div className="dialog-head">
              <h2 id="rn-title">{kind === 'topics' ? 'Đổi tên chủ đề' : 'Đổi tên nhãn'}</h2>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rn">Tên mới</label>
              <input
                className="input"
                id="rn"
                name="name"
                maxLength={kind === 'topics' ? 100 : 50}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-quiet" onClick={() => setRenamingId(null)}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={renameMutation.isPending}>
                {renameMutation.isPending ? 'Đang lưu...' : 'Lưu tên'}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
