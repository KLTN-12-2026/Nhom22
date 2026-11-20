'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { Highlight } from '@/components/ui/Highlight';
import { LibraryDeckList } from '@/components/content/LibraryDeckList';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';
import { useSearchAuthors, useSearchCards, useSearchSuggest } from '@/hooks/useSearch';
import { libraryPage } from '@/lib/library-query.mjs';
import { saveRecent } from '@/lib/search-text.mjs';
import styles from './page.module.css';

const SIZE = 20;
const TABS = [
  { id: 'tat-ca', label: 'Tất cả' },
  { id: 'tu-vung', label: 'Từ vựng' },
  { id: 'bo-the', label: 'Bộ thẻ' },
  { id: 'tac-gia', label: 'Tác giả' },
];

export default function SearchPage() {
  return <Suspense fallback={<p className="page" role="status">Đang tải kết quả…</p>}><SearchContent /></Suspense>;
}

function SearchContent() {
  const router = useRouter();
  const search = useSearchParams();
  const q = (search.get('q') || '').trim();
  const tab = TABS.some(item => item.id === search.get('tab')) ? search.get('tab') : 'tat-ca';
  const page = libraryPage(search.get('page'));
  const [draft, setDraft] = useState(q);

  useEffect(() => { setDraft(q); if (q) saveRecent(q); }, [q]);

  const navigate = (next) => {
    const params = new URLSearchParams({ q, tab, ...next });
    if (params.get('tab') === 'tat-ca') params.delete('tab');
    if (!next.page) params.delete('page');
    router.push(`/tim-kiem?${params}`, { scroll: false });
  };

  const suggest = useSearchSuggest(q, { enabled: tab === 'tat-ca' });
  const cards = useSearchCards(q, page, SIZE, tab === 'tu-vung');
  const decks = useLibraryDecks({ q, page, size: SIZE }, { enabled: Boolean(q) && tab === 'bo-the' });
  const authors = useSearchAuthors(q, page, SIZE, tab === 'tac-gia');

  const counts = {
    'tu-vung': tab === 'tu-vung' ? cards.data?.totalElements : suggest.data?.tuVung.totalElements,
    'bo-the': tab === 'bo-the' ? decks.data?.totalElements : suggest.data?.boThe.totalElements,
    'tac-gia': tab === 'tac-gia' ? authors.data?.totalElements : suggest.data?.tacGia.totalElements,
  };

  return (
    <div className="page">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tìm kiếm</span><span>Thư viện công khai</span></div>
          <h1 id="page-title">{q ? <>Kết quả cho “{q}”</> : 'Tìm kiếm'}</h1>
          <p>Tìm từ vựng trong các bộ công khai, bộ thẻ và tác giả. Gõ có dấu hoặc không dấu đều được.</p>
        </div>

        <form className={styles.form} role="search" aria-label="Tìm kiếm" onSubmit={(event) => {
          event.preventDefault();
          const value = draft.trim();
          if (value) router.push(`/tim-kiem?${new URLSearchParams({ q: value, ...(tab !== 'tat-ca' ? { tab } : {}) })}`);
        }}>
          <div className="input-with-icon">
            <Icon name="search" />
            <input className="input" type="search" aria-label="Từ khóa" placeholder="Ví dụ: invoice, sân bay, Lan…"
              autoComplete="off" maxLength={150} value={draft} onChange={event => setDraft(event.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>Tìm</button>
        </form>

        {q && (
          <div className={`tabs__list ${styles.tabs}`} role="tablist" aria-label="Loại kết quả">
            {TABS.map(item => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id}
                className={`tabs__tab${tab === item.id ? ' tabs__tab--active' : ''}`}
                onClick={() => navigate({ tab: item.id })}>
                {item.label}{counts[item.id] != null && <span className={styles.count}>{counts[item.id]}</span>}
              </button>
            ))}
          </div>
        )}

        <div role="tabpanel" aria-label={TABS.find(item => item.id === tab)?.label} className={styles.panel}>
          {!q && <Empty title="Nhập từ khóa để bắt đầu" text="Thử một từ tiếng Anh, nghĩa tiếng Việt, tên bộ thẻ hoặc tên tác giả." />}
          {q && tab === 'tat-ca' && <Overview query={suggest} q={q} onTab={id => navigate({ tab: id })} />}
          {q && tab === 'tu-vung' && (
            <Paged query={cards} empty="Không có từ vựng nào khớp" onPage={value => navigate({ page: String(value) })}>
              {data => <CardList cards={data.items} q={q} offset={data.page * data.size} />}
            </Paged>
          )}
          {q && tab === 'bo-the' && (
            <Paged query={decks} empty="Không có bộ thẻ nào khớp" onPage={value => navigate({ page: String(value) })}>
              {data => <LibraryDeckList decks={data.items} offset={data.page * data.size} query={q} />}
            </Paged>
          )}
          {q && tab === 'tac-gia' && (
            <Paged query={authors} empty="Không có tác giả nào khớp" onPage={value => navigate({ page: String(value) })}>
              {data => <AuthorList authors={data.items} q={q} offset={data.page * data.size} />}
            </Paged>
          )}
        </div>
      </section>
    </div>
  );
}

