'use client';
import { Suspense, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useMe } from '@/hooks/useMe';
import { ErrorState, Icon } from '@/components/ui';
import { DictionaryEntry } from '@/components/dictionary/DictionaryEntry';
import { AddToDeckDialog } from '@/components/dictionary/AddToDeckDialog';
import { DICTIONARY_SOURCE, DIRECTIONS, cardFromSense, dictionaryHref, direction, ipa } from '@/lib/dictionary.mjs';
import styles from './page.module.css';

const DEBOUNCE_MS = 200;
const SAMPLES = { ANH_VIET: ['run', 'take', 'beautiful', 'look forward to', 'environment'], VIET_ANH: ['học', 'nhà', 'yêu', 'bạn bè', 'cam on'] };

export default function DictionaryPage() {
  return <Suspense fallback={<p className="page" role="status">Đang mở từ điển…</p>}><DictionaryContent /></Suspense>;
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

function DictionaryContent() {
  const search = useSearchParams();
  const q = (search.get('q') || '').trim();
  const dir = direction(search.get('chieu'));
  return <DictionaryView key={`${dir.id}|${q}`} q={q} dir={dir} />;
}

function DictionaryView({ q, dir }) {
  const router = useRouter();
  const [draft, setDraft] = useState(q);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [card, setCard] = useState(null);
  const [cardKey, setCardKey] = useState(0);
  const listId = useId();
  const { data: me } = useMe();

  const term = useDebounced(draft.trim(), DEBOUNCE_MS);
  const suggest = useQuery({
    queryKey: ['dictionary-suggest', dir.id, term],
    queryFn: () => apiFetch(`/api/v1/dictionary/suggest?${new URLSearchParams({ q: term, chieu: dir.id, limit: '8' })}`),
    enabled: open && term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60000
  });
  const lookup = useQuery({
    queryKey: ['dictionary-lookup', dir.id, q],
    queryFn: () => apiFetch(`/api/v1/dictionary/lookup?${new URLSearchParams({ q, chieu: dir.id })}`),
    enabled: q.length > 0,
    staleTime: 300000
  });

  const go = (word, chieu = dir.id) => {
    const value = word.trim();
    if (!value) return;
    setOpen(false);
    router.push(dictionaryHref(value, chieu), { scroll: false });
  };
  const items = open && term ? (suggest.data || []) : [];
  const onKeyDown = event => {
    if (!items.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => (i + 1) % items.length); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => (i <= 0 ? items.length : i) - 1); }
    else if (event.key === 'Escape') setOpen(false);
    else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); go(items[active].tu); }
  };
  const switchDir = id => router.push(q ? dictionaryHref(q, id) : (id === 'ANH_VIET' ? '/tu-dien' : `/tu-dien?chieu=${id}`), { scroll: false });
  const pick = (entry, sense) => { setCardKey(k => k + 1); setCard(cardFromSense(entry, sense)); };
  const result = lookup.data;

  return <div className="page page-grid with-side">
    <section className="sheet" aria-labelledby="page-title">
      <div className="form-head">
        <div className="form-code"><span>Từ điển</span><span>Anh – Việt · Việt – Anh</span></div>
        <h1 id="page-title">Tra từ</h1>
        <p>Gõ một từ để xem phiên âm, từ loại, nghĩa và câu ví dụ.{me ? ' Bấm “Tạo thẻ” cạnh một nghĩa để lưu nó vào bộ của bạn.' : ' Đăng nhập để lưu nghĩa thành thẻ học.'}</p>
      </div>

      <div className="tabs" role="tablist" aria-label="Chiều tra">
        {DIRECTIONS.map(item => <button key={item.id} type="button" role="tab" className="tab" aria-selected={item.id === dir.id} onClick={() => switchDir(item.id)}>{item.label}</button>)}
      </div>

      <form className={styles.search} role="search" onSubmit={event => { event.preventDefault(); go(active >= 0 && items[active] ? items[active].tu : draft); }}>
        <div className={styles.box}>
          <Icon name="search" className={styles.searchIcon} />
          <input
            className={`input ${styles.input}`}
            type="search"
            lang={dir.lang}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={120}
            placeholder={dir.placeholder}
            aria-label={`Từ cần tra, ${dir.label}`}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={draft}
            onChange={event => { setDraft(event.target.value); setOpen(true); setActive(-1); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
          />
          {items.length > 0 && <ul id={listId} role="listbox" className={styles.suggest}>
            {items.map((item, i) => <li key={item.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? styles.activeOption : undefined} onMouseDown={event => { event.preventDefault(); go(item.tu); }}>
              <span className={styles.optWord} lang={dir.lang}>{item.tu}</span>
              {item.phienAm && <span className="entry-ipa">{ipa(item.phienAm)}</span>}
              {item.tomTat && <span className={styles.optSum}>{item.tomTat}</span>}
            </li>)}
          </ul>}
        </div>
        <button type="submit" className="btn btn-primary btn-lg">Tra</button>
      </form>

      {!q ? <div className={styles.welcome}>
        <p className="small muted">Thử tra:</p>
        <div className={styles.chips}>{SAMPLES[dir.id].map(word => <Link key={word} className={styles.chip} href={dictionaryHref(word, dir.id)} lang={dir.lang}>{word}</Link>)}</div>
        <p className="small muted">Tra Việt – Anh được cả khi gõ không dấu, ví dụ “hoc” sẽ gợi ý “học”, “hóc”, “hộc”.</p>
      </div>
        : lookup.isPending ? <div className="skeleton" role="status" aria-label="Đang tra"><div className="sk sk-title" /><div className="sk sk-line" /><div className="sk sk-line" /></div>
          : lookup.isError ? <ErrorState description={lookup.error.message || 'Chưa tra được từ này.'} onRetry={lookup.refetch} />
            : result.ketQua.length === 0 ? <div className={styles.empty}>
              <p className="notice notice-warning" role="status">Từ điển chưa có “{q}” ({dir.label}).</p>
              {result.goiY.length > 0 ? <>
                <p className="small muted">Có phải bạn muốn tra:</p>
                <div className={styles.chips}>{result.goiY.map(item => <Link key={item.id} className={styles.chip} href={dictionaryHref(item.tu, dir.id)} lang={dir.lang}>{item.tu}</Link>)}</div>
              </> : <p className="small muted">Kiểm tra chính tả hoặc đổi chiều tra{dir.id === 'ANH_VIET' ? ' sang Việt → Anh' : ' sang Anh → Việt'}.</p>}
              <button type="button" className="btn btn-secondary" onClick={() => switchDir(dir.id === 'ANH_VIET' ? 'VIET_ANH' : 'ANH_VIET')}>Tra “{q}” theo chiều {dir.id === 'ANH_VIET' ? 'Việt → Anh' : 'Anh → Việt'}</button>
            </div>
              : <div className={styles.results}>
                {result.ketQua.map(entry => <DictionaryEntry key={entry.id} entry={entry} onPick={me ? sense => pick(entry, sense) : undefined} />)}
                {!me && dir.id === 'ANH_VIET' && <p className="notice"><Link href={`/dang-nhap?next=${encodeURIComponent(dictionaryHref(q, dir.id))}`}>Đăng nhập</Link> để lưu từ này thành thẻ học.</p>}
              </div>}
    </section>

    <aside className="side-col">
      {q && result?.ketQua?.length > 0 && result.goiY.length > 0 && <section className="panel" aria-labelledby="near-title">
        <h2 className="panel-title" id="near-title">Từ gần giống</h2>
        <ul className={styles.near} role="list">
          {result.goiY.map(item => <li key={item.id}>
            <Link href={dictionaryHref(item.tu, dir.id)} lang={dir.lang}>{item.tu}</Link>
            {item.tomTat && <span className="small muted">{item.tomTat}</span>}
          </li>)}
        </ul>
      </section>}

      <section className="panel" aria-labelledby="src-title">
        <h2 className="panel-title" id="src-title">Nguồn dữ liệu</h2>
        <p className="small">Dữ liệu từ điển lấy từ <a href={DICTIONARY_SOURCE.url} target="_blank" rel="noopener noreferrer">{DICTIONARY_SOURCE.name}</a>, do {DICTIONARY_SOURCE.author} biên soạn.</p>
        <p className="small muted">Phát hành theo giấy phép <a href={DICTIONARY_SOURCE.licenseUrl} target="_blank" rel="noopener noreferrer">{DICTIONARY_SOURCE.license}</a>. VocabLearning chỉ chuyển định dạng để tra cứu, không thay đổi nội dung.</p>
        <p className="small muted">Khoảng 103.000 mục Anh – Việt và 23.000 mục Việt – Anh. Thẻ tạo từ từ điển tự ghi nguồn này.</p>
      </section>
    </aside>

    {card && <AddToDeckDialog key={cardKey} card={card} onClose={() => setCard(null)} />}
  </div>;
}
