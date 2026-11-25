'use client';
import { useEffect, useId, useState } from 'react';
import { Icon } from '@/components/ui';
import { CARD_SORTS } from '@/lib/card-list.mjs';
import styles from './CardSearchBar.module.css';

export function CardSearchBar({ search, sort, onChange }) {
  return <CardSearchBarInner key={search === '' ? 'empty' : 'set'} search={search} sort={sort} onChange={onChange} />;
}

function CardSearchBarInner({ search, sort, onChange }) {
  const [text, setText] = useState(search);
  const inputId = useId();
  const sortId = useId();
  useEffect(() => {
    const value = text.trim();
    if (value === search) return undefined;
    const timer = setTimeout(() => onChange({ search: value, sort }), 300);
    return () => clearTimeout(timer);
  }, [text, search, sort, onChange]);
  return (
    <div className={styles.bar} role="search">
      <div className={`input-with-icon ${styles.search}`}>
        <Icon name="search" />
        <label className="sr-only" htmlFor={inputId}>Tìm từ trong bộ thẻ</label>
        <input id={inputId} className="input" type="search" autoComplete="off" maxLength={100}
          placeholder="Tìm từ, nghĩa hoặc phiên âm…" value={text} onChange={event => setText(event.target.value)} />
      </div>
      <div className={styles.sort}>
        <label htmlFor={sortId}>Sắp xếp</label>
        <select id={sortId} className="select" value={sort} onChange={event => onChange({ search: text.trim(), sort: event.target.value })}>
          {Object.entries(CARD_SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
    </div>
  );
}