function Paged({ query, empty, onPage, children }) {
  const { data, isLoading, error, refetch } = query;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (isLoading || !data) return <Loading />;
  if (!data.items.length) return <Empty title={empty} text="Thử từ ngắn hơn, viết không dấu hoặc đổi sang loại kết quả khác." />;
  return (
    <>
      {children(data)}
      <Pagination page={data.page + 1} totalPages={data.totalPages} onPageChange={value => onPage(value - 1)} />
    </>
  );
}

function Overview({ query, q, onTab }) {
  const { data, isLoading, error, refetch } = query;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (isLoading || !data) return <Loading />;
  const mine = data.cuaToi;
  const nothing = !data.tuVung.items.length && !data.boThe.items.length && !data.tacGia.items.length
    && !data.chuDe.length && !(mine && (mine.boThe.items.length || mine.tuVung.items.length));
  if (nothing) return <Empty title={`Không có kết quả cho “${q}”`} text="Thử từ ngắn hơn hoặc viết không dấu." />;

  return (
    <div className={styles.sections}>
      {mine && (mine.boThe.items.length > 0 || mine.tuVung.items.length > 0) && (
        <Section title="Của tôi">
          <ul className={styles.chips}>
            {mine.boThe.items.map(deck => (
              <li key={deck.id}><Link className={styles.chip} href={`/bo-the/${deck.id}`}><Icon name="decks" /><Highlight text={deck.ten} query={q} /></Link></li>
            ))}
          </ul>
          {mine.tuVung.items.length > 0 && <CardList cards={mine.tuVung.items} q={q} own />}
        </Section>
      )}
      {data.tuVung.items.length > 0 && (
        <Section title="Từ vựng" total={data.tuVung.totalElements} onMore={() => onTab('tu-vung')}>
          <CardList cards={data.tuVung.items} q={q} />
        </Section>
      )}
      {data.boThe.items.length > 0 && (
        <Section title="Bộ thẻ" total={data.boThe.totalElements} onMore={() => onTab('bo-the')}>
          <LibraryDeckList decks={data.boThe.items} query={q} />
        </Section>
      )}
      {data.tacGia.items.length > 0 && (
        <Section title="Tác giả" total={data.tacGia.totalElements} onMore={() => onTab('tac-gia')}>
          <AuthorList authors={data.tacGia.items} q={q} />
        </Section>
      )}
      {data.chuDe.length > 0 && (
        <Section title="Chủ đề">
          <ul className={styles.chips}>
            {data.chuDe.map(topic => (
              <li key={topic.id}>
                <Link className={styles.chip} href={`/thu-vien?chuDeId=${topic.id}`}>
                  <Icon name="folder" /><Highlight text={topic.ten} query={q} /><span className="muted">{topic.soBoThe} bộ</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, total, onMore, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className="panel-title">{title}</h2>
        {onMore && total > 5 && <button type="button" className="btn btn-quiet" onClick={onMore}>Xem tất cả {total}</button>}
      </div>
      {children}
    </section>
  );
}

function CardList({ cards, q, offset = 0, own = false }) {
  return (
    <ol className="answer-list" role="list">
      {cards.map((card, i) => (
        <li key={card.id} className={`answer-row ${styles.cardRow}`}>
          <span className="answer-no">{offset + i + 1}</span>
          <div className="answer-main">
            <p className={styles.word}>
              <Link href={own ? `/bo-the/${card.boTheId}?the=${card.id}` : `/thu-vien/${card.boTheId}?the=${card.id}`}><Highlight text={card.tu} query={q} /></Link>
              {card.phienAm && <span className={styles.ipa}>{card.phienAm}</span>}
              {card.tuLoai && <span className="stamp stamp-graphite">{card.tuLoai}</span>}
            </p>
            <p className={styles.meaning}><Highlight text={card.nghiaVi} query={q} /></p>
            <p className="answer-meta"><Icon name="decks" /><span>{own ? 'Bộ của tôi' : 'Trong bộ'}: {card.tenBoThe}</span></p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AuthorList({ authors, q, offset = 0 }) {
  return (
    <ol className="answer-list" role="list">
      {authors.map((author, i) => (
        <li key={author.id} className={`answer-row ${styles.authorRow}`}>
          <span className="answer-no">{offset + i + 1}</span>
          <span className={styles.avatar} aria-hidden="true">{(author.tenHienThi.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase()}</span>
          <div className="answer-main">
            <Link className="answer-title" href={`/tac-gia/${author.id}`}><Highlight text={author.tenHienThi} query={q} /></Link>
            <p className="answer-meta"><span>{author.soBoThe} bộ công khai</span><span>{author.soThe} thẻ</span></p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Loading() {
  return (
    <div className="skeleton" role="status" aria-label="Đang tìm">
      <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div className="empty">
      <div className="empty-sheet" aria-hidden="true">
        <span data-n="1"><i></i><i></i><i></i><i></i></span>
        <span data-n="2"><i></i><i></i><i></i><i></i></span>
        <span data-n="3"><i></i><i></i><i></i><i></i></span>
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="btn btn-secondary" href="/thu-vien">Mở thư viện</Link>
    </div>
  );
}
