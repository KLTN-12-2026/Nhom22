'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { englishTerms, hasVietnamese, ipa } from '@/lib/dictionary.mjs';
import { Icon } from '@/components/ui';
import styles from './WordCombobox.module.css';

const DEBOUNCE_MS = 160;

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

const get = (path, params) => apiFetch(`/api/v1/dictionary/${path}?${new URLSearchParams(params)}`);

function buildGroups(term, av, meaning, va) {
  const seen = new Set();
  const take = item => { const key = item.tu.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; };
  const english = { id: 'en', label: 'Từ tiếng Anh', items: (av || []).map(item => ({ tu: item.tu, ipa: ipa(item.phienAm), sub: item.tomTat })) };
  const byMeaning = { id: 'meaning', label: `Từ tiếng Anh mang nghĩa “${term}”`, items: (meaning || []).map(item => ({ tu: item.tu, ipa: ipa(item.phienAm), sub: item.tomTat, hint: term })) };
  const reverse = { id: 'va', label: 'Từ điển Việt – Anh', items: (va || []).flatMap(item => englishTerms(item.tomTat).slice(0, 3).map(word => ({ tu: word, sub: `${item.tu}: ${item.tomTat}`, hint: item.tu }))) };
  const order = hasVietnamese(term) ? [byMeaning, reverse, english] : [english, byMeaning, reverse];
  let index = 0;
  return order.map(group => ({ ...group, items: group.items.filter(take).slice(0, 6) })).filter(group => group.items.length)
    .map(group => ({ ...group, items: group.items.map(item => ({ ...item, index: index++ })) }));
}

export function WordCombobox({ id, value, onChange, onPick, inputRef, invalid, describedBy, autoFocus, placeholder = 'Gõ từ tiếng Anh hoặc nghĩa tiếng Việt…' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(false);
  const listId = useId();
  const term = useDebounced(value.trim(), DEBOUNCE_MS);
  const enabled = open && typed && term.length > 0 && term.length <= 120;
  const vi = hasVietnamese(term);

  const av = useQuery({ queryKey: ['dictionary-suggest', 'ANH_VIET', term], queryFn: () => get('suggest', { q: term, chieu: 'ANH_VIET', limit: '6' }), enabled: enabled && !vi, placeholderData: keepPreviousData, staleTime: 60000 });
  const needVi = enabled && (vi || (av.isSuccess && av.data.length < 3));
  const meaning = useQuery({ queryKey: ['dictionary-by-meaning', term], queryFn: () => get('by-meaning', { q: term, limit: '6' }), enabled: needVi && term.length >= 2, staleTime: 60000 });
  const va = useQuery({ queryKey: ['dictionary-suggest', 'VIET_ANH', term], queryFn: () => get('suggest', { q: term, chieu: 'VIET_ANH', limit: '4' }), enabled: needVi, staleTime: 60000 });

  const groups = useMemo(() => enabled ? buildGroups(term, vi ? [] : av.data, meaning.data, va.data) : [], [enabled, term, vi, av.data, meaning.data, va.data]);
  const options = groups.flatMap(group => group.items);
  const showing = open && typed && value.trim().length > 0;
  const loading = enabled && (av.isFetching || meaning.isFetching || va.isFetching);
  const current = Math.min(active, Math.max(options.length - 1, 0));

  const choose = option => { setOpen(false); setTyped(false); onPick(option); };

  const onKeyDown = event => {
    if (!showing) {
      if (event.key === 'ArrowDown' && value.trim()) { setOpen(true); setTyped(true); event.preventDefault(); }
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((current + 1) % Math.max(options.length, 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((current - 1 + options.length) % Math.max(options.length, 1)); }
    else if (event.key === 'Enter' && options.length && !event.ctrlKey && !event.metaKey) { event.preventDefault(); choose(options[current]); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    else if (event.key === 'Tab') setOpen(false);
  };

  return <div className={styles.box}>
    <Icon name="search" className={styles.icon} />
    <input
      ref={inputRef}
      id={id}
      className={`input en ${styles.input}`}
      lang={hasVietnamese(value) ? 'vi' : 'en'}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      maxLength={100}
      autoFocus={autoFocus}
      placeholder={placeholder}
      role="combobox"
      aria-expanded={showing && options.length > 0}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={showing && options.length ? `${listId}-${current}` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value}
      onChange={event => { onChange(event.target.value); setOpen(true); setTyped(true); setActive(0); }}
      onFocus={() => setOpen(true)}
      onBlur={() => setTimeout(() => setOpen(false), 120)}
      onKeyDown={onKeyDown}
    />
    {loading && <span className={styles.spinner} aria-hidden="true" />}
    {showing && (options.length > 0 || (!loading && term && enabled)) && <div className={styles.pop}>
      {options.length === 0
        ? <p className={styles.none}>Không có gợi ý cho “{term}”. Cứ gõ tiếp và tự nhập nghĩa.</p>
        : <ul id={listId} role="listbox" className={styles.list} aria-label="Gợi ý từ điển">
          {groups.map(group => <li key={group.id} role="presentation">
            <p className={styles.groupLabel} role="presentation">{group.label}</p>
            <ul role="presentation" className={styles.groupList}>
              {group.items.map(option => {
                const i = option.index;
                return <li key={`${group.id}-${option.tu}`} id={`${listId}-${i}`} role="option" aria-selected={i === current} className={`${styles.option}${i === current ? ` ${styles.active}` : ''}`} onMouseDown={event => { event.preventDefault(); choose(option); }} onMouseEnter={() => setActive(i)}>
                  <span className={styles.line}><span className={styles.word} lang="en">{option.tu}</span>{option.ipa && <span className="entry-ipa">{option.ipa}</span>}</span>
                  {option.sub && <span className={styles.sub}>{option.sub}</span>}
                </li>;
              })}
            </ul>
          </li>)}
        </ul>}
      <p className={styles.keys} aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> chọn · <kbd>Enter</kbd> điền · <kbd>Esc</kbd> đóng</p>
    </div>}
  </div>;
}
