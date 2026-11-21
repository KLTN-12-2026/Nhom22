'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ConfirmDialog, ErrorState, Icon, Pagination } from '@/components/ui';
import styles from './page.module.css';

const GROUPS = [
  ['', 'Tất cả'],
  ['MOI', 'Mới'],
  ['DANG_HOC', 'Đang học'],
  ['DEN_HAN', 'Đến hạn'],
  ['QUA_HAN', 'Quá hạn'],
  ['TAM_NGUNG', 'Tạm ngưng']
];
const LABEL = Object.fromEntries(GROUPS);
const STAMP = { MOI: 'stamp-quiet', DANG_HOC: 'stamp-graphite', DEN_HAN: 'stamp-solid', QUA_HAN: 'stamp-warning', TAM_NGUNG: 'stamp-quiet' };
const DIR = { EN_VI: 'Anh → Việt', VI_EN: 'Việt → Anh' };
const SRS_STATE = { MOI: 'Mới', DANG_HOC: 'Đang học', ON_TAP: 'Ôn tập', HOC_LAI: 'Học lại', TAM_NGUNG: 'Tạm ngưng' };
const RATING = { QUEN: 'Quên', KHO: 'Khó', NHO: 'Nhớ', DE: 'Dễ' };
const RATING_STAMP = { QUEN: 'stamp-danger', KHO: 'stamp-warning', NHO: 'stamp-success', DE: 'stamp-success' };

