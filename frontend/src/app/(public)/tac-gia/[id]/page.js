'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { LibraryDeckList } from '@/components/content/LibraryDeckList';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';
import { useLibraryAuthor } from '@/hooks/useSearch';
import { libraryPage } from '@/lib/library-query.mjs';
import styles from './page.module.css';

const SIZE = 20;

export default function AuthorPage() {
  return <Suspense fallback={<p className="page" role="status">Đang tải tác giả…</p>}><AuthorContent /></Suspense>;
}

function AuthorContent() {
  const { id } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const sort = ['updated', 'name', 'size'].includes(search.get('sort')) ? search.get('sort') : 'updated';
  const page = libraryPage(search.get('page'));
  const validId = /^[1-9][0-9]{0,18}$/.test(String(id || ''));

  const author = useLibraryAuthor(validId ? id : null);
  const decks = useLibraryDecks({ chuSoHuuId: id, sort, page, size: SIZE }, { enabled: validId && Boolean(author.data) });

  const change = (key, value) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.replace(`/tac-gia/${id}?${next}`, { scroll: false });
  };

  if (!validId || author.error?.status === 404) {
    return (
      <div className="page">
        <section className="sheet">
          <div className="empty">
            <h1>Không tìm thấy tác giả</h1>
            <p>Tác giả không tồn tại hoặc chưa chia sẻ bộ thẻ công khai nào.</p>
            <Link className="btn btn-secondary" href="/thu-vien">Mở thư viện</Link>
          </div>
        </section>
      </div>
    );
  }

  if (author.error) {
    return <div className="page"><ErrorState description={author.error.message} onRetry={author.refetch} /></div>;
  }

  const profile = author.data;
  const items = decks.data?.items || [];

  return (
    <div className="page">
      <section className="sheet deck-list-sheet" aria-labelledby="page-title" aria-busy={author.isLoading}>
        <div className={`form-head ${styles.head}`}>
          <div className="form-code"><span>Tác giả</span><span>Bộ thẻ công khai</span></div>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {profile ? (profile.tenHienThi.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase() : ''}
            </span>
            <div className={styles.name}>
              <h1 id="page-title">{profile ? profile.tenHienThi : 'Đang tải…'}</h1>
              {profile && (
                <p className={styles.stats}>
                  <span><strong>{profile.soBoThe}</strong> bộ công khai</span>
                  <span><strong>{profile.soThe}</strong> thẻ</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.bar}>
          <p className="muted" aria-live="polite">{decks.data ? `${decks.data.totalElements} bộ thẻ` : ''}</p>
          <label className={styles.sort}>
            <span className="caption">Sắp xếp</span>
            <select className="select" value={sort} onChange={event => change('sort', event.target.value)}>
              <option value="updated">Mới cập nhật</option>
              <option value="name">Tên A–Z</option>
              <option value="size">Nhiều thẻ nhất</option>
            </select>
          </label>
        </div>

        {decks.error && <ErrorState description={decks.error.message} onRetry={decks.refetch} />}
        {!decks.error && (author.isLoading || decks.isLoading) && (
          <div className="skeleton" role="status" aria-label="Đang tải bộ thẻ">
            <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
          </div>
        )}
        {!decks.error && decks.data && items.length === 0 && (
          <div className="empty">
            <h2>Chưa có bộ thẻ công khai</h2>
            <p>Tác giả này chưa chia sẻ bộ thẻ nào.</p>
          </div>
        )}
        {items.length > 0 && <LibraryDeckList decks={items} offset={page * SIZE} showAuthor={false} />}
        <Pagination page={page + 1} totalPages={decks.data?.totalPages || 0} onPageChange={value => change('page', String(value - 1))} />

        <p className={styles.back}>
          <Link href="/thu-vien"><Icon name="arrow-left" />Về thư viện</Link>
        </p>
      </section>
    </div>
  );
}
