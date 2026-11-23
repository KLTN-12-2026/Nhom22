'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { SKILL, SKILL_PRACTICE } from '@/lib/practice-labels.mjs';
import { RemoteState } from '@/components/remote/Remote';
import styles from './page.module.css';

function Evidence({ seen, need }) {
  const total = Math.max(1, Math.min(10, need || 5));
  const filled = Math.min(total, seen || 0);
  return <span className={styles.dots} role="img" aria-label={`${seen || 0} trên ${need} quan sát tối thiểu`}>
    {Array.from({ length: total }, (_, i) => <i key={i} data-on={i < filled || undefined} />)}
  </span>;
}

export default function MasteryMapPage() {
  const [deck, setDeck] = useState('');
  const [skill, setSkill] = useState('');
  const decks = useQuery({ queryKey: ['all-my-decks'], queryFn: () => fetchAllPages('/api/v1/decks') });
  const stats = useQuery({ queryKey: ['skills', deck], queryFn: () => apiFetch(`/api/v1/statistics/skills${deck ? `?boTheId=${encodeURIComponent(deck)}` : ''}`) });
  const rows = (stats.data || []).filter(k => !skill || k.kyNang === skill);
  const measured = rows.filter(k => k.duDuLieu && k.mucLamChu != null);
  const weakest = measured.length ? measured.reduce((a, b) => (b.mucLamChu < a.mucLamChu ? b : a)).kyNang : null;
  const practiceHref = k => `/luyen-tap?loaiBai=${SKILL_PRACTICE[k.kyNang] || 'TONG_HOP'}${deck ? `&boTheId=${encodeURIComponent(deck)}` : ''}`;

  return <div className={`page ${styles.page}`}><article className="sheet">
    <div className="form-head"><h1>Bản đồ làm chủ</h1><p>Mức độ làm chủ theo kỹ năng, tổng hợp từ các lượt luyện tập.</p></div>
    <form className={styles.filter} onSubmit={e => e.preventDefault()}>
      <label className="field">Bộ thẻ<select className="select" value={deck} onChange={e => setDeck(e.target.value)}><option value="">Tất cả bộ</option>{decks.data?.map(d => <option key={d.id} value={d.id}>{d.ten}</option>)}</select></label>
      <label className="field">Kỹ năng<select className="select" value={skill} onChange={e => setSkill(e.target.value)}><option value="">Tất cả kỹ năng</option>{Object.entries(SKILL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
    </form>
    <RemoteState queries={[decks, stats]}>
      <ol className={styles.rows} aria-label="Mức làm chủ theo kỹ năng">
        {rows.map((k, i) => {
          const name = SKILL[k.kyNang] || k.kyNang;
          const known = k.duDuLieu && k.mucLamChu != null;
          const weak = k.kyNang === weakest;
          return <li key={k.kyNang} className={styles.row} data-weak={weak || undefined}>
            <span className={styles.no}>{i + 1}</span>
            <span className={styles.name}><b>{name}</b><small>{known ? `${k.soQuanSat} quan sát` : 'Chưa đủ dữ liệu'}</small></span>
            <span className={styles.measure}>
              {known
                ? <><span className={styles.bar}><i style={{ width: `${k.mucLamChu}%` }} /></span><span className={styles.value}>{k.mucLamChu}%</span></>
                : <><Evidence seen={k.soQuanSat} need={k.soQuanSatToiThieu} /><span className={styles.value}>{k.soQuanSat}/{k.soQuanSatToiThieu}</span></>}
            </span>
            <Link className={`btn btn-sm ${weak ? 'btn-accent' : 'btn-secondary'}`} href={practiceHref(k)} aria-label={`Luyện ${name}`}>Luyện</Link>
          </li>;
        })}
      </ol>
    </RemoteState>
    <p className="small muted">Kỹ năng yếu nhất có nút màu vàng. Mức làm chủ chỉ hiện khi đủ số lần quan sát tối thiểu.</p>
  </article></div>;
}
