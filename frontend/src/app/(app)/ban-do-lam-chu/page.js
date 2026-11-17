'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { SKILL, SKILL_PRACTICE } from '@/lib/practice-labels.mjs';
import { RemoteState } from '@/components/remote/Remote';
import styles from './page.module.css';
export default function MasteryMapPage() {
  const [deck,setDeck] = useState('');
  const [skill,setSkill] = useState('');
  const decks = useQuery({queryKey:['all-my-decks'],queryFn:()=>fetchAllPages('/api/v1/decks')});
  const stats = useQuery({queryKey:['skills',deck],queryFn:()=>apiFetch(`/api/v1/statistics/skills${deck ? `?boTheId=${encodeURIComponent(deck)}` : ''}`)});
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Bản đồ làm chủ</h1><p>Mức độ làm chủ theo kỹ năng, tổng hợp từ các lượt luyện tập.</p></div><form className={styles.filter} onSubmit={e=>e.preventDefault()}><label className="field">Bộ thẻ<select className="select" value={deck} onChange={e=>setDeck(e.target.value)}><option value="">Tất cả bộ</option>{decks.data?.map(d=><option key={d.id} value={d.id}>{d.ten}</option>)}</select></label><label className="field">Kỹ năng<select className="select" value={skill} onChange={e=>setSkill(e.target.value)}><option value="">Tất cả kỹ năng</option>{Object.entries(SKILL).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label></form><RemoteState queries={[decks,stats]}><section className={styles.grid}>{stats.data?.filter(k=>!skill||k.kyNang===skill).map(k=><article className={styles.card} key={k.kyNang}><h2>{SKILL[k.kyNang] || k.kyNang}</h2><p>{k.duDuLieu ? `${k.mucLamChu ?? '—'}%` : 'Chưa đủ dữ liệu'}</p>{k.mucLamChu != null && <progress aria-label={SKILL[k.kyNang]} value={k.mucLamChu} max={100} />}<p>{k.soQuanSat} quan sát · tối thiểu {k.soQuanSatToiThieu}</p><Link className="btn btn-primary" href={`/luyen-tap?loaiBai=${SKILL_PRACTICE[k.kyNang] || 'TONG_HOP'}${deck ? `&boTheId=${encodeURIComponent(deck)}` : ''}`}>Luyện kỹ năng này</Link></article>)}</section></RemoteState><p className="small muted">API hiện cung cấp thống kê theo kỹ năng và bộ thẻ; chưa có mức làm chủ riêng cho từng từ hoặc phát âm.</p></article></div>;
}
