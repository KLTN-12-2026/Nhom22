'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, ErrorState, Pagination, ConfirmDialog } from '@/components/ui';
import { CardMedia } from '@/components/content/CardMedia';
import { SpeakButton } from '@/components/content/SpeakButton';
import { CardImagePreference } from '@/components/content/CardImagePreference';
import { useCardImages } from '@/hooks/useCardImages';
import { CardEditDialog } from '@/components/content/CardEditDialog';
import styles from './page.module.css';
import { useDeck } from '@/hooks/useDeck';
import { useTopics } from '@/hooks/useTopics';
import { apiFetch } from '@/lib/api-client';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
export default function DeckDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const [showImages, setShowImages] = useCardImages();
  const { data: deck, isLoading, error, refetch } = useDeck(id);
  const { data: topics = [] } = useTopics();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const tags = useQuery({ queryKey: ['public-tags', 'detail'], queryFn: () => apiFetch('/api/v1/public/tags?size=100') });
  const cards = useQuery({ queryKey: ['deck-cards', id, page], queryFn: () => apiFetch(`/api/v1/decks/${id}/cards?page=${page}&size=20`) });
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
        <div className="answer-meta"><span className="stamp stamp-quiet"><Icon name={deck.quyenTruyCap === 'RIENG_TU' ? 'lock' : 'globe'} />{deck.quyenTruyCap === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}</span></div>
        <h1 id="deck-title" className="deck-title">{deck.ten}</h1>
        {deck.moTa && <p>{deck.moTa}</p>}
        <div className="row">
          <Link className="btn btn-primary" href={`/bo-the/${id}/the-tao`}><Icon name="plus" />Thêm thẻ</Link>
          <Link className="btn btn-edit" href={`/bo-the/tao?id=${id}`}><Icon name="edit" />Sửa bộ</Link>
          <button className="btn btn-secondary btn-favorite" disabled={favorite.isPending} aria-pressed={deck.yeuThich} onClick={() => favorite.mutate()}><Icon name="star" />{deck.yeuThich ? 'Gỡ yêu thích' : 'Yêu thích'}</button>
          <button className="btn btn-danger" disabled={remove.isPending} onClick={() => setConfirmation({ type: 'deck' })}><Icon name="trash" />Xóa bộ</button>
        </div>
      </div>
      {(favorite.error || remove.error) && <ErrorState description={(favorite.error || remove.error).message} onRetry={refetch} />}
      {deck.boNguonId && <p className="muted">Bản sao độc lập từ <Link href={`/thu-vien/${deck.boNguonId}`}>bộ nguồn</Link>. Bộ nguồn có thể không còn công khai.</p>}
      {params.get('saved') && <p className="notice notice-success" role="status">Đã lưu thẻ{params.get('duplicate') ? '. Thẻ có thể trùng với thẻ đã có trong bộ.' : '.'}</p>}
      <div className={styles.listBar}><h2>Thẻ trong bộ <span className="muted num">{cards.data?.totalElements ?? ''}</span></h2><CardImagePreference checked={showImages} onChange={setShowImages} /></div>
      {cards.isLoading && <p role="status">Đang tải thẻ…</p>}
      {cards.error && <ErrorState description={cards.error.message} onRetry={cards.refetch} />}
      {deleteCard.error && <ErrorState description={deleteCard.error.message} onRetry={() => deleteCard.reset()} />}
      {cards.data?.items.length === 0 && <div className="empty"><h2>Chưa có thẻ ở trang này</h2><p>Thêm thẻ mới hoặc chọn trang trước.</p></div>}
      <ol className="answer-list">{cards.data?.items.map((card, index) => <li className={`answer-row ${styles.cardRow}`} key={card.id}>
        <span className="answer-no">{page * 20 + index + 1}</span>
        <div className="entry"><div className="entry-head"><span className="entry-word" lang="en">{card.tu}</span>{card.phienAm && <span className="entry-ipa">{card.phienAm}</span>}{card.tuLoai && <span className="pos">{card.tuLoai}</span>}</div><p className="entry-mean">{card.nghiaVi}</p>{card.viDuEn && <p className="entry-example" lang="en">{card.viDuEn}</p>}{card.dichVi && <p className="muted small">{card.dichVi}</p>}{card.nguon && <p className="caption">Nguồn: {card.nguon}</p>}{card.trung && <span className="stamp stamp-warning">Có thể trùng</span>}
          <div className="answer-meta"><span className="stamp stamp-quiet">Độ khó {card.doKho}/5</span>{card.nhanIds?.map(tagId => <span className="stamp stamp-quiet" key={tagId}>{tags.data?.items.find(tag => tag.id === tagId)?.ten || `Nhãn ${tagId}`}</span>)}</div><div className={styles.cardFlags}>{card.anhId && <CardMedia key={`image-${card.id}-${showImages}`} autoShow={showImages} deckId={id} cardId={card.id} role="ANH" />}{!card.amTuId && <SpeakButton text={card.tu} />}{!card.amCauId && card.viDuEn && <SpeakButton sentence text={card.viDuEn} />}{card.amTuId && <CardMedia deckId={id} cardId={card.id} role="AM_TU" />}{card.amCauId && <CardMedia deckId={id} cardId={card.id} role="AM_CAU" />}</div>
        </div>
        <div className={styles.cardTools}><button className="btn btn-edit btn-sm" onClick={() => setEditing(card)}><Icon name="edit" />Sửa thẻ</button><button className="btn btn-danger btn-sm" disabled={deleteCard.isPending} onClick={() => setConfirmation({ type: 'card', card })}><Icon name="trash" />Xóa thẻ</button></div>
      </li>)}</ol>
      {cards.data && <Pagination page={page + 1} totalPages={cards.data.totalPages} onPageChange={value => setPage(value - 1)} />}
      {editing && <CardEditDialog key={editing.id} card={editing} deckId={id} onClose={() => setEditing(null)} />}
      <ConfirmDialog isOpen={!!confirmation} title={confirmation?.type === 'deck' ? 'Xóa bộ thẻ' : 'Xóa thẻ'} description={`Xóa “${confirmation?.card?.tu || deck.ten}”? Nội dung sẽ được gỡ khỏi danh sách của bạn.`} confirmLabel={confirmation?.type === 'deck' ? 'Xóa bộ' : 'Xóa thẻ'} loading={remove.isPending || deleteCard.isPending} onClose={() => setConfirmation(null)} onConfirm={() => confirmation.type === 'deck' ? remove.mutate(undefined, { onError: () => setConfirmation(null) }) : deleteCard.mutate(confirmation.card, { onError: () => setConfirmation(null) })} />
    </article>
    <aside className="side-col"><section className="panel">
      <h2 className="panel-title">Thông tin bộ thẻ</h2>
      <dl className="kv"><dt>Chủ đề</dt><dd>{topics.find(t => t.id === deck.chuDeId)?.ten || 'Chưa chọn'}</dd>
      <dt>Trình độ</dt><dd>{LEVEL[deck.trinhDo]}</dd><dt>Mục tiêu</dt><dd>{deck.mucTieu === 'TOEIC' ? 'TOEIC' : deck.mucTieu === 'GIAO_TIEP' ? 'Giao tiếp' : 'Chưa chọn'}</dd><dt>Cập nhật</dt><dd>{new Date(deck.updatedAt).toLocaleDateString('vi-VN')}</dd></dl>
    </section></aside>
  </div>;
}
