'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ConfirmDialog, Icon, Pagination } from '@/components/ui';
import { CardActions } from '@/components/content/CardActions';
import { SpeakButton } from '@/components/content/SpeakButton';
import { ERROR_GROUP, label } from '@/lib/practice-labels.mjs';
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

const lastSeen = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function NotebookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = parseInt(searchParams.get('page') || '0', 10);
  const nhomLoi = searchParams.get('nhomLoi') || '';

  const [editingNote, setEditingNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [actionError, setActionError] = useState('');
  const [removing, setRemoving] = useState(null);
  const fail = (err) => setActionError(err.message || 'Chưa thực hiện được. Hãy thử lại.');

  const { data: notebook, isLoading: nbLoading, error: nbError } = useQuery({
    queryKey: ['notebook', page, nhomLoi],
    queryFn: () => apiFetch(`/api/v1/notebook?page=${page}&size=20${nhomLoi ? `&nhomLoi=${nhomLoi}` : ''}`)
  });

  const { data: pairs, isLoading: pairsLoading, error: pairsError } = useQuery({
    queryKey: ['confusing-pairs'],
    queryFn: () => apiFetch('/api/v1/learning/confusing-pairs')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/notebook/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook'] });
      setEditingNote(null);
    },
    onError: fail
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/notebook/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebook'] }),
    onError: fail
  });

  const practiceMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => router.push(`/luyen-tap-lam-bai?id=${res.id}`),
    onError: fail
  });

  const goToPage = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(value));
    router.push(`/so-tay?${params.toString()}`, { scroll: false });
  };

  const handleTabClick = (groupId) => {
    const params = new URLSearchParams(searchParams);
    if (groupId) params.set('nhomLoi', groupId);
    else params.delete('nhomLoi');
    params.set('page', '0');
    router.push(`/so-tay?${params.toString()}`, { scroll: false });
  };

  const saveNote = (id) => {
    setActionError('');
    updateMutation.mutate({ id, body: { ghiChu: noteContent } });
  };

  const toggleMark = (it) => {
    setActionError('');
    updateMutation.mutate({ id: it.theId, body: { danhDauThuCong: !it.danhDauThuCong } });
  };

  const confirmRemove = () => {
    setActionError('');
    deleteMutation.mutate(removing.theId, { onSettled: () => setRemoving(null) });
  };

  const startPracticeNotebook = () => {
    setActionError('');
    practiceMutation.mutate({ loaiBai: 'TONG_HOP', nguon: 'SO_TAY', soCau: 10 });
  };

  const startPracticePairs = (id1, id2) => {
    setActionError('');
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
          <p className="small muted">{totalCount > 0 ? 'Bài luyện gồm 10 câu lấy từ các từ trong sổ.' : 'Sổ tay chưa có từ nào để luyện.'}</p>
          <button type="button" className="btn btn-accent btn-lg" id="practice" onClick={startPracticeNotebook} disabled={!totalCount || practiceMutation.isPending} aria-busy={practiceMutation.isPending}>
            <Icon name="practice" />{practiceMutation.isPending ? 'Đang tạo bài…' : 'Luyện các từ trong sổ tay'}
          </button>
        </div>

        {actionError && <p className="notice notice-danger" role="alert">{actionError}</p>}

        <div data-view={nbLoading ? "loading" : nbError ? "error" : (notebook?.items?.length > 0 ? "ready" : "empty")} id="region" aria-live="polite">
          <div data-when="loading">
            <div className="skeleton">
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>
          <div data-when="ready">
            <ol className="answer-list" id="list" role="list">
              {notebook?.items?.map((it, i) => {
                const deckName = it.boTheTen || 'Bộ của tôi';
                return (
                <li key={it.theId} className={`answer-row ${styles.nbRow}`}>
                  <span className="answer-no">{page * (notebook?.size || 20) + i + 1}</span>
                  <div className={styles.nbBody}>
                    <div className={styles.nbHead}>
                      <span className="entry-word" lang="en">{it.tu}</span>
                      <SpeakButton text={it.tu} compact />
                      {it.phienAm && <span className="entry-ipa" lang="en">{it.phienAm}</span>}
                      {it.tuLoai && <span className="pos" lang="en">{it.tuLoai}</span>}
                    </div>
                    <p className={styles.nbMean}>{it.nghiaVi}</p>

                    {(it.lyDo?.length > 0 || it.nhomLoi?.length > 0) && (
                      <div className={styles.nbTags}>
                        {it.lyDo?.map(r => (
                          <span key={r} className={`${styles.reason}${r === 'DANH_DAU_THU_CONG' ? ` ${styles.reasonMine}` : ''}`}>
                            <Icon name={r === 'DANH_DAU_THU_CONG' ? 'star' : 'alert'} />{REASON[r]}
                          </span>
                        ))}
                        {it.nhomLoi?.map(g => (
                          <span key={g.nhomLoi} className={styles.tally}>
                            {label(ERROR_GROUP, g.nhomLoi)}<b>{g.soLan}</b>
                          </span>
                        ))}
                      </div>
                    )}

                    {it.ghiChu && editingNote !== it.theId && (
                      <div className={styles.nbNote}>
                        <span className={styles.nbNoteLabel}>Ghi chú của bạn</span>
                        <p>{it.ghiChu}</p>
                      </div>
                    )}

                    {editingNote === it.theId && (
                      <form className={styles.nbEdit} onSubmit={event => { event.preventDefault(); saveNote(it.theId); }}>
                        <label className={styles.nbNoteLabel} htmlFor={`note-${it.theId}`}>Ghi chú của bạn</label>
                        <textarea
                          id={`note-${it.theId}`}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Mẹo nhớ, câu ví dụ của riêng bạn…"
                          className="input"
                          rows={3}
                          maxLength={500}
                          autoFocus
                        />
                        <div className={styles.nbEditBar}>
                          <span className="small muted">{noteContent.length}/500</span>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingNote(null)}>Hủy</button>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>Lưu ghi chú</button>
                        </div>
                      </form>
                    )}

                    {it.bangChung?.length > 0 && (
                      <details className={styles.nbProof}>
                        <summary><Icon name="chevron-right" />Lần sai gần nhất<span className={styles.count}>{it.bangChung.length}</span></summary>
                        <ol>
                          {it.bangChung.map((b, idx) => (
                            <li key={idx}>
                              <span className={styles.proofGroup}>{label(ERROR_GROUP, b.nhomLoi)}</span>
                              <span className={styles.proofAnswer}>
                                <span className="sr-only">Bạn trả lời </span><del>{b.traLoi || '(bỏ trống)'}</del>
                                <span className={styles.proofArrow} aria-hidden="true">→</span>
                                <span className="sr-only">, đáp án </span><strong>{b.dapAn}</strong>
                              </span>
                              <span className={styles.proofTime}>
                                {new Date(b.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                {b.baiLuyenId && <Link href={`/luyen-tap-ket-qua?id=${b.baiLuyenId}`}>Xem bài</Link>}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    <div className={styles.nbMeta}>
                      <Link href={`/bo-the/${it.boTheId}/tien-do`} title={deckName}><Icon name="decks" />{deckName.length > 60 ? `${deckName.slice(0, 60)}…` : deckName}</Link>
                      {it.soLanQuen > 0 && <span>Quên {it.soLanQuen} lần khi ôn</span>}
                      {it.lanGanNhatAt && <span>Cập nhật {new Date(it.lanGanNhatAt).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>
                  <div className={styles.nbTools}>
                    <CardActions word={it.tu} items={[
                      { key: 'note', icon: 'edit', label: it.ghiChu ? 'Sửa ghi chú' : 'Thêm ghi chú', tone: 'edit', onClick: () => { setEditingNote(it.theId); setNoteContent(it.ghiChu || ''); } },
                      { key: 'mark', icon: 'star', label: it.danhDauThuCong ? 'Bỏ đánh dấu' : 'Đánh dấu từ khó', pressed: !!it.danhDauThuCong, disabled: updateMutation.isPending, onClick: () => toggleMark(it) },
                      { key: 'remove', icon: 'trash', label: 'Bỏ khỏi sổ tay', tone: 'danger', split: true, disabled: deleteMutation.isPending, onClick: () => setRemoving(it) },
                    ]} />
                  </div>
                </li>
                );
              })}
            </ol>
            <div className={styles.pagerWrap}>
              <Pagination page={page + 1} totalPages={notebook?.totalPages || 0} onPageChange={value => goToPage(value - 1)} />
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
          <div data-when="error">
            <p className="notice notice-danger" role="alert">{nbError?.message || 'Chưa tải được sổ tay.'}</p>
          </div>
        </div>
        <ConfirmDialog
          isOpen={!!removing}
          title="Bỏ khỏi sổ tay"
          description={`Bỏ “${removing?.tu || ''}” khỏi sổ tay? Lịch sử ôn và bài luyện vẫn giữ nguyên. Nếu bạn sai lại, từ sẽ quay lại sổ.`}
          confirmLabel="Bỏ khỏi sổ tay"
          loading={deleteMutation.isPending}
          onClose={() => setRemoving(null)}
          onConfirm={confirmRemove}
        />
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="pairs-title">
          <h2 className="panel-title" id="pairs-title">Cặp dễ nhầm</h2>
          <div data-view={pairsLoading ? "loading" : pairsError ? "error" : (pairs?.length > 0 ? "ready" : "empty")} id="pairs-region" aria-live="polite">
            <div data-when="loading">
              <div className="skeleton"><div className="sk sk-line"></div><div className="sk sk-line"></div></div>
            </div>
            <div data-when="ready">
              <ul className={styles.pairs} id="pairs" role="list">
                {pairs?.map((pr, i) => (
                  <li key={pr.id || i}>
                    <div className={styles.pairWords}>
                      <div>
                        <b lang="en">{pr.the1.tu}</b>
                        <span>{pr.the1.nghiaVi}</span>
                      </div>
                      <div className={styles.pairVs} aria-hidden="true">vs</div>
                      <div>
                        <b lang="en">{pr.the2.tu}</b>
                        <span>{pr.the2.nghiaVi}</span>
                      </div>
                    </div>
                    <div className={styles.pairMeta}>
                      <span>Nhầm <b>{pr.soLanNham}</b> lần</span>
                      {lastSeen(pr.lanCuoiAt) && <span>Gần nhất {lastSeen(pr.lanCuoiAt)}</span>}
                    </div>
                    <button type="button" className={`btn btn-secondary btn-sm ${styles.pairBtn}`} onClick={() => startPracticePairs(pr.the1.id, pr.the2.id)}>
                      Luyện phân biệt
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div data-when="empty">
              <p className="small muted">Chưa có cặp nào. Cặp được ghi lại khi bạn chọn nhầm giữa hai từ trong bài luyện.</p>
            </div>
            <div data-when="error">
              <p className="small muted">{pairsError?.message || 'Chưa tải được cặp dễ nhầm.'}</p>
            </div>
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
