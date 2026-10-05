'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon, ErrorState } from '@/components/ui';
import { useDeck } from '@/hooks/useDeck';
import { useTopics } from '@/hooks/useTopics';
import { apiFetch } from '@/lib/api-client';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
export default function DeckDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const client = useQueryClient();
  const { data: deck, isLoading, error, refetch } = useDeck(id);
  const { data: topics = [] } = useTopics();
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
          <Link className="btn btn-quiet" href={`/bo-the/tao?id=${id}`}><Icon name="edit" />Sửa bộ</Link>
          <button className="btn btn-secondary" disabled={favorite.isPending} aria-pressed={deck.yeuThich} onClick={() => favorite.mutate()}>{deck.yeuThich ? 'Gỡ yêu thích' : 'Yêu thích'}</button>
          <button className="btn btn-danger" disabled={remove.isPending} onClick={() => { if (window.confirm(`Xóa bộ “${deck.ten}”?`)) remove.mutate(); }}>Xóa bộ</button>
        </div>
      </div>
      {(favorite.error || remove.error) && <ErrorState description={(favorite.error || remove.error).message} onRetry={refetch} />}
      <p>Thẻ, tiến độ học và CSV chưa được hỗ trợ trong phiên bản hiện tại.</p>
    </article>
    <aside className="side-col"><section className="panel">
      <h2 className="panel-title">Thông tin bộ thẻ</h2>
      <dl className="kv"><dt>Chủ đề</dt><dd>{topics.find(t => t.id === deck.chuDeId)?.ten || 'Chưa chọn'}</dd>
      <dt>Trình độ</dt><dd>{LEVEL[deck.trinhDo]}</dd><dt>Cập nhật</dt><dd>{new Date(deck.updatedAt).toLocaleDateString('vi-VN')}</dd></dl>
    </section></aside>
  </div>;
}
