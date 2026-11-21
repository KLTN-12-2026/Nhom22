'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, ErrorState, Pagination, ConfirmDialog } from '@/components/ui';
import { CardEntry } from '@/components/content/CardEntry';
import { AuthorTag } from '@/components/content/AuthorTag';
import { useMe } from '@/hooks/useMe';
import { CardImagePreference } from '@/components/content/CardImagePreference';
import { useCardImages } from '@/hooks/useCardImages';
import { useFocusCard } from '@/hooks/useFocusCard';
import { CardEditDialog } from '@/components/content/CardEditDialog';
import { QuickAddCardDialog } from '@/components/dictionary/QuickAddCardDialog';
import { useMucTip } from '@/components/mascot/useMucTip';
import { CopyBadge } from '@/components/content/CopyBadge';
import { PublishRequestPanel } from '@/components/content/PublishRequestPanel';
import styles from './page.module.css';
import { useDeck } from '@/hooks/useDeck';
import { useTopics } from '@/hooks/useTopics';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { saveDownload } from '@/lib/csv.mjs';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
export default function DeckDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const [showImages, setShowImages] = useCardImages();
  const { data: deck, isLoading, error, refetch } = useDeck(id);
  const { data: me } = useMe();
  const { data: topics = [] } = useTopics();
  const [page, setPage] = useState(0);
  const [focusId, setFocusId] = useState(() => /^[1-9][0-9]{0,18}$/.test(params.get('the') || '') ? params.get('the') : null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const download = useMutation({ mutationFn: () => apiFetch(`/api/v1/decks/${id}/export`, { responseType: 'blob' }), onSuccess: blob => saveDownload(blob, `deck-${id}.csv`) });
  const tags = useQuery({ queryKey: ['public-tags'], queryFn: () => fetchAllPages('/api/v1/public/tags') });
  const [locating, setLocating] = useState(Boolean(focusId));
  const cards = useQuery({
    queryKey: ['deck-cards', id, locating ? `the-${focusId}` : page],
    queryFn: async () => {
      const result = await apiFetch(`/api/v1/decks/${id}/cards?page=${page}&size=20${locating && focusId ? `&theId=${focusId}` : ''}`);
      if (locating) { setPage(result.page); setLocating(false); }
      return result;
    },
  });
  useMucTip(cards.data?.totalElements === 0 ? 'Bộ còn trống. Bấm Thêm thẻ rồi gõ từ, tiếng Việt cũng được đó!' : null);
  useFocusCard(focusId, Boolean(cards.data) && !locating);
  const deleteCard = useMutation({
    mutationFn: card => apiFetch(`/api/v1/cards/${card.id}?version=${card.version}`, { method: 'DELETE' }),
    onSuccess: () => { setConfirmation(null); client.invalidateQueries({ queryKey: ['deck-cards', id] }); client.invalidateQueries({ queryKey: ['my-decks'] }); },
  });
  const favorite = useMutation({
    mutationFn: () => apiFetch(`/api/v1/decks/${id}/favorite`, { method: deck.yeuThich ? 'DELETE' : 'PUT' }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['deck', id] }); client.invalidateQueries({ queryKey: ['my-decks'] }); }
  });
  const remove = useMutation({
    mutationFn: () => apiFetch(`/api/v1/decks/${id}?version=${deck.version}`, { method: 'DELETE' }),
    onSuccess: () => { client.removeQueries({ queryKey: ['deck', id] }); client.invalidateQueries({ queryKey: ['my-decks'] }); router.push('/bo-the'); }
  });
  if (isLoading) return <div className="page sheet skeleton"><div className="sk sk-title" /><div className="sk sk-row" /></div>;
  if (error) return <div className="page sheet"><ErrorState description={error.message} onRetry={refetch} /></div>;
  if (!deck) return null;
  return <div className="page page-grid with-side">
    <article className="sheet" aria-labelledby="deck-title">
      <Link className="btn btn-quiet" href="/bo-the"><Icon name="arrow-left" />Bộ của tôi</Link>
      <div className="form-head">
        <div className="answer-meta"><span className="stamp stamp-quiet"><Icon name={deck.quyenTruyCap === 'RIENG_TU' ? 'lock' : 'globe'} />{deck.quyenTruyCap === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}</span><CopyBadge banSao={deck.banSao} /></div>
        <h1 id="deck-title" className="deck-title">{deck.ten}</h1>
        <div className={styles.authors}>
          <AuthorTag id={me?.id} name={me?.tenHienThi} prefix={deck.banSao ? 'Bản sao của' : 'Tác giả'} you />
          {deck.banSao && <AuthorTag name={deck.banSao.tacGiaGoc || 'Không rõ'} prefix="Tác giả gốc" />}
        </div>
        {deck.moTa && <p>{deck.moTa}</p>}
        <div className={styles.actions}>
          <div className={styles.mainActions}>
            <Link className="btn btn-primary" href={`/hoc?boTheId=${encodeURIComponent(id)}`}><Icon name="play" />Học bộ này</Link>
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(true)}><Icon name="plus" />Thêm thẻ</button>
            <Link className="btn btn-secondary" href={`/bo-the/${id}/tien-do`}><Icon name="chart" />Tiến độ</Link>
            <button className={`btn btn-secondary ${styles.fav}`} type="button" disabled={favorite.isPending} aria-busy={favorite.isPending} aria-pressed={deck.yeuThich} onClick={() => favorite.mutate()}><Icon name="heart" />{deck.yeuThich ? 'Đã yêu thích' : 'Yêu thích'}</button>
          </div>
          <div className={styles.subActions} role="group" aria-label="Quản lý bộ thẻ">
            <Link className="btn btn-edit btn-sm" href={`/bo-the/tao?id=${id}`}><Icon name="edit" />Sửa bộ</Link>
            <Link className="btn btn-secondary btn-sm" href={`/bo-the/${id}/nhap-csv`}><Icon name="upload" />Nhập CSV</Link>
            <button type="button" className="btn btn-secondary btn-sm" disabled={download.isPending} aria-busy={download.isPending} onClick={() => download.mutate()}><Icon name="download" />Xuất CSV</button>
            <button type="button" className="btn btn-danger btn-sm" disabled={remove.isPending} onClick={() => setConfirmation({ type: 'deck' })}><Icon name="trash" />Xóa bộ</button>
          </div>
        </div>
      </div>
      {(favorite.error || remove.error) && <ErrorState description={(favorite.error || remove.error).message} onRetry={refetch} />}
      {download.error && <ErrorState description={download.error.message} onRetry={() => download.mutate()} />}
      {params.get('imported') && <p className="notice notice-success" role="status">Đã nhập {params.get('imported')} thẻ từ CSV.</p>}
      {params.get('saved') && <p className="notice notice-success" role="status">Đã lưu thẻ{params.get('duplicate') ? '. Thẻ có thể trùng với thẻ đã có trong bộ.' : '.'}</p>}
      <div className={styles.listBar}><h2>Thẻ trong bộ <span className="muted num">{cards.data?.totalElements ?? ''}</span></h2><CardImagePreference checked={showImages} onChange={setShowImages} /></div>
      {cards.isLoading && <p role="status">Đang tải thẻ…</p>}
      {cards.error && <ErrorState description={cards.error.message} onRetry={cards.refetch} />}
      {deleteCard.error && <ErrorState description={deleteCard.error.message} onRetry={() => deleteCard.reset()} />}
      {cards.data?.items.length === 0 && <div className="empty"><h2>Chưa có thẻ ở trang này</h2><p>Gõ một từ tiếng Anh hoặc tiếng Việt, từ điển sẽ điền sẵn nghĩa và ví dụ.</p><button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" />Thêm thẻ đầu tiên</button></div>}
      <ol className="answer-list">{cards.data?.items.map((card, index) => <CardEntry
        key={card.id}
        card={card}
        number={page * 20 + index + 1}
        deckId={id}
        showImages={showImages}
        focused={card.id === focusId}
        tagNames={(card.nhanIds || []).map(tagId => tags.data?.find(tag => tag.id === tagId)?.ten || `Nhãn ${tagId}`)}
        tools={<>
          <button type="button" className="btn btn-edit btn-sm" onClick={() => setEditing(card)}><Icon name="edit" />Sửa thẻ</button>
          <button type="button" className="btn btn-danger btn-sm" disabled={deleteCard.isPending} onClick={() => setConfirmation({ type: 'card', card })} ><Icon name="trash" />Xóa thẻ</button>
        </>}
      />)}</ol>
      {cards.data && <Pagination page={page + 1} totalPages={cards.data.totalPages} onPageChange={value => { setFocusId(null); setPage(value - 1); }} />}
      {adding && <QuickAddCardDialog deckId={id} deckName={deck.ten} onClose={() => setAdding(false)} />}
      {editing && <CardEditDialog key={editing.id} card={editing} deckId={id} onClose={() => setEditing(null)} />}
      <ConfirmDialog isOpen={!!confirmation} title={confirmation?.type === 'deck' ? 'Xóa bộ thẻ' : 'Xóa thẻ'} description={`Xóa “${confirmation?.card?.tu || deck.ten}”? Nội dung sẽ được gỡ khỏi danh sách của bạn.`} confirmLabel={confirmation?.type === 'deck' ? 'Xóa bộ' : 'Xóa thẻ'} loading={remove.isPending || deleteCard.isPending} onClose={() => setConfirmation(null)} onConfirm={() => confirmation.type === 'deck' ? remove.mutate(undefined, { onError: () => setConfirmation(null) }) : deleteCard.mutate(confirmation.card, { onError: () => setConfirmation(null) })} />
    </article>
    <aside className="side-col"><section className="panel">
      <h2 className="panel-title">Thông tin bộ thẻ</h2>
      <dl className="kv"><dt>Chủ đề</dt><dd>{topics.find(t => t.id === deck.chuDeId)?.ten || 'Chưa chọn'}</dd>
      <dt>Trình độ</dt><dd>{LEVEL[deck.trinhDo]}</dd><dt>Mục tiêu</dt><dd>{deck.mucTieu === 'TOEIC' ? 'TOEIC' : deck.mucTieu === 'GIAO_TIEP' ? 'Giao tiếp' : 'Chưa chọn'}</dd><dt>Cập nhật</dt><dd>{new Date(deck.updatedAt).toLocaleDateString('vi-VN')}</dd></dl>
    </section>{deck.banSao && <PublishRequestPanel deck={deck} />}</aside>
  </div>;
}
