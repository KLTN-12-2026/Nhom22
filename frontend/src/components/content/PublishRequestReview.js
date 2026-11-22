'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import {
  APPROVER, PUBLISH_REASON, PUBLISH_STAMP, PUBLISH_STATUS, decidePublishRequest, formatTime,
  listPublishRequests, reasonOf,
} from '@/lib/publish-requests.mjs';
import { handledId } from '@/lib/realtime.mjs';
import { useRealtimeEvent } from '@/hooks/useEventStream';
import { CopyChanges } from '@/components/content/CopyChanges';
import { requestChanges, summarize } from '@/lib/copy-diff.mjs';
import styles from './PublishRequestReview.module.css';

const FILTERS = [['CHO_DUYET', 'Chờ duyệt'], ['DA_DUYET', 'Đã duyệt'], ['TU_CHOI', 'Bị từ chối'], ['', 'Tất cả']];
const ACTION = { DUYET: 'Duyệt công khai', TU_CHOI: 'Từ chối', THU_HOI: 'Thu hồi công khai' };
const DONE = { DUYET: 'Đã duyệt công khai', TU_CHOI: 'Đã từ chối yêu cầu', THU_HOI: 'Đã thu hồi công khai' };

export function PublishRequestReview({ admin = false }) {
  const client = useQueryClient();
  const [trangThai, setTrangThai] = useState('CHO_DUYET');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['publish-requests', admin ? 'admin' : 'me', trangThai, page],
    queryFn: () => listPublishRequests(apiFetch, { admin, trangThai, page }),
  });
  const items = data?.items || [];
  const [takenOver, setTakenOver] = useState('');
  useRealtimeEvent('MUC_DA_XU_LY', id => {
    const requestId = handledId(id, 'CONG_KHAI');
    if (!admin || !requestId || !selected || String(selected.id) !== requestId) return;
    setSelected(null);
    setTakenOver('Yêu cầu bạn đang mở vừa được quản trị viên khác xử lý. Danh sách đã được tải lại.');
  });
  const done = message => {
    setSelected(null);
    setNotice(message);
    client.invalidateQueries({ queryKey: ['publish-requests'] });
  };

  return <div className="page page-grid with-side">
    <section className="sheet" aria-labelledby="page-title">
      <div className="form-head">
        <div className="form-code"><span>{admin ? 'Quản trị' : 'Bộ của tôi'}</span><span>Yêu cầu công khai</span></div>
        <h1 id="page-title">{admin ? 'Duyệt công khai bản sao' : 'Yêu cầu công khai bản sao'}</h1>
        <p>{admin
          ? 'Chỉ các yêu cầu có bộ gốc đã bị xóa, ẩn, không còn công khai hoặc tác giả không còn hoạt động. Bộ của bạn (kể cả bộ mẫu) được duyệt ở mục Yêu cầu công khai như người học.'
          : 'Người khác đã sao chép bộ của bạn và muốn chia sẻ bản sao trong thư viện. Bạn là người duyệt.'}</p>
        {notice && <p className="notice notice-success" role="status"><Icon name="check" />{notice}</p>}
        {takenOver && <p className="notice notice-warning" role="alert"><Icon name="info" />{takenOver}</p>}
      </div>
      <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
        {FILTERS.map(([value, label]) => <button key={value || 'all'} type="button" className="tab" role="tab"
          aria-selected={trangThai === value} onClick={() => { setTrangThai(value); setPage(0); setNotice(''); }}>{label}</button>)}
      </div>
      <div data-view={isLoading ? 'loading' : error ? 'error' : items.length ? 'ready' : 'empty'}>
        <div data-when="loading"><div className="skeleton"><div className="sk sk-row" /><div className="sk sk-row" /></div></div>
        <div data-when="error"><ErrorState description={error?.message} onRetry={refetch} /></div>
        <div data-when="empty"><div className="empty"><h2>Không có yêu cầu nào</h2><p>{trangThai === 'CHO_DUYET'
          ? 'Khi có người xin công khai bản sao, yêu cầu sẽ hiện ở đây.'
          : 'Chọn bộ lọc khác để xem các yêu cầu còn lại.'}</p></div></div>
        <div data-when="ready">
          <ol className="answer-list">{items.map((item, index) => <li key={item.id} className="answer-row deck-row has-actions">
            <span className="answer-no">{page * 20 + index + 1}</span>
            <div className="answer-main">
              <span className="answer-title" style={{ overflowWrap: 'anywhere' }}>{item.tenBoThe}</span>
              <div className="answer-meta">
                <span className={`stamp ${PUBLISH_STAMP[item.trangThai]}`}>{PUBLISH_STATUS[item.trangThai]}</span>
                <span className="stamp stamp-accent"><Icon name="copy" />Bản sao</span>
                <span className="small">Gốc: <Link href={`/thu-vien/${item.boNguonId}`}>{item.tenBoNguon}</Link></span>
              </div>
              <p className="small muted">{item.tenNguoiGui} gửi lúc {formatTime(item.createdAt)}{item.trangThai === 'CHO_DUYET' && ` · hết hạn ${formatTime(item.hetHanAt)}`}</p>
              {item.loiNhan && <p className="small" style={{ overflowWrap: 'anywhere' }}>Lời nhắn: {item.loiNhan}</p>}
              {item.lyDo && <p className="small muted" style={{ overflowWrap: 'anywhere' }}>Lý do: {item.lyDo}</p>}
            </div>
            <div className="table-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setTakenOver(''); setSelected(item); }}><Icon name="eye" />Xem và xử lý</button>
            </div>
          </li>)}</ol>
          <Pagination page={page + 1} totalPages={data?.totalPages || 0} onPageChange={value => setPage(value - 1)} />
        </div>
      </div>
    </section>
    <aside className="side-col">
      <section className="panel" aria-labelledby="rules-title">
        <h2 id="rules-title" className="panel-title">Quy tắc</h2>
        <ul className="small muted" style={{ paddingLeft: '1.1rem', display: 'grid', gap: 'var(--space-2)' }}>
          <li>Duyệt thì bản sao hiện trong thư viện với nhãn “Bản sao” và liên kết về bộ gốc.</li>
          <li>Từ chối hoặc thu hồi phải có lý do 10–500 ký tự; người gửi chờ 24 giờ mới gửi lại được.</li>
          <li>Yêu cầu không được xử lý trong 14 ngày sẽ tự hết hạn.</li>
          {admin && <li>Mọi quyết định được ghi vào nhật ký quản trị.</li>}
        </ul>
      </section>
    </aside>
    {selected && <ReviewDialog key={selected.id} item={selected} admin={admin} onClose={() => setSelected(null)}
      onDone={done} onStale={() => { setSelected(null); refetch(); }} />}
  </div>;
}

