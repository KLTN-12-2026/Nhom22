'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { Highlight } from '@/components/ui/Highlight';
import { useSearchSuggest } from '@/hooks/useSearch';
import { clearRecent, matchPages, readRecent, saveRecent } from '@/lib/search-text.mjs';
import styles from './GlobalSearch.module.css';

const DEBOUNCE_MS = 250;

const resultsUrl = (term, tab) => `/tim-kiem?${new URLSearchParams({ q: term, ...(tab ? { tab } : {}) })}`;

function initials(name = '') {
  return (name.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
}

function buildGroups(data, term, pages) {
  const groups = [];
  const pageHits = matchPages(pages, term);
  if (data?.cuaToi) {
    const items = [
      ...data.cuaToi.boThe.items.map(deck => ({ key: `my-deck-${deck.id}`, href: `/bo-the/${deck.id}`, icon: 'decks', title: deck.ten, meta: `${deck.soThe} thẻ` })),
      ...data.cuaToi.tuVung.items.map(card => ({ key: `my-card-${card.id}`, href: `/bo-the/${card.boTheId}?the=${card.id}`, icon: 'notebook', title: card.tu, word: true, meta: `${card.nghiaVi} · ${card.tenBoThe}` })),
    ].slice(0, 5);
    if (items.length) groups.push({ id: 'mine', label: 'Của tôi', items });
  }
  if (data?.tuVung?.items.length) {
    groups.push({ id: 'words', label: 'Từ vựng', tab: 'tu-vung', total: data.tuVung.totalElements, items: data.tuVung.items.map(card => ({
      key: `card-${card.id}`, href: `/thu-vien/${card.boTheId}?the=${card.id}`, title: card.tu, word: true,
      sub: card.phienAm, meta: `${card.nghiaVi} · trong ${card.tenBoThe}`,
    })) });
  }
  if (data?.boThe?.items.length) {
    groups.push({ id: 'decks', label: 'Bộ thẻ', tab: 'bo-the', total: data.boThe.totalElements, items: data.boThe.items.map(deck => ({
      key: `deck-${deck.id}`, href: `/thu-vien/${deck.id}`, icon: 'library', title: deck.ten,
      meta: `${deck.soThe} thẻ · ${deck.tenTacGia || 'Ẩn danh'}`,
    })) });
  }
  if (data?.tacGia?.items.length) {
    groups.push({ id: 'authors', label: 'Tác giả', tab: 'tac-gia', total: data.tacGia.totalElements, items: data.tacGia.items.map(author => ({
      key: `author-${author.id}`, href: `/tac-gia/${author.id}`, avatar: initials(author.tenHienThi), title: author.tenHienThi,
      meta: `${author.soBoThe} bộ công khai · ${author.soThe} thẻ`,
    })) });
  }
  if (data?.chuDe?.length) {
    groups.push({ id: 'topics', label: 'Chủ đề', items: data.chuDe.map(topic => ({
      key: `topic-${topic.id}`, href: `/thu-vien?chuDeId=${topic.id}`, icon: 'folder', title: topic.ten, meta: `${topic.soBoThe} bộ thẻ`,
    })) });
  }
  if (pageHits.length) {
    groups.push({ id: 'pages', label: 'Đi tới trang', items: pageHits.map(page => ({
      key: `page-${page.href}`, href: page.href, icon: page.icon || 'link', title: page.label,
    })) });
  }
  return groups;
}

export function GlobalSearch({ pages = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const [value, setValue] = useState('');
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => { setOpen(false); setExpanded(false); }, [pathname]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if ((event.key === 'k' && (event.ctrlKey || event.metaKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setExpanded(true);
        setOpen(true);
        setRecent(readRecent());
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) { setOpen(false); setExpanded(false); }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const { data, isFetching, error } = useSearchSuggest(term, { enabled: open });
  const groups = useMemo(() => (term && data?.q === term ? buildGroups(data, term, pages) : []), [data, term, pages]);
  const flat = useMemo(() => groups.flatMap(group => group.items), [groups]);
  const typed = value.trim();
  const settled = typed === term;

  useEffect(() => { setActive(-1); }, [term]);

  const close = () => { setOpen(false); setExpanded(false); inputRef.current?.blur(); };

  const go = (href) => {
    if (typed) setRecent(saveRecent(typed));
    close();
    router.push(href);
  };

  const submit = (event) => {
    event.preventDefault();
    if (active >= 0 && flat[active]) return go(flat[active].href);
    if (typed) go(resultsUrl(typed));
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (value) setValue(''); else close();
      return;
    }
    if (!flat.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(index => (index + 1) % flat.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => (index <= 0 ? flat.length - 1 : index - 1)); }
  };

  const activeKey = active >= 0 ? flat[active]?.key : undefined;
  const optionId = key => `${listId}-${key}`;
  const showPanel = open && (typed ? true : recent.length > 0);
  let position = -1;

  return (
    <div ref={rootRef} className={styles.root} data-expanded={expanded || undefined}>
      <button type="button" className={`btn btn-quiet btn-icon ${styles.trigger}`} aria-label="Tìm kiếm" title="Tìm kiếm (Ctrl K)"
        onClick={() => { setExpanded(true); setOpen(true); setRecent(readRecent()); requestAnimationFrame(() => inputRef.current?.focus()); }}>
        <Icon name="search" />
      </button>

      <form role="search" aria-label="Tìm kiếm toàn trang" className={styles.box} onSubmit={submit}>
        <button type="button" className={`btn btn-quiet btn-icon ${styles.back}`} aria-label="Đóng tìm kiếm" onClick={close}>
          <Icon name="x" />
        </button>
        <div className={styles.field}>
          <Icon name="search" />
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            role="combobox"
            aria-label="Tìm từ vựng, bộ thẻ, tác giả"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeKey ? optionId(activeKey) : undefined}
            placeholder="Tìm từ vựng, bộ thẻ, tác giả…"
            autoComplete="off"
            spellCheck={false}
            maxLength={150}
            value={value}
            onChange={event => { setValue(event.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); setRecent(readRecent()); }}
            onKeyDown={onKeyDown}
          />
          <kbd className={styles.kbd} aria-hidden="true">Ctrl K</kbd>
        </div>

        {showPanel && (
          <div className={styles.panel} id={listId} role="listbox" aria-label="Kết quả tìm kiếm">
            {!typed && (
              <div role="group" aria-labelledby={`${listId}-recent`} className={styles.group}>
                <div className={styles.groupHead}>
                  <span id={`${listId}-recent`}>Tìm gần đây</span>
                  <button type="button" className={styles.link} onClick={() => setRecent(clearRecent())}>Xóa lịch sử</button>
                </div>
                {recent.map(item => (
                  <button key={item} type="button" role="option" aria-selected="false" className={styles.option}
                    onClick={() => { setValue(item); inputRef.current?.focus(); }}>
                    <span className={styles.lead}><Icon name="clock" /></span>
                    <span className={styles.text}><span className={styles.title}>{item}</span></span>
                  </button>
                ))}
              </div>
            )}

            {typed && error && (
              <p className={styles.state} role="alert">Không tìm được lúc này. {error.message}</p>
            )}

            {typed && !error && (!settled || (isFetching && !groups.length)) && (
              <p className={styles.state} role="status">Đang tìm “{typed}”…</p>
            )}

            {typed && !error && settled && !isFetching && !groups.length && (
              <p className={styles.state} role="status">Không có kết quả cho “{typed}”. Thử từ ngắn hơn hoặc viết không dấu.</p>
            )}

            {typed && groups.map(group => (
              <div key={group.id} role="group" aria-labelledby={`${listId}-${group.id}`} className={styles.group}>
                <div className={styles.groupHead}>
                  <span id={`${listId}-${group.id}`}>{group.label}</span>
                  {group.tab && group.total > group.items.length && (
                    <Link className={styles.link} href={resultsUrl(typed, group.tab)} onClick={(event) => { event.preventDefault(); go(resultsUrl(typed, group.tab)); }}>
                      Xem {group.total}
                    </Link>
                  )}
                </div>
                {group.items.map(item => {
                  position += 1;
                  const index = position;
                  return (
                    <Link
                      key={item.key}
                      id={optionId(item.key)}
                      href={item.href}
                      role="option"
                      aria-selected={index === active}
                      className={styles.option}
                      onMouseEnter={() => setActive(index)}
                      onClick={(event) => { event.preventDefault(); go(item.href); }}
                    >
                      <span className={styles.lead} aria-hidden="true">
                        {item.avatar ? <span className={styles.avatar}>{item.avatar}</span> : item.word ? <span className={styles.wordMark}>Aa</span> : <Icon name={item.icon} />}
                      </span>
                      <span className={styles.text}>
                        <span className={`${styles.title}${item.word ? ` ${styles.word}` : ''}`}>
                          <Highlight text={item.title} query={term} />
                          {item.sub && <span className={styles.sub}> {item.sub}</span>}
                        </span>
                        {item.meta && <span className={styles.meta}><Highlight text={item.meta} query={term} /></span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}

            {typed && (
              <Link className={styles.all} href={resultsUrl(typed)} onClick={(event) => { event.preventDefault(); go(resultsUrl(typed)); }}>
                <Icon name="search" />
                <span>Xem tất cả kết quả cho “{typed}”</span>
              </Link>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
