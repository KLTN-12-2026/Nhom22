'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import styles from './page.module.css';
export default function RecommendationsPage() {
  const [opened, setOpened] = useState(null);
  const query = useQuery({ queryKey: ['recommendations'], queryFn: () => apiFetch('/api/v1/learning/recommendations') });
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Gợi ý ôn tập</h1><p>Gợi ý dựa trên các lượt học gần đây của bạn.</p></div><RemoteState queries={[query]}>
    {!query.data?.length && <EmptyData>Chưa có gợi ý. Hãy tiếp tục học để có thêm bằng chứng.</EmptyData>}
    <div className={styles.grid}>{query.data?.map((item, i) => <article className={styles.card} key={`${item.reasonCode}-${i}`}><h2>{item.message}</h2><p>{item.cardIds.length} thẻ liên quan</p><div className={styles.actions}><Link className="btn btn-primary" href="/so-tay">Mở sổ tay</Link><Link className="btn btn-secondary" href="/luyen-tap">Luyện tập</Link><button type="button" className="btn btn-quiet" onClick={() => setOpened(opened === i ? null : i)}>Xem bằng chứng</button></div>{opened === i && <dl className={styles.evidence}>{Object.entries(item.evidence || {}).map(([key, value]) => <div key={key}><dt>{({ soLanQuen:'Số lần quên',soNgay:'Số ngày',soSai:'Số lượt sai',soLuot:'Số lượt',soLanNham:'Số lần nhầm',soQuaHan:'Số thẻ quá hạn',soDenHan:'Số thẻ đến hạn',phutMoiNgay:'Phút mỗi ngày',diem:'Điểm',lanCuoiAt:'Lần gần nhất' })[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl>}</article>)}</div>
  </RemoteState></article></div>;
}