function ReviewDialog({ item, admin, onClose, onDone, onStale }) {
  const dialogRef = useRef(null);
  const [tab, setTab] = useState('changes');
  const [page, setPage] = useState(0);
  const [lyDo, setLyDo] = useState('');
  const [choice, setChoice] = useState(null);
  useEffect(() => { if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, []);
  const base = admin ? '/api/v1/admin/publish-requests' : '/api/v1/publish-requests';
  const changes = useQuery({
    queryKey: ['publish-request-changes', admin, item.id],
    queryFn: () => requestChanges(apiFetch, item.id, admin),
  });
  const cards = useQuery({
    queryKey: ['publish-request-cards', admin, item.id, page],
    queryFn: () => apiFetch(`${base}/${encodeURIComponent(item.id)}/cards?page=${page}&size=20`),
    enabled: tab === 'cards',
  });
  const decide = useMutation({
    mutationFn: quyetDinh => decidePublishRequest(apiFetch, item.id, { quyetDinh, lyDo, version: item.version }, admin),
    onSuccess: (_, quyetDinh) => onDone(DONE[quyetDinh]),
  });
  const needsReason = choice && choice !== 'DUYET';
  const reasonValid = lyDo.trim().length >= 10;
  const send = quyetDinh => {
    if (decide.isPending) return;
    setChoice(quyetDinh);
    if (quyetDinh !== 'DUYET' && !reasonValid) return;
    decide.mutate(quyetDinh);
  };
  const error = decide.error;
  const fieldError = error?.fieldErrors?.find(field => field.field === 'lyDo')?.message;
  const reasonInvalid = (needsReason && !reasonValid) || !!fieldError;
  const decidable = item.trangThai === 'CHO_DUYET' || item.trangThai === 'DA_DUYET';
  const summary = summarize(changes.data);

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="review-title" onCancel={onClose}>
    <header className={styles.head}>
      <div className={styles.headText}>
        <div className={styles.stamps}>
          <span className={`stamp ${PUBLISH_STAMP[item.trangThai]}`}>{PUBLISH_STATUS[item.trangThai]}</span>
          <span className="stamp stamp-accent"><Icon name="copy" />Bản sao</span>
        </div>
        <h2 id="review-title" className={styles.title}>{item.tenBoThe}</h2>
        <p className={styles.sub}>Sao chép từ <Link href={`/thu-vien/${item.boNguonId}`}>{item.tenBoNguon}</Link></p>
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng"><Icon name="x" /></button>
    </header>

    <div className={styles.body}>
      <main className={styles.main}>
        <div className={styles.tabs} role="tablist" aria-label="Nội dung xem">
          <button type="button" role="tab" aria-selected={tab === 'changes'} onClick={() => setTab('changes')}>
            Thay đổi so với bộ gốc{changes.data && <span>{changes.data.boThe.length + changes.data.the.length}</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'cards'} onClick={() => setTab('cards')}>
            Toàn bộ thẻ bản sao{changes.data && <span>{changes.data.soTheBanSao}</span>}
          </button>
        </div>

        {tab === 'changes' && <div role="tabpanel" className={styles.panel}>
          {changes.isLoading && <div className={styles.loading} role="status"><span className="sk sk-row" /><span className="sk sk-row" /><span className="sk sk-row" /></div>}
          {changes.error && <ErrorState title="Không tải được thay đổi" description={changes.error.message} onRetry={changes.refetch} />}
          {changes.data && <CopyChanges diff={changes.data} />}
        </div>}

        {tab === 'cards' && <div role="tabpanel" className={styles.panel}>
          {cards.isLoading && <p role="status">Đang tải thẻ…</p>}
          {cards.error && <ErrorState description={cards.error.message} onRetry={cards.refetch} />}
          {cards.data?.items.length === 0 && <div className="empty"><h2>Bản sao chưa có thẻ</h2></div>}
          <ol className="answer-list">{cards.data?.items.map((card, index) => <li key={card.id} className="answer-row">
            <span className="answer-no">{page * 20 + index + 1}</span>
            <div className="entry">
              <div className="entry-head"><span className="entry-word" lang="en">{card.tu}</span>{card.phienAm && <span className="entry-ipa" lang="en">{card.phienAm}</span>}{card.tuLoai && <span className="pos" lang="en">{card.tuLoai}</span>}</div>
              <p className="entry-mean">{card.nghiaVi}</p>
              {card.viDuEn && <p className="entry-example" lang="en">{card.viDuEn}</p>}
              {card.nguon && <p className="caption">Nguồn: {card.nguon}</p>}
            </div>
          </li>)}</ol>
          {cards.data && <Pagination page={page + 1} totalPages={cards.data.totalPages} onPageChange={value => setPage(value - 1)} />}
        </div>}
      </main>

      <aside className={styles.side}>
        <dl className={styles.meta}>
          <div><dt>Người gửi</dt><dd>{item.tenNguoiGui}</dd></div>
          <div><dt>Gửi lúc</dt><dd>{formatTime(item.createdAt)}</dd></div>
          {item.trangThai === 'CHO_DUYET' && <div><dt>Hết hạn</dt><dd>{formatTime(item.hetHanAt)}</dd></div>}
          <div><dt>Người duyệt</dt><dd>{APPROVER[item.nguoiDuyet]}</dd></div>
        </dl>
        {summary.length > 0 && <p className={styles.summary}><Icon name="info" />Bản sao có {summary.join(', ')}.</p>}
        {changes.data && !changes.data.coThayDoi && <p className={styles.warn}><Icon name="alert" />Bản sao hiện không khác bộ gốc.</p>}
        {item.loiNhan && <blockquote className={styles.message}><span>Lời nhắn của người gửi</span>{item.loiNhan}</blockquote>}
        {item.lyDo && <blockquote className={styles.message}><span>Lý do đã ghi</span>{item.lyDo}</blockquote>}

        {decidable && <div className={styles.decision}>
          <label className="field-label" htmlFor="review-reason">Lý do<span className="optional">{item.trangThai === 'CHO_DUYET' ? 'Bắt buộc khi từ chối' : 'Bắt buộc khi thu hồi'}</span></label>
          <textarea className="textarea" id="review-reason" rows={4} maxLength={500} value={lyDo} onChange={event => setLyDo(event.target.value)}
            placeholder="Ví dụ: Bản sao chỉ đổi tên, chưa bổ sung nội dung mới."
            aria-invalid={reasonInvalid ? 'true' : undefined} aria-describedby={reasonInvalid ? 'review-reason-error' : undefined} />
          {reasonInvalid && <p className="field-error" id="review-reason-error">{fieldError || 'Nhập lý do từ 10 đến 500 ký tự'}</p>}
        </div>}
        {error && !fieldError && (error.status === 409
          ? <div className="notice notice-warning" role="alert"><Icon name="info" /><div className="stack-sm"><p>{error.message}</p><button type="button" className="btn btn-secondary btn-sm" onClick={onStale}>Tải lại danh sách</button></div></div>
          : <p className="notice notice-danger" role="alert">{PUBLISH_REASON[reasonOf(error)] || error.message}</p>)}

        <div className={styles.actions}>
          {item.trangThai === 'CHO_DUYET' && <>
            <button type="button" className="btn btn-primary btn-lg" disabled={decide.isPending} aria-busy={decide.isPending && choice === 'DUYET'} onClick={() => send('DUYET')}><Icon name="check" />{decide.isPending && choice === 'DUYET' ? 'Đang duyệt…' : ACTION.DUYET}</button>
            <button type="button" className="btn btn-danger" disabled={decide.isPending} aria-busy={decide.isPending && choice === 'TU_CHOI'} onClick={() => send('TU_CHOI')}>{decide.isPending && choice === 'TU_CHOI' ? 'Đang từ chối…' : ACTION.TU_CHOI}</button>
          </>}
          {item.trangThai === 'DA_DUYET' && <button type="button" className="btn btn-danger" disabled={decide.isPending} aria-busy={decide.isPending} onClick={() => send('THU_HOI')}>{decide.isPending ? 'Đang thu hồi…' : ACTION.THU_HOI}</button>}
          <button type="button" className="btn btn-quiet" onClick={onClose}>Đóng</button>
        </div>
      </aside>
    </div>
  </dialog>;
}
