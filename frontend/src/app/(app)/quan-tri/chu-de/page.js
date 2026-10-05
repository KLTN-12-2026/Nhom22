'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

export default function AdminTopicsPage() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState('topics'); // 'topics' or 'tags'
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // For renaming topics
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', kind],
    queryFn: () => apiFetch(`/api/v1/admin/${kind}`)
  });

  const list = data || [];

  const addMutation = useMutation({
    mutationFn: (name) => apiFetch(`/api/v1/admin/${kind}`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', kind]);
      setNameInput('');
      setErrorMsg('');
      alert(kind === 'topics' ? 'Đã thêm chủ đề' : 'Đã thêm nhãn');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Lỗi thêm mới');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/admin/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', kind]);
      alert('Đã xóa');
    },
    onError: (err) => {
      alert(err.message || 'Lỗi khi xóa');
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => apiFetch(`/api/v1/admin/topics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'topics']);
      setRenamingId(null);
      alert('Đã lưu tên');
    },
    onError: (err) => {
      alert(err.message || 'Lỗi đổi tên');
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    addMutation.mutate(nameInput);
  };

  const handleDelete = (item) => {
    const msg = kind === "topics" 
      ? `Xóa “${item.name}”? Chủ đề sẽ biến khỏi bộ lọc thư viện.` 
      : `Xóa “${item.name}”? Nhãn sẽ được gỡ khỏi mọi thẻ đang gắn.`;
    if (confirm(msg)) {
      deleteMutation.mutate(item.id);
    }
  };

  const openRename = (item) => {
    setRenamingId(item.id);
    setNewName(item.name);
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    renameMutation.mutate({ id: renamingId, name: newName });
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
            <p>Chủ đề dùng để lọc thư viện. Nhãn gắn vào từng thẻ, ví dụ “Part 5” hay “Cụm động từ”.</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Danh mục">
            <button 
              className="tab" 
              role="tab" 
              aria-selected={kind === 'topics'} 
              onClick={() => { setKind('topics'); setErrorMsg(''); }}
            >
              Chủ đề
            </button>
            <button 
              className="tab" 
              role="tab" 
              aria-selected={kind === 'tags'} 
              onClick={() => { setKind('tags'); setErrorMsg(''); }}
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
                maxLength="90" 
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
                        <td className={styles.name}>{item.name}</td>
                        <td>{kind === 'topics' ? item.deckCount : item.cardCount}</td>
                        <td>
                          {kind === 'topics' && (
                            <button type="button" className="btn btn-quiet btn-sm" onClick={() => openRename(item)}>
                              <Icon name="edit" /> Đổi tên
                            </button>
                          )}
                          <button type="button" className="btn btn-quiet btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(item)}>
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
              <div className="notice notice-error">Lỗi khi tải dữ liệu</div>
            </div>
          </div>
        </section>

        <aside className="side-col">
          <section className="panel" aria-labelledby="r-title">
            <h2 className="panel-title" id="r-title">Quy tắc</h2>
            <ul className="small muted" style={{ paddingLeft: '1.1rem', display: 'grid', gap: 'var(--space-2)' }}>
              <li>Tên không trùng nhau, không phân biệt hoa thường và dấu.</li>
              <li>Chỉ xóa được chủ đề khi không còn bộ thẻ nào dùng.</li>
              <li>Xóa nhãn sẽ gỡ nhãn khỏi mọi thẻ đang gắn.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Rename Dialog */}
      {renamingId && (
        <dialog className="dialog" open>
          <form className="dialog-body" noValidate onSubmit={handleRename}>
            <div className="dialog-head">
              <h2 id="rn-title">Đổi tên chủ đề</h2>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rn">Tên mới</label>
              <input 
                className="input" 
                id="rn" 
                name="name" 
                maxLength="90" 
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
