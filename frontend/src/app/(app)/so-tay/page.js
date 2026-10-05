'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

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
    queryFn: () => apiFetch(`/api/v1/notebook?page=${page}&size=20${nhomLoi ? `&nhomLoi=${nhomLoi}` : ''}`)
  });

  const { data: pairs, isLoading: pairsLoading } = useQuery({
    queryKey: ['confusing-pairs'],
    queryFn: () => apiFetch('/api/v1/learning/confusing-pairs')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/notebook/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook'] });
      setEditingNote(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/notebook/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebook'] })
  });

  const practiceMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => router.push(`/luyen-tap-lam-bai?id=${res.id}`)
  });

  const handleTabClick = (groupId) => {
    const params = new URLSearchParams(searchParams);
    if (groupId) params.set('nhomLoi', groupId);
    else params.delete('nhomLoi');
    params.set('page', '0');
    router.push(`/so-tay?${params.toString()}`, { scroll: false });
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

  const totalCount = notebook?.tongHop?.TAT_CA || 0;
  const anyItems = totalCount > 0;

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Sổ tay từ khó</span>
            <span id="total">{totalCount > 0 ? `${totalCount} từ` : '—'}</span>
          </div>
          <h1 id="page-title">Sổ tay từ khó</h1>
          <p>Từ tự vào sổ khi bạn làm sai trong bài luyện, quên nhiều lần khi ôn hoặc hay nhầm với từ khác. Bạn cũng có thể tự đánh dấu và ghi chú.</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Lọc theo nhóm lỗi" id="tabs">
          {GROUPS.map(g => {
            const count = notebook?.tongHop?.[g.key || g.id] || 0;
            const active = nhomLoi === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className="tab"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabClick(g.id)}
              >
                {g.name} <span className="count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.toolbarRow}>
          <p className="small muted" id="filter-note" aria-live="polite"></p>
          <button type="button" className="btn btn-accent btn-lg" id="practice" onClick={startPracticeNotebook} disabled={!totalCount || practiceMutation.isPending}>
            Luyện các từ trong sổ tay
          </button>
        </div>

        <div data-view={nbLoading ? "loading" : (notebook?.items?.length > 0 ? "ready" : "empty")} id="region" aria-live="polite">
          <div data-when="loading">
            <div className="skeleton">
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>
          <div data-when="ready">
            <ol className="answer-list" id="list" role="list">
              {notebook?.items?.map((it, i) => (
                <li key={it.theId} className={`answer-row ${styles.nbRow}`}>
                  <span className="answer-no">{page * (notebook?.size || 20) + i + 1}</span>
                  <div className="answer-main">
                    <div className={styles.nbWord}>
                      <strong lang="en">{it.tu}</strong>
                      {it.phienAm && <span className={styles.nbIpa}>{it.phienAm}</span>}
                      {it.tuLoai && <span className="small muted">{it.tuLoai}</span>}
                    </div>

                    <div className={styles.nbMean}>{it.nghiaVi}</div>

                    <div className={styles.nbStamps}>
                      {it.lyDo?.map(r => (
                        <span key={r} className={`stamp${r === 'DANH_DAU_THU_CONG' ? '' : ' stamp-warning'}`}>
                          {REASON[r]}
                        </span>
                      ))}
                      {it.nhomLoi?.map(g => (
                        <span key={g.nhomLoi} className="stamp stamp-quiet">
                          {ERROR_GROUP[g.nhomLoi] || g.nhomLoi} &times; {g.soLan}
                        </span>
                      ))}
                    </div>

                    <div className="answer-meta">
                      <Link href={`/bo-the-tien-do?id=${it.boTheId}`}>
                        {it.boTheTen.length > 60 ? it.boTheTen.slice(0, 60) + '…' : it.boTheTen}
                      </Link>
                      {it.soLanQuen > 0 && <span>Quên {it.soLanQuen} lần khi ôn</span>}
                      {it.lanGanNhatAt && <span>Cập nhật {new Date(it.lanGanNhatAt).toLocaleDateString('vi-VN')}</span>}
                    </div>

                    {it.ghiChu && editingNote !== it.theId && (
                      <div className={styles.nbNote} data-note>{it.ghiChu}</div>
                    )}

                    {editingNote === it.theId && (
                      <div className={styles.nbEdit}>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Ghi chú..."
                          className="input"
                          rows={3}
                          maxLength={500}
                        />
                        <div className="row">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => saveNote(it.theId)} disabled={updateMutation.isPending}>Lưu</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingNote(null)}>Huỷ</button>
                        </div>
                      </div>
                    )}

                    {it.bangChung?.length > 0 && (
                      <details className={styles.nbProof}>
                        <summary>Lần sai gần nhất ({it.bangChung.length})</summary>
                        <ol>
                          {it.bangChung.map((b, idx) => (
                            <li key={idx}>
                              {ERROR_GROUP[b.nhomLoi] || b.nhomLoi}: bạn trả lời <del>{b.traLoi || '(bỏ trống)'}</del>, đáp án <strong>{b.dapAn}</strong>, {new Date(b.createdAt).toLocaleString('vi-VN')}
                              {b.baiLuyenId && (
                                <>
                                  . <Link href={`/luyen-tap-ket-qua?id=${b.baiLuyenId}`}>Xem bài</Link>
                                </>
                              )}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    <div className={styles.nbTools}>
                      <button type="button" className="btn btn-quiet" data-act="play">
                        <Icon name="play" />Nghe
                      </button>
                      <button type="button" className="btn btn-quiet" data-act="note" onClick={() => { setEditingNote(it.theId); setNoteContent(it.ghiChu || ''); }}>
                        {it.ghiChu ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                      </button>
                      <button type="button" className="btn btn-quiet" data-act="mark" aria-pressed={it.danhDauThuCong} onClick={() => toggleMark(it)} disabled={updateMutation.isPending}>
                        {it.danhDauThuCong ? 'Bỏ đánh dấu' : 'Đánh dấu từ khó'}
                      </button>
                      <button type="button" className="btn btn-quiet" data-act="remove" onClick={() => removeEntry(it.theId)} disabled={deleteMutation.isPending}>
                        Bỏ khỏi sổ tay
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.pagerWrap}>
              <nav className="pager" id="pager" aria-label="Phân trang">
                {/* Phân trang tĩnh để UI ko lỗi, có thể implement pager linh hoạt sau nếu API hỗ trợ totalPages */}
              </nav>
            </div>
          </div>
          <div data-when="empty">
            <div className="empty">
              <div className="empty-sheet" aria-hidden="true">
                <span data-n="1"><i></i><i></i><i></i><i></i></span>
                <span data-n="2"><i></i><i></i><i></i><i></i></span>
              </div>
              <h2 id="empty-title">{nhomLoi && anyItems ? "Không có từ nào trong nhóm này" : "Sổ tay đang trống"}</h2>
              <p id="empty-text">
                {nhomLoi && anyItems ? "Chọn Tất cả để xem mọi từ trong sổ." : "Từ sẽ vào sổ khi bạn làm sai trong bài luyện hoặc quên nhiều lần khi ôn. Trong lúc học, bấm \"Đánh dấu từ khó\" để tự thêm."}
              </p>
              <Link className="btn btn-primary" href="/luyen-tap" id="empty-action">Làm một bài luyện</Link>
            </div>
          </div>
          <div data-when="error"></div>
        </div>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="pairs-title">
          <h2 className="panel-title" id="pairs-title">Cặp dễ nhầm</h2>
          <div data-view={pairsLoading ? "loading" : (pairs?.length > 0 ? "ready" : "empty")} id="pairs-region" aria-live="polite">
            <div data-when="loading">
              <div className="skeleton"><div className="sk sk-line"></div><div className="sk sk-line"></div></div>
            </div>
            <div data-when="ready">
              <ul className={styles.pairs} id="pairs" role="list">
                {pairs?.map((pr, i) => (
                  <li key={i}>
                    <div className={styles.pairWords}>
                      <div>
                        <b>{pr.the1.tu}</b>
                        <span>{pr.the1.nghiaVi}</span>
                      </div>
                      <div className={styles.pairVs}>/</div>
                      <div>
                        <b>{pr.the2.tu}</b>
                        <span>{pr.the2.nghiaVi}</span>
                      </div>
                    </div>
                    <div className="row small muted">
                      <strong>{MIX[pr.loaiNham] || 'Dễ nhầm'}</strong>
                      <span>Nhầm {pr.soLan} lần</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startPracticePairs(pr.the1.id, pr.the2.id)}>
                      Luyện phân biệt
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div data-when="empty">
              <p className="small muted">Chưa có cặp nào. Cặp được ghi lại khi bạn chọn nhầm giữa hai từ trong bài luyện.</p>
            </div>
            <div data-when="error"></div>
          </div>
        </section>

        <section className="panel" aria-labelledby="rules-title">
          <h2 className="panel-title" id="rules-title">Khi nào từ vào sổ</h2>
          <ul className={styles.rules}>
            <li>Làm sai trong bài luyện. Lỗi được xếp theo nhóm: nghĩa, chính tả, nghe, dùng từ trong câu, cặp dễ nhầm.</li>
            <li>Quên từ 3 lần trở lên khi ôn.</li>
            <li>Chọn nhầm với một từ khác trong bài luyện.</li>
            <li>Bạn tự đánh dấu khi học.</li>
          </ul>
          <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>Bỏ một từ khỏi sổ không xóa lịch sử. Nếu sau đó bạn sai lại, từ sẽ quay lại sổ.</p>
        </section>
      </aside>
    </div>
  );
}

export default function NotebookPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ padding: 'var(--sp-6)' }}><div className="sk sk-row"></div></div>}>
      <NotebookContent />
    </Suspense>
  );
}
