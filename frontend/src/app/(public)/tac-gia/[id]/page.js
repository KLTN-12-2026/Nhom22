'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { LibraryDeckList } from '@/components/content/LibraryDeckList';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';
import { useLibraryAuthor } from '@/hooks/useSearch';
import { useMe } from '@/hooks/useMe';
import { libraryPage } from '@/lib/library-query.mjs';
import styles from './page.module.css';

const SIZE = 20;
const initial = name => (name.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
const monthYear = value => (value ? new Date(value).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : null);

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

  const { data: me } = useMe();
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
  const isMe = Boolean(me && profile && String(me.id) === String(profile.id));
  const joined = monthYear(profile?.thamGiaAt);
  const badges = profile?.huyHieu || [];

  return (
    <div className={`page ${styles.profile}`}>
      <aside className={styles.side} aria-labelledby="page-title" aria-busy={author.isLoading}>
        <span className={styles.avatar} aria-hidden="true">
          {profile?.anhDaiDienUrl ? <img src={profile.anhDaiDienUrl} alt="" /> : profile ? initial(profile.tenHienThi) : ''}
        </span>
        <div className={styles.names}>
          <h1 id="page-title" className={styles.name}>{profile ? profile.tenHienThi : 'Đang tải…'}</h1>
          <p className={styles.role}>{isMe ? 'Hồ sơ công khai của bạn' : 'Tác giả bộ thẻ công khai'}</p>
        </div>
        {isMe && <Link className={`btn btn-secondary btn-block ${styles.edit}`} href="/ca-nhan">Chỉnh sửa hồ sơ</Link>}
        {profile && (
          <ul className={styles.meta} role="list">
            <li><Icon name="decks" /><span><b>{profile.soBoThe}</b> bộ công khai · <b>{profile.soThe.toLocaleString('vi-VN')}</b> thẻ</span></li>
            {joined && <li><Icon name="calendar" /><span>Tham gia {joined}</span></li>}
          </ul>
        )}
        {profile && (
          <section className={styles.badges} aria-labelledby="badges-title">
            <h2 id="badges-title" className={styles.sectionTitle}>Huy hiệu <span className={styles.count}>{badges.length}</span></h2>
            {badges.length ? (
              <ul className={styles.badgeList} role="list">
                {badges.map(b => <li key={b.ma} title={`${b.ten} — ${b.moTa}`}><span className={styles.badge} aria-label={b.ten}>{b.ten.slice(0, 1)}</span></li>)}
              </ul>
            ) : <p className={styles.empty}>Chưa có huy hiệu.</p>}
          </section>
        )}
        <p className={styles.back}><Link href="/thu-vien"><Icon name="arrow-left" />Về thư viện</Link></p>
      </aside>

      <section className={styles.main} aria-labelledby="decks-title">
        <nav className={styles.tabs} aria-label="Hồ sơ tác giả">
          <span className={styles.tab} aria-current="page">
            <Icon name="library" />Bộ thẻ công khai{decks.data && <span className={styles.count}>{decks.data.totalElements}</span>}
          </span>
        </nav>
        <h2 id="decks-title" className="sr-only">Bộ thẻ công khai</h2>

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
      </section>
    </div>
  );
}
