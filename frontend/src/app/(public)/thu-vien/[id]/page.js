'use client';
import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { libraryPage } from '@/lib/library-query.mjs';
import { ErrorState, Pagination } from '@/components/ui';
import styles from './page.module.css';

export default function LibraryDetailPage({ params }) {
  const { id } = use(params);
  return <Suspense fallback={<p className="page" role="status">Đang tải bộ thẻ…</p>}><LibraryDetail id={id} /></Suspense>;
}

function LibraryDetail({ id }) {
  const router = useRouter();
  const search = useSearchParams();
  const page = libraryPage(search.get('page'));
  const [copyMessage, setCopyMessage] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-deck', id, page],
    queryFn: () => apiFetch(`/api/v1/library/decks/${encodeURIComponent(id)}?page=${page}&size=20`),
  });
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/thu-vien/${encodeURIComponent(id)}`);
      setCopyMessage('Đã sao chép liên kết');
    } catch {
      setCopyMessage('Không sao chép được. Bạn có thể sao chép địa chỉ trên thanh trình duyệt.');
    }
  };
  if (isLoading) return <p className="page" role="status">Đang tải bộ thẻ…</p>;
  if (error) return <div className="page"><ErrorState title={error.status === 404 ? 'Bộ thẻ không còn công khai' : 'Không tải được bộ thẻ'} description={error.message} onRetry={refetch} /><Link href="/thu-vien" className="btn btn-secondary">Về thư viện</Link></div>;
  const { boThe, the } = data;
  return <div className="page page-grid"><section className="sheet">
    <div className="form-head">
      <Link href="/thu-vien">Thư viện bộ thẻ</Link>
      <h1 className={styles.title}>{boThe.ten}</h1>
      <p>{boThe.moTa}</p>
      <p className="muted">{boThe.tenTacGia} — {boThe.soThe} thẻ</p>
      <span className="stamp stamp-solid">{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</span>
      <button type="button" className="btn btn-secondary" onClick={copyLink}>Sao chép liên kết</button>
      {copyMessage && <p role="status">{copyMessage}</p>}
    </div>
    {the.items.length === 0 ? <div className="empty"><h2>Chưa có thẻ ở trang này</h2><p>Chọn trang trước hoặc quay lại thư viện.</p></div> : <ol className={styles.cards}>
      {the.items.map(card => <li key={card.id} className={styles.card}>
        <h2 className={styles.word}>{card.tu}</h2>
        <p className="muted">{[card.tuLoai, card.phienAm].filter(Boolean).join(' — ')}</p>
        <p>{card.nghiaVi}</p>
        {card.viDuEn && <p lang="en">{card.viDuEn}</p>}
        {card.dichVi && <p>{card.dichVi}</p>}
        {card.nguon && <p className="caption">Nguồn: {card.nguon}</p>}
        <div className={styles.media}>
          {card.anhId && <CardMedia deckId={id} cardId={card.id} role="ANH" />}
          {card.amTuId && <CardMedia deckId={id} cardId={card.id} role="AM_TU" />}
          {card.amCauId && <CardMedia deckId={id} cardId={card.id} role="AM_CAU" />}
        </div>
      </li>)}
    </ol>}
    <Pagination page={page + 1} totalPages={the.totalPages} onPageChange={value => router.replace(`/thu-vien/${encodeURIComponent(id)}?page=${value - 1}`, { scroll: false })} />
  </section></div>;
}

function CardMedia({ deckId, cardId, role }) {
  const [enabled, setEnabled] = useState(false);
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['library-media', deckId, cardId, role],
    queryFn: () => apiFetch(`/api/v1/library/decks/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}/files/${role}`),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
  const label = role === 'ANH' ? 'Xem ảnh' : role === 'AM_TU' ? 'Nghe từ' : 'Nghe câu';
  return <div>
    <button type="button" className="btn btn-secondary" disabled={isFetching} onClick={() => enabled ? refetch() : setEnabled(true)}>{isFetching ? 'Đang tải…' : label}</button>
    {error && <p role="alert">{error.message}</p>}
    {data && (role === 'ANH' ? <img className={styles.image} src={data.downloadUrl} alt="Ảnh minh họa từ vựng" /> : <audio controls src={data.downloadUrl} aria-label={label} />)}
  </div>;
}
