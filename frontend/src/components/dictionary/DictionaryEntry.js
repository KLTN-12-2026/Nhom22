'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SpeakButton } from '@/components/content/SpeakButton';
import { Icon } from '@/components/ui';
import { dictionaryHref, englishTerms, ipa, posLabel } from '@/lib/dictionary.mjs';
import styles from './DictionaryEntry.module.css';

function Terms({ text }) {
  const terms = englishTerms(text);
  if (!terms.length) return <span lang="en">{text}</span>;
  return <span lang="en">{text}<span className={styles.terms}>{terms.map(term => <Link key={term} href={dictionaryHref(term)} className={styles.term}>{term}</Link>)}</span></span>;
}

const EXAMPLES = 3;
const MEANINGS = 6;

function Meaning({ meaning, english, onPick, pickLabel, tuLoai, index }) {
  const [all, setAll] = useState(false);
  const examples = meaning.viDu || [];
  const shown = all ? examples : examples.slice(0, EXAMPLES);
  return <li className={styles.meaning}>
    <div className={styles.meaningHead}>
      <span className={styles.sense}>{english ? <Terms text={meaning.noiDung} /> : meaning.noiDung}</span>
      {onPick && meaning.noiDung && <button type="button" className={`btn btn-secondary btn-sm ${styles.pick}`} onClick={() => onPick({ ...meaning, tuLoai })} aria-label={`${pickLabel}: nghĩa ${index + 1}`}><Icon name="plus" />{pickLabel}</button>}
    </div>
    {meaning.ghiChu && <p className={styles.note}>{meaning.ghiChu}</p>}
    {shown.length > 0 && <ul className={styles.examples} role="list">
      {shown.map((example, i) => <li key={i}>
        <span className={styles.exampleText} lang={english ? 'vi' : 'en'}>{example.cau}</span>
        {example.dich && <span className={styles.exampleTrans} lang={english ? 'en' : 'vi'}>{example.dich}</span>}
      </li>)}
    </ul>}
    {examples.length > EXAMPLES && <button type="button" className={`link-btn ${styles.more}`} aria-expanded={all} onClick={() => setAll(v => !v)}>{all ? 'Thu gọn ví dụ' : `Xem thêm ${examples.length - EXAMPLES} ví dụ`}</button>}
  </li>;
}

function Group({ group, english, onPick, pickLabel }) {
  const [all, setAll] = useState(false);
  const meanings = group.nghia || [];
  const shown = all ? meanings : meanings.slice(0, MEANINGS);
  return <section className={styles.group}>
    {group.tuLoai && <h3 className={styles.pos}><span className="pos">{posLabel(group.tuLoai)}</span></h3>}
    {shown.length > 0 && <ol className={styles.meanings}>
      {shown.map((meaning, m) => <Meaning key={m} index={m} meaning={meaning} english={english} onPick={english ? undefined : onPick} pickLabel={pickLabel} tuLoai={group.tuLoai} />)}
    </ol>}
    {meanings.length > MEANINGS && <button type="button" className={`btn btn-quiet btn-sm ${styles.moreGroup}`} aria-expanded={all} onClick={() => setAll(v => !v)}>{all ? 'Thu gọn nghĩa' : `Xem thêm ${meanings.length - MEANINGS} nghĩa`}</button>}
    {group.thanhNgu?.length > 0 && <div className={styles.idioms}>
      <h4 className={styles.idiomTitle}>Thành ngữ, cụm từ</h4>
      <dl>
        {group.thanhNgu.map((idiom, i) => <div key={i} className={styles.idiom}>
          <dt lang={english ? 'vi' : 'en'}>{idiom.cum}</dt>
          {idiom.nghia.map((meaning, m) => <dd key={m}>
            {meaning.noiDung}
            {meaning.viDu?.map((example, e) => <span key={e} className={styles.idiomExample}><span lang={english ? 'vi' : 'en'}>{example.cau}</span>{example.dich && <> — {example.dich}</>}</span>)}
          </dd>)}
        </div>)}
      </dl>
    </div>}
  </section>;
}

export function DictionaryEntry({ entry, onPick, pickLabel = 'Tạo thẻ', compact = false }) {
  const english = entry.chieu === 'VIET_ANH';
  const groups = entry.noiDung?.nhom || [];
  return <article className={`${styles.entry}${compact ? ` ${styles.compact}` : ''}`} aria-labelledby={`dict-${entry.id}`}>
    <header className={styles.head}>
      <h2 id={`dict-${entry.id}`} className={`entry-word ${styles.word}`} lang={english ? 'vi' : 'en'}>{entry.tu}</h2>
      {entry.phienAm && <span className="entry-ipa">{ipa(entry.phienAm)}</span>}
      {!english && <SpeakButton text={entry.tu} compact />}
    </header>
    {groups.map((group, g) => <Group key={g} group={group} english={english} onPick={onPick} pickLabel={pickLabel} />)}
  </article>;
}
