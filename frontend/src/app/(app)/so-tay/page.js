'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const GROUPS = [
  { id: '', name: 'Tất cả', key: 'TAT_CA' },
  { id: 'NGHIA', name: 'Nghĩa' },
  { id: 'CHINH_TA', name: 'Chính tả' },
  { id: 'NGHE', name: 'Nghe' },
  { id: 'NGU_CANH', name: 'Dùng từ trong câu' },
  { id: 'CAP_NHAM', name: 'Cặp dễ nhầm' },
  { id: 'QUEN_NHIEU', name: 'Quên nhiều' },
  { id: 'DANH_DAU', name: 'Tự đánh dấu' }
];

const REASON = {
  QUEN_NHIEU: 'Quên nhiều lần',
  SAI_CHINH_TA: 'Sai chính tả lặp lại',
  CAP_DE_NHAM: 'Hay nhầm với từ khác',
  DANH_DAU_THU_CONG: 'Bạn tự đánh dấu'
};

const ERROR_GROUP = {
  NGHIA: 'Nghĩa',
  CHINH_TA: 'Chính tả',
  NGHE: 'Nghe',
  NGU_CANH: 'Ngữ cảnh',
  CAP_NHAM: 'Cặp dễ nhầm'
};

const MIX = {
  HINH_THUC_GAN_GIONG: 'Viết gần giống',
  NGHIA_GAN_NHAU: 'Nghĩa gần nhau'
};

function NotebookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const page = parseInt(searchParams.get('page') || '0', 10);
  const nhomLoi = searchParams.get('nhomLoi') || '';

  const [editingNote, setEditingNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  const { data: notebook, isLoading: nbLoading } = useQuery({
    queryKey: ['notebook', page, nhomLoi],
    queryFn: () => apiFetch(\`/api/v1/notebook?page=\${page}&size=20\${nhomLoi ? \`&nhomLoi=\${nhomLoi}\` : ''}\`)
  });

  const { data: pairs, isLoading: pairsLoading } = useQuery({
    queryKey: ['confusing-pairs'],
    queryFn: () => apiFetch('/api/v1/learning/confusing-pairs')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(\`/api/v1/notebook/\${id}\`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notebook']);
      setEditingNote(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(\`/api/v1/notebook/\${id}\`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(['notebook'])
  });

  const practiceMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => router.push(\`/luyen-tap-lam-bai?id=\${res.id}\`)
  });

  const handleTabClick = (groupId) => {
    const params = new URLSearchParams(searchParams);
    if (groupId) params.set('nhomLoi', groupId);
    else params.delete('nhomLoi');
    params.set('page', '0');
    router.push(\`/so-tay?\${params.toString()}\`, { scroll: false });
  };

  const saveNote = (id) => {
    updateMutation.mutate({ id, body: { ghiChu: noteContent } });
  };

  const toggleMark = (it) => {
    updateMutation.mutate({ id: it.theId, body: { danhDauThuCong: !it.danhDauThuCong } });
  };

  const removeEntry = (id) => {
    if (window.confirm('Bỏ khỏi sổ tay? Lịch sử ôn và bài luyện vẫn giữ nguyên.')) {
      deleteMutation.mutate(id);
    }
  };

  const startPracticeNotebook = () => {
    practiceMutation.mutate({ loaiBai: 'TONG_HOP', nguon: 'SO_TAY', soCau: 10 });
  };

  const startPracticePairs = (id1, id2) => {
    practiceMutation.mutate({ loaiBai: 'PHAN_BIET_CAP', theIds: [id1, id2], soCau: 5 });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Sổ tay từ khó</span>
            <span>{notebook?.tongHop?.TAT_CA || 0} từ</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Sổ tay từ khó</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Từ tự vào sổ khi bạn làm sai trong bài luyện, quên nhiều lần khi ôn hoặc hay nhầm với từ khác.</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          {GROUPS.map(g => {
            const count = notebook?.tongHop?.[g.key || g.id] || 0;
            const active = nhomLoi === g.id;
            return (
              <button 
                key={g.id} 
                onClick={() => handleTabClick(g.id)}
                style={{ padding: '6px 12px', border: active ? 'none' : '1px solid var(--color-border)', background: active ? 'var(--color-primary)' : 'transparent', color: active ? 'white' : 'inherit', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {g.name} {count > 0 && <span style={{ opacity: 0.8, fontSize: '0.9em', marginLeft: '4px' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            {notebook?.totalElements || 0} từ {nhomLoi && \`trong nhóm \${GROUPS.find(g => g.id === nhomLoi)?.name.toLowerCase()}\`}
          </div>
          <Button variant="primary" onClick={startPracticeNotebook} disabled={!notebook?.tongHop?.TAT_CA || practiceMutation.isPending}>
            Luyện các từ trong sổ
          </Button>
        </div>

        {nbLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
        ) : notebook?.items?.length > 0 ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
            {notebook.items.map((it, i) => (
              <li key={it.theId} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{page * notebook.size + i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                    <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-word)' }}>{it.tu}</strong>
                    {it.phienAm && <span style={{ color: 'var(--color-ink-2)' }}>{it.phienAm}</span>}
                    {it.tuLoai && <span style={{ color: 'var(--color-primary)' }}>{it.tuLoai}</span>}
                  </div>
                  
                  <div style={{ marginBottom: 'var(--space-2)' }}>{it.nghiaVi}</div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {it.lyDo?.map(r => (
                      <span key={r} style={{ padding: '2px 8px', background: r === 'DANH_DAU_THU_CONG' ? 'var(--color-border)' : 'var(--color-danger-bg)', color: r === 'DANH_DAU_THU_CONG' ? 'inherit' : 'var(--color-danger-text)', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>
                        {REASON[r]}
                      </span>
                    ))}
                    {it.nhomLoi?.map(g => (
                      <span key={g.nhomLoi} style={{ padding: '2px 8px', background: 'var(--color-border)', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>
                        {ERROR_GROUP[g.nhomLoi] || g.nhomLoi} &times; {g.soLan}
                      </span>
                    ))}
                  </div>
                  
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-3)' }}>
                    <Link href={\`/bo-the/\${it.boTheId}\`} style={{ color: 'var(--color-primary-strong)' }}>{it.boTheTen}</Link>
                    {it.soLanQuen > 0 && <span style={{ marginLeft: '12px' }}>Quên {it.soLanQuen} lần khi ôn</span>}
                    {it.lanGanNhatAt && <span style={{ marginLeft: '12px' }}>Cập nhật {new Date(it.lanGanNhatAt).toLocaleDateString('vi-VN')}</span>}
                  </div>

                  {it.ghiChu && editingNote !== it.theId && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-tint)', borderLeft: '4px solid var(--color-primary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', whiteSpace: 'pre-line' }}>
                      {it.ghiChu}
                    </div>
                  )}

                  {editingNote === it.theId && (
                    <div style={{ marginBottom: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}>
                      <textarea 
                        value={noteContent} 
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Ghi chú..." 
                        rows={3} 
                        style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                        maxLength={500}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="primary" size="sm" onClick={() => saveNote(it.theId)} disabled={updateMutation.isPending}>Lưu</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>Huỷ</Button>
                      </div>
                    </div>
                  )}

                  {it.bangChung?.length > 0 && (
                    <details style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-3)' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-primary)' }}>Lần sai gần nhất ({it.bangChung.length})</summary>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {it.bangChung.map((b, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {ERROR_GROUP[b.nhomLoi]}: bạn trả lời <del style={{ color: 'var(--color-danger)' }}>{b.traLoi || '(trống)'}</del>, đáp án <strong>{b.dapAn}</strong>.
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Button variant="ghost" size="sm"><Icon name="play" size={14} /> Nghe</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingNote(it.theId); setNoteContent(it.ghiChu || ''); }}>{it.ghiChu ? 'Sửa ghi chú' : 'Thêm ghi chú'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleMark(it)} disabled={updateMutation.isPending}>{it.danhDauThuCong ? 'Bỏ đánh dấu' : 'Đánh dấu'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(it.theId)} disabled={deleteMutation.isPending}>Bỏ khỏi sổ</Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>{nhomLoi ? 'Không có từ nào trong nhóm này' : 'Sổ tay đang trống'}</h2>
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>
              {nhomLoi ? 'Chọn Tất cả để xem mọi từ.' : 'Từ sẽ vào sổ khi bạn làm sai trong bài luyện hoặc quên nhiều lần khi ôn.'}
            </p>
            {!nhomLoi && <Button variant="primary" onClick={() => router.push('/luyen-tap')}>Làm một bài luyện</Button>}
          </div>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Cặp dễ nhầm</h2>
          {pairsLoading ? (
            <div>Đang tải...</div>
          ) : pairs?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
              {pairs.map((pr, i) => (
                <li key={i} style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>{pr.the1.tu}</strong>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{pr.the1.nghiaVi}</span>
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>/</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>{pr.the2.tu}</strong>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{pr.the2.nghiaVi}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', display: 'flex', gap: '12px', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 'bold' }}>{MIX[pr.loaiNham] || 'Dễ nhầm'}</span>
                    <span>Nhầm {pr.soLan} lần</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => startPracticePairs(pr.the1.id, pr.the2.id)}>Luyện phân biệt</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Chưa có cặp nào. Cặp được ghi lại khi bạn chọn nhầm giữa hai từ trong bài luyện.</p>
          )}
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Khi nào từ vào sổ?</h2>
          <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0 }}>
            <li>Làm sai trong bài luyện.</li>
            <li>Quên từ 3 lần trở lên khi ôn.</li>
            <li>Chọn nhầm với một từ khác trong bài luyện.</li>
            <li>Bạn tự đánh dấu khi học.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function NotebookPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <NotebookContent />
    </Suspense>
  );
}
