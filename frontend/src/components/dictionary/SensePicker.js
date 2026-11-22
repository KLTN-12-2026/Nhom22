'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { dictionaryHref, ipa, lookupKey, lookupPath, pickEntry, posLabel, senses } from '@/lib/dictionary.mjs';
import { Icon } from '@/components/ui';
import styles from './SensePicker.module.css';

const VISIBLE = 4;

export function SensePicker({ picked, onChoose, onClose }) {
  const [all, setAll] = useState(false);
  const term = picked.term;
  const lookup = useQuery({ queryKey: lookupKey(term), queryFn: () => apiFetch(lookupPath(term)), staleTime: 300000 });
  const entry = pickEntry(lookup.data, term);
  const list = entry ? senses(entry) : [];
  const selectedIndex = list.findIndex(sense => `${entry.id}-${sense.key}` === picked.key);
  const shown = all ? list : list.slice(0, Math.max(VISIBLE, selectedIndex + 1));

  return <section className={styles.panel} aria-label={`Nghĩa của “${term}” trong từ điển`}>
    <div className={styles.head}>
      <span className={styles.title}><Icon name="book" />Từ điển: <strong lang="en">{entry?.tu || term}</strong>{entry?.phienAm && <span className="entry-ipa">{ipa(entry.phienAm)}</span>}</span>
      <button type="button" className="btn btn-quiet btn-icon btn-sm" aria-label="Ẩn gợi ý nghĩa" title="Ẩn gợi ý nghĩa" onClick={onClose}><Icon name="x" /></button>
    </div>
    {lookup.isPending || picked.loading ? <p className={styles.status} role="status">Đang tra nghĩa…</p>
      : lookup.isError || picked.failed ? <p className={styles.status} role="alert">Chưa tra được từ điển. Bạn vẫn nhập tay được.</p>
        : !entry || !list.length ? <p className={styles.status}>Từ điển chưa có “{term}”{picked.hint ? `, đã điền nghĩa “${picked.hint}”` : ''}. Bạn tự nhập hoặc sửa nghĩa bên dưới.</p>
          : <>
            <div className={styles.list} role="radiogroup" aria-label="Chọn nghĩa để điền">
              {shown.map(sense => {
                const key = `${entry.id}-${sense.key}`;
                const on = key === picked.key;
                return <button key={key} type="button" role="radio" aria-checked={on} className={`${styles.sense}${on ? ` ${styles.on}` : ''}`} onClick={() => onChoose(entry, sense)}>
                  <span className={styles.mark} aria-hidden="true">{on ? <Icon name="check" /> : null}</span>
                  <span className={styles.body}>
                    {sense.tuLoai && <span className="pos">{posLabel(sense.tuLoai)}</span>}
                    <span className={styles.meaning}>{sense.noiDung}</span>
                    {sense.viDu?.[0] && <span className={styles.example} lang="en">{sense.viDu[0].cau}{sense.viDu[0].dich && <span lang="vi"> — {sense.viDu[0].dich}</span>}</span>}
                  </span>
                </button>;
              })}
            </div>
            <div className={styles.foot}>
              {list.length > shown.length && <button type="button" className="link-btn" onClick={() => setAll(true)}>Xem thêm {list.length - shown.length} nghĩa</button>}
              {all && list.length > VISIBLE && <button type="button" className="link-btn" onClick={() => setAll(false)}>Thu gọn</button>}
              <Link className={styles.more} href={dictionaryHref(entry.tu)} target="_blank">Mở trong Từ điển</Link>
            </div>
          </>}
  </section>;
}