function when(c) {
  if (c.nhom === 'MOI') return 'Chưa học';
  if (c.nhom === 'TAM_NGUNG') return 'Không vào phiên học';
  if (!c.hanOnAt) return 'Chưa có lịch ôn';
  const due = new Date(c.hanOnAt);
  if (c.nhom === 'QUA_HAN') return `Đến hạn từ ${due.toLocaleDateString('vi-VN')}, đang trễ`;
  if (c.nhom === 'DEN_HAN') return `Đến hạn ${due.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay`;
  return `Ôn lại ngày ${due.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

function Direction({ code, c }) {
  return (
    <div className={styles.dir}>
      <span className={styles.dirName}>{DIR[code]}</span>
      <span className={`stamp ${STAMP[c.nhom] || 'stamp-quiet'}`}>{LABEL[c.nhom] || c.nhom}</span>
      {c.trangThai !== c.nhom && ['ON_TAP', 'HOC_LAI'].includes(c.trangThai) && <span>{SRS_STATE[c.trangThai]}</span>}
      <span>{when(c)}</span>
      {c.soLanQuen ? <span className={styles.forgot}>Quên {c.soLanQuen} lần</span> : null}
    </div>
  );
}

function HistoryLog({ theId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-history', theId],
    queryFn: () => apiFetch(`/api/v1/learning/history?theId=${theId}&size=10`)
  });
  if (isLoading) return <div className="skeleton" role="status" aria-label="Đang tải lịch sử"><div className="sk sk-line"></div></div>;
  if (error) return <p className="small" role="alert" style={{ color: 'var(--danger)' }}>{error.message}</p>;
  if (!data?.items?.length) return <p className="small muted">Thẻ này chưa có lượt ôn nào.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">10 lượt ôn gần nhất</caption>
        <thead><tr><th scope="col">Lúc</th><th scope="col">Chiều</th><th scope="col">Mức</th><th scope="col">Trước</th><th scope="col">Sau</th></tr></thead>
        <tbody>
          {data.items.map((r, i) => (
            <tr key={i}>
              <td>{new Date(r.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td>{DIR[r.chieuHoc] || r.chieuHoc}</td>
              <td><span className={`stamp ${RATING_STAMP[r.danhGia] || 'stamp-quiet'}`}>{RATING[r.danhGia] || r.danhGia}</span></td>
              <td>{SRS_STATE[r.truoc?.trangThai] || r.truoc?.trangThai || '—'}</td>
              <td>{SRS_STATE[r.sau?.trangThai] || r.sau?.trangThai || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const nhom = searchParams.get('nhom') || '';
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [open, setOpen] = useState({});
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deck-progress', id, nhom, q, page],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), size: '20' });
      if (nhom) p.set('nhom', nhom);
      if (q) p.set('q', q);
      return apiFetch(`/api/v1/decks/${encodeURIComponent(id)}/progress?${p}`);
    }
  });

  const action = useMutation({
    mutationFn: ({ method, url, body }) => apiFetch(url, { method, body: JSON.stringify(body) }),
    onSuccess: () => { setConfirm(null); queryClient.invalidateQueries({ queryKey: ['deck-progress', id] }); },
    onError: () => setConfirm(null)
  });

  const go = (changes) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.replace(`/bo-the/${id}/tien-do?${p}`, { scroll: false });
  };

  const t = data?.tongHop || {};
  const total = GROUPS.slice(1).reduce((s, [g]) => s + (Number(t[g]) || 0), 0);
  const runConfirm = () => {
    const { kind, card } = confirm;
    if (kind === 'reset') action.mutate({ method: 'POST', url: `/api/v1/cards/${card.theId}/progress/reset`, body: { xacNhan: true } });
    else action.mutate({ method: 'PUT', url: `/api/v1/cards/${card.theId}/progress/suspend`, body: { tamNgung: kind === 'suspend' } });
  };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <Link className={`btn btn-quiet ${styles.back}`} href={`/bo-the/${id}`}><Icon name="arrow-left" />Về bộ thẻ</Link>
        <div className="form-head">
          <div className="form-code"><span>Tiến độ bộ thẻ</span>{data && <span>Múi giờ {data.muiGio}</span>}</div>
          <h1 id="page-title" className={styles.title}>{data?.ten || 'Tiến độ'}</h1>
          <p>Mỗi thẻ có hai chiều học, mỗi chiều một lịch ôn riêng. Quá hạn nghĩa là trễ từ hôm trước trở đi.</p>
        </div>

        {total > 0 && (
          <div className={styles.dist}>
            <div className={styles.bar} role="img" aria-label={GROUPS.slice(1).map(([g, l]) => `${l} ${t[g] || 0}`).join(', ')}>
              {GROUPS.slice(1).map(([g]) => (Number(t[g]) > 0 ? <span key={g} className={styles[`seg${g}`]} style={{ flexGrow: t[g] }} /> : null))}
            </div>
            <ul className={styles.legend} role="list">
              {GROUPS.slice(1).map(([g, l]) => (
                <li key={g}><i className={styles[`seg${g}`]} aria-hidden="true" />{l} <strong>{t[g] || 0}</strong></li>
              ))}
            </ul>
          </div>
        )}

        <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {GROUPS.map(([g, l]) => (
            <button key={g} type="button" className="tab" role="tab" aria-selected={nhom === g} onClick={() => go({ nhom: g, page: '' })}>
              {l}{g && <span className="count">{t[g] ?? 0}</span>}
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className="input-with-icon">
            <Icon name="search" />
            <label className="sr-only" htmlFor="q">Tìm thẻ</label>
            <input className="input" id="q" type="search" placeholder="Tìm từ hoặc nghĩa" autoComplete="off" value={q}
              onChange={e => { setQ(e.target.value); go({ q: e.target.value, page: '' }); }} />
          </div>
          {data && <span className="small muted">{data.totalElements ?? data.items.length} thẻ</span>}
        </div>

        {action.isError && <p className="notice notice-danger" role="alert">{action.error.message}</p>}
        {isLoading && <div className="skeleton" role="status" aria-label="Đang tải tiến độ"><div className="sk sk-row" /><div className="sk sk-row" /><div className="sk sk-row" /></div>}
        {error && (error.status === 404
          ? <p className="notice notice-danger" role="alert">Không tìm thấy bộ thẻ.</p>
          : <ErrorState description={error.message} onRetry={refetch} />)}

        {data && !data.items.length && (
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true"><span data-n="1"><i></i><i></i><i></i><i></i></span><span data-n="2"><i></i><i></i><i></i><i></i></span></div>
            <h2>Không có thẻ nào ở trạng thái này</h2>
            <p>Chọn trạng thái khác hoặc xóa từ khóa tìm kiếm.</p>
          </div>
        )}

        {data?.items?.length > 0 && <>
          <ol className="answer-list" role="list">
            {data.items.map((it, i) => (
              <li key={it.theId} className={`answer-row ${styles.row}${it.tamNgung ? ` ${styles.paused}` : ''}`}>
                <span className="answer-no">{page * data.size + i + 1}</span>
                <div className={styles.main}>
                  <div className="entry-head">
                    <span className="entry-word" lang="en">{it.tu}</span>
                    {it.phienAm && <span className="entry-ipa" lang="en">{it.phienAm}</span>}
                    {it.tuLoai && <span className="pos" lang="en">{it.tuLoai}</span>}
                  </div>
                  <p className={styles.mean}>{it.nghiaVi}</p>
                  <div className={styles.dirs}>
                    <Direction code="EN_VI" c={it.chieu.EN_VI} />
                    <Direction code="VI_EN" c={it.chieu.VI_EN} />
                  </div>
                  <div className={styles.tools}>
                    {it.tamNgung
                      ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirm({ kind: 'resume', card: it })}><Icon name="play" />Khôi phục</button>
                      : <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirm({ kind: 'suspend', card: it })}><Icon name="pause" />Tạm ngưng</button>}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm({ kind: 'reset', card: it })}><Icon name="refresh" />Đặt lại</button>
                    <button type="button" className="btn btn-quiet btn-sm" aria-expanded={!!open[it.theId]} aria-controls={`hist-${it.theId}`} onClick={() => setOpen(o => ({ ...o, [it.theId]: !o[it.theId] }))}>
                      <Icon name="clock" />{open[it.theId] ? 'Ẩn lịch sử' : 'Lịch sử ôn'}
                    </button>
                  </div>
                  {open[it.theId] && <div id={`hist-${it.theId}`} className={styles.hist}><HistoryLog theId={it.theId} /></div>}
                </div>
              </li>
            ))}
          </ol>
          <Pagination page={page + 1} totalPages={data.totalPages} onPageChange={v => go({ page: String(v - 1) })} />
        </>}
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="sum-title">
          <h2 className="panel-title" id="sum-title">Tổng hợp, mỗi chiều tính riêng</h2>
          <dl className="tally">
            {GROUPS.slice(1).map(([g, l]) => (
              <div key={g}><dt>{l}</dt><dd><span className="tally-n" style={{ fontSize: '1.375rem' }}>{t[g] ?? 0}</span>thẻ</dd></div>
            ))}
          </dl>
          <Link className={`btn btn-primary ${styles.study}`} href={`/hoc?boTheId=${encodeURIComponent(id)}`}><Icon name="play" />Học bộ này</Link>
        </section>
        <section className="panel" aria-labelledby="help-title">
          <h2 className="panel-title" id="help-title">Tạm ngưng và đặt lại</h2>
          <ul className={styles.notes}>
            <li><strong>Tạm ngưng</strong>: thẻ không vào phiên học nữa. Khôi phục thì thẻ giữ nguyên lịch cũ, kể cả khi đã trễ.</li>
            <li><strong>Đặt lại</strong>: cả hai chiều quay về trạng thái Mới. Lịch sử ôn cũ vẫn được giữ.</li>
          </ul>
        </section>
      </aside>

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.kind === 'reset' ? 'Đặt lại tiến độ' : confirm?.kind === 'suspend' ? 'Tạm ngưng thẻ' : 'Khôi phục thẻ'}
        description={confirm?.kind === 'reset'
          ? `Đặt lại tiến độ thẻ “${confirm?.card.tu}”? Cả hai chiều sẽ quay về trạng thái Mới.`
          : confirm?.kind === 'suspend'
            ? `Tạm ngưng thẻ “${confirm?.card.tu}”? Thẻ sẽ không vào phiên học.`
            : `Khôi phục thẻ “${confirm?.card.tu}”? Thẻ giữ nguyên lịch ôn cũ.`}
        confirmLabel={confirm?.kind === 'reset' ? 'Đặt lại' : confirm?.kind === 'suspend' ? 'Tạm ngưng' : 'Khôi phục'}
        loading={action.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}

export default function DeckProgressPage() {
  return (
    <Suspense fallback={<div className="page sheet skeleton"><div className="sk sk-title" /><div className="sk sk-row" /></div>}>
      <ProgressContent />
    </Suspense>
  );
}
