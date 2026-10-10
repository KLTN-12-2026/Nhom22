'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDeck } from '@/hooks/useDeck';
import { Icon, ErrorState } from '@/components/ui';
import { CardEditor } from '@/components/content/CardEditor';

export default function AddCardPage() {
  const { id } = useParams();
  const router = useRouter();
  const deck = useDeck(id);
  if (deck.isPending) return <div className="page sheet skeleton"><div className="sk sk-title" /><div className="sk sk-row" /></div>;
  if (deck.error) return <div className="page sheet"><ErrorState description={deck.error.message} onRetry={deck.refetch} /></div>;
  return <div className="page">
    <CardEditor deckId={id} heading={<div className="form-head"><div className="form-code"><span>Phiếu thêm thẻ</span></div><Link className="btn btn-quiet" href={`/bo-the/${id}`}><Icon name="arrow-left" />{deck.data.ten}</Link><h1>Thêm thẻ</h1></div>} onSaved={card => router.push(`/bo-the/${id}?saved=${card.id}${card.trung ? '&duplicate=1' : ''}`)} onCancel={() => router.push(`/bo-the/${id}`)} />
  </div>;
}
