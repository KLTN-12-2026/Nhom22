'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { localDate } from '@/lib/remote-contract.mjs';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import { SKILL } from '@/lib/practice-labels.mjs';
import styles from './page.module.css';
export default function WeeklySummaryPage() {
  const [day, setDay] = useState('');
  const query = useQuery({ queryKey: ['weekly-summary', day], queryFn: () => apiFetch(`/api/v1/statistics/weekly-summary${day ? `?ngay=${day}` : ''}`) });
  const current = query.data;
  return <div className={`page ${styles.page}`}><article className="sheet"><div className="form-head"><h1>Tổng kết tuần</h1><p>Nhìn lại một tuần học và chọn mục tiêu cho tuần tới.</p></div><label className="field">Chọn ngày trong tuần<input className="input" type="date" max={localDate()} value={day} onChange={e => setDay(e.target.value)} /></label><RemoteState queries={[query]}>{current && <>
    <p>{current.tuNgay} – {current.denNgay} · {current.muiGio}</p><div className={styles.metrics}>{[[current.soTuMoi,'Từ mới'],[current.soLuotOn,'Lượt ôn'],[current.soNgayCoHoc,'Ngày có học'],[current.tongPhut,'Phút học']].map(([v,l]) => <div key={l} className={styles.metric}><strong>{v}</strong><span>{l}</span></div>)}</div>
    <section className={styles.section}><h2>Tổng kết</h2><p>{current.tomTat}</p>{current.kyNang.map(k => <p key={k.kyNang}>{SKILL[k.kyNang] || k.kyNang}: {k.duDuLieu ? `${k.tyLeDung ?? '—'}% đúng` : 'Chưa đủ dữ liệu'} · {k.soQuanSat} lượt</p>)}</section>
    <section className={styles.section}><h2>Từ cần chú ý</h2>{!current.tuKho.length && <EmptyData>Chưa có từ cần chú ý trong tuần này.</EmptyData>}<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Từ</th><th>Số lượt sai</th><th>Bước tiếp theo</th></tr></thead><tbody>{current.tuKho.map(t => <tr key={t.theId}><td>{t.tu}</td><td>{t.soLanSai}/{t.soLuot}</td><td><Link href={`/bo-the/${encodeURIComponent(t.boTheId)}`} className="btn btn-secondary">Mở bộ thẻ</Link></td></tr>)}</tbody></table></div></section>
    <section className={styles.section}><h2>Mục tiêu tuần sau</h2><p>{current.mucTieuTuanSau?.vanBan}</p><Link className="btn btn-quiet" href="/ca-nhan/hoc-tap">Thiết lập học</Link></section>
  </>}</RemoteState></article></div>;
}
