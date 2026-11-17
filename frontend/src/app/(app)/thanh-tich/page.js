'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Pagination } from '@/components/ui';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import styles from './page.module.css';
export default function AchievementsPage() {
  const [page, setPage] = useState(1);
  const rewards = useQuery({ queryKey: ['rewards', page], queryFn: () => apiFetch(`/api/v1/rewards/history?page=${page - 1}&size=20`) });
  const badges = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: () => apiFetch('/api/v1/challenges') });
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Thành tích của bạn</h1><p>Điểm và điều kiện được máy chủ xác nhận từ việc học.</p></div><RemoteState queries={[rewards,badges,challenges]}>
    <div className={styles.metrics}>{[[rewards.data?.tongDiem,'Tổng điểm'],[rewards.data?.diemHomNay,'Điểm hôm nay'],[badges.data?.filter(b=>b.daNhan).length,'Huy hiệu đã nhận']].map(([v,l]) => <div className={styles.metric} key={l}><strong>{v}</strong><span>{l}</span></div>)}</div>
    <section className={styles.section}><h2>Huy hiệu</h2>{!badges.data?.length && <EmptyData />}<div className={styles.grid}>{badges.data?.map(b => <article className={styles.card} key={b.id}><div><h3>{b.ten}</h3><p>{b.moTa}</p><span className={`stamp ${b.daNhan ? 'stamp-success' : 'stamp-quiet'}`}>{b.daNhan ? 'Đã nhận' : 'Chưa nhận'}</span></div></article>)}</div></section>
    <section className={styles.section}><h2>Thử thách</h2>{!challenges.data?.length && <EmptyData />}{challenges.data?.map(c => <article className={styles.challenge} key={c.id}><h3>{c.ten}</h3><p>{c.moTa}</p><p>{c.giaTri}/{c.mucTieu} · {c.tuanBatDau} – {c.tuanKetThuc}</p><progress aria-label={c.ten} value={c.giaTri} max={c.mucTieu || 1} /><p>{c.hoanThanhAt ? 'Đã hoàn thành' : 'Đang thực hiện'}</p></article>)}<Link className="btn btn-accent" href="/hom-nay">Bắt đầu học</Link></section>
    <section className={styles.section}><h2>Lịch sử thưởng</h2>{!rewards.data?.lichSu.items.length && <EmptyData />}<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ngày</th><th>Nguồn</th><th>Điểm</th></tr></thead><tbody>{rewards.data?.lichSu.items.map(r => <tr key={r.id}><td>{r.ngayDiaPhuong}</td><td>{r.loaiSuKien}</td><td>+{r.soDiem}</td></tr>)}</tbody></table></div><Pagination page={page} totalPages={rewards.data?.lichSu.totalPages || 0} onPageChange={setPage} /></section>
  </RemoteState></article></div>;
}
