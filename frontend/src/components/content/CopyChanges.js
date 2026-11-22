'use client';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import { CARD_FIELD, CHANGE_KIND, DECK_FIELD, fieldValue, wordDiff } from '@/lib/copy-diff.mjs';
import styles from './CopyChanges.module.css';

const TEXT_FIELDS = new Set(['ten', 'moTa', 'nghiaVi', 'viDuEn', 'dichVi', 'nguon', 'tu', 'phienAm']);

function Marked({ parts, side }) {
  return parts.map((part, index) => part.type === 'same'
    ? <span key={index}>{part.text}</span>
    : side === 'before'
      ? <del key={index} className={styles.markDel}>{part.text}</del>
      : <ins key={index} className={styles.markAdd}>{part.text}</ins>);
}

function ChangeRow({ field, label, before, after }) {
  const shownBefore = fieldValue(field, before);
  const shownAfter = fieldValue(field, after);
  const inline = TEXT_FIELDS.has(field) && shownBefore && shownAfter;
  const marks = inline ? wordDiff(shownBefore, shownAfter) : null;
  return (
    <div className={styles.row}>
      <span className={styles.field}>{label}</span>
      <div className={styles.values}>
        <div className={`${styles.value} ${styles.before}`}>
          <span className={styles.side}>Bộ gốc</span>
          {shownBefore == null ? <em className={styles.none}>Để trống</em> : marks ? <p><Marked parts={marks.before} side="before" /></p> : <p><del className={styles.markDel}>{shownBefore}</del></p>}
        </div>
        <span className={styles.arrow} aria-hidden="true"><Icon name="chevron-right" /></span>
        <div className={`${styles.value} ${styles.after}`}>
          <span className={styles.side}>Bản sao</span>
          {shownAfter == null ? <em className={styles.none}>Đã xóa nội dung</em> : marks ? <p><Marked parts={marks.after} side="after" /></p> : <p><ins className={styles.markAdd}>{shownAfter}</ins></p>}
        </div>
      </div>
    </div>
  );
}

const FILTERS = [['', 'Tất cả'], ['THEM', 'Thẻ mới'], ['SUA', 'Đã sửa'], ['XOA', 'Đã xóa']];

export function CopyChanges({ diff }) {
  const [filter, setFilter] = useState('');
  if (!diff) return null;
  const counts = { '': diff.the.length, THEM: diff.soThem, SUA: diff.soSua, XOA: diff.soXoa };
  const cards = filter ? diff.the.filter(change => change.loai === filter) : diff.the;

  if (!diff.coThayDoi) {
    return (
      <div className={styles.same}>
        <span className={styles.sameIcon} aria-hidden="true"><Icon name="copy" /></span>
        <p className={styles.sameTitle}>Bản sao giống hệt bộ gốc</p>
        <p className={styles.sameText}>Chưa có thông tin bộ hay thẻ nào khác bộ gốc ({diff.soTheGoc} thẻ).</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.tally} aria-label="Tóm tắt thay đổi">
        <li data-tone="info"><b>{diff.boThe.length}</b><span>Thông tin bộ</span></li>
        <li data-tone="add"><b>+{diff.soThem}</b><span>Thẻ mới</span></li>
        <li data-tone="edit"><b>{diff.soSua}</b><span>Thẻ đã sửa</span></li>
        <li data-tone="del"><b>−{diff.soXoa}</b><span>Thẻ đã xóa</span></li>
        <li data-tone="mute"><b>{diff.soTheGoc} → {diff.soTheBanSao}</b><span>Số thẻ</span></li>
      </ul>

      {diff.boThe.length > 0 && (
        <section className={styles.section} aria-labelledby="diff-deck">
          <h3 id="diff-deck" className={styles.heading}>Thông tin bộ thẻ</h3>
          <div className={styles.box}>
            {diff.boThe.map(change => <ChangeRow key={change.truong} field={change.truong} label={DECK_FIELD[change.truong] || change.truong} before={change.truoc} after={change.sau} />)}
          </div>
        </section>
      )}

      {diff.the.length > 0 && (
        <section className={styles.section} aria-labelledby="diff-cards">
          <div className={styles.cardsHead}>
            <h3 id="diff-cards" className={styles.heading}>Thẻ thay đổi</h3>
            <div className={styles.filters} role="group" aria-label="Lọc thẻ thay đổi">
              {FILTERS.filter(([value]) => !value || counts[value]).map(([value, label]) => (
                <button key={value || 'all'} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{counts[value]}</span></button>
              ))}
            </div>
          </div>
          <ol className={styles.cards}>
            {cards.map(change => {
              const kind = CHANGE_KIND[change.loai];
              const renamed = change.loai === 'SUA' && change.tuGoc && change.tuGoc !== change.tu;
              return (
                <li key={`${change.loai}-${change.theId}`} className={styles.card} data-tone={kind.tone}>
                  <div className={styles.cardHead}>
                    <span className={styles.badge} data-tone={kind.tone}>{kind.label}</span>
                    <span className={styles.word} lang="en">{change.loai === 'XOA' ? <del>{change.tu}</del> : change.tu}</span>
                    {renamed && <span className={styles.was}>trước là <b lang="en">{change.tuGoc}</b></span>}
                    {change.loai === 'SUA' && <span className={styles.count}>{change.truong.length} chỗ sửa</span>}
                  </div>
                  {change.loai === 'SUA' && <div className={styles.box}>
                    {change.truong.map(field => <ChangeRow key={field.truong} field={field.truong} label={CARD_FIELD[field.truong] || field.truong} before={field.truoc} after={field.sau} />)}
                  </div>}
                  {change.loai === 'THEM' && <p className={styles.note}>Thẻ chỉ có trong bản sao, bộ gốc không có.</p>}
                  {change.loai === 'XOA' && <p className={styles.note}>Thẻ có trong bộ gốc nhưng đã bị bỏ khỏi bản sao.</p>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
