'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { LIMITS, PERIODS, boardRows, chaseLine, leaderboardKey, periodLabel } from '@/lib/leaderboard.mjs';
import { TIERS, tierFromCode } from '@/lib/tier.mjs';
import { ErrorState } from '@/components/ui';
import { LeaderPerson } from './LeaderPerson';
import styles from './Leaderboard.module.css';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const initial = name => (String(name || '?').trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
const number = value => Number(value || 0).toLocaleString('vi-VN');
const shortDay = value => value ? value.split('-').reverse().slice(0, 2).join('/') : '';
const dayCount = (from, to) => (from && to ? Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1 : 30);
const todayIndex = from => {
  if (!from) return -1;
  const diff = Math.floor((Date.now() - Date.parse(`${from}T00:00:00`)) / 86400000);
  return diff >= 0 && diff < 7 ? diff : -1;
};

function Avatar({ entry }) {
  return <span className={styles.avatar}>
    {entry.anhDaiDienUrl ? <img src={entry.anhDaiDienUrl} alt="" /> : initial(entry.tenHienThi)}
  </span>;
}

function WeekBubbles({ days, today }) {
  const filled = Math.max(0, Math.min(7, Number(days) || 0));
  return <span className={styles.week} role="img" aria-label={`Đủ lượt ${filled} trên 7 ngày`}>
    {WEEKDAYS.map((d, i) => <i key={d} data-on={i < filled || undefined} data-today={i === today || undefined}>{d.replace('T', '')}</i>)}
  </span>;
}

function MonthBar({ days, total }) {
  const value = Math.max(0, Math.min(total, Number(days) || 0));
  return <span className={styles.month} role="img" aria-label={`Đủ lượt ${value} trên ${total} ngày`}>
    <span className={styles.bar}><b style={{ width: `${(value / total) * 100}%` }} /></span>
    <span>{value}/{total}</span>
  </span>;
}

function WeeklyHonors() {
  const honors = useQuery({ queryKey: ['leaderboard', 'weekly-honors'], queryFn: () => apiFetch('/api/v1/leaderboard/weekly-honors'), staleTime: 300000 });
  const list = honors.data?.vinhDanh || [];
  if (!list.length) return null;
  const week = `Tuần ${shortDay(honors.data.tuanBatDau)} – ${shortDay(honors.data.tuanKetThuc)}`;
  return <section className={styles.honor} aria-labelledby="honors-title">
    <h2 id="honors-title" className={styles.honorTitle}><span className={styles.stamp}>Vinh danh</span><span>{week}:</span></h2>
    <ol className={styles.honorList}>
      {list.map(entry => <li key={entry.nguoiDungId}>
        <LeaderPerson entry={entry} context={{ rank: entry.hang, label: `Vinh danh ${week.toLowerCase()}` }} className={styles.honorPerson}>
          <span className={styles.honorRank}>{entry.hang}</span>
          <b className={styles.honorName} title={entry.tenHienThi}>{entry.tenHienThi}</b>
          <span className={styles.honorMeta}>{entry.soNgay} ngày · {number(entry.soLuotHopLe)} lượt{entry.soLanTop3 > 1 ? ` · ${entry.soLanTop3} lần top 3` : ''}</span>
        </LeaderPerson>
      </li>)}
    </ol>
  </section>;
}

function MySlip({ data }) {
  const me = data.toi;
  const chase = chaseLine(data);
  return <section className={styles.slip} aria-label="Hạng của bạn">
    <div className={styles.myRank}><small>Hạng của bạn</small><b>{me.hang}</b><span>/ {number(data.tongNguoi)} người</span></div>
    <div className={styles.myBody}>
      <p className={styles.myLine}>{me.soNgay} ngày đủ lượt · {number(me.soLuotHopLe)} lượt ôn</p>
      {chase && <p className={styles.myChase}>{chase}</p>}
    </div>
    <Link className="btn btn-accent" href="/hoc">Học ngay</Link>
  </section>;
}

export function Leaderboard() {
  const [ky, setKy] = useState('TUAN');
  const [gioiHan, setGioiHan] = useState(10);
  const board = useQuery({ queryKey: leaderboardKey(ky, gioiHan), queryFn: () => apiFetch(`/api/v1/leaderboard?ky=${ky}&gioiHan=${gioiHan}`), staleTime: 60000, placeholderData: previous => previous });
  const data = board.data;
  const rows = boardRows(data);
  const weekly = ky === 'TUAN';
  const context = weekly ? 'Tuần này' : 'Tháng này';
  const total = dayCount(data?.tuNgay, data?.denNgay);
  const today = weekly ? todayIndex(data?.tuNgay) : -1;

  return <article className={`sheet ${styles.sheet}`} aria-labelledby="page-title">
    <header className={styles.head}>
      <div>
        <p className={styles.kicker}>{data ? `${weekly ? 'Tuần ' : ''}${periodLabel(data)} · ${number(data.tongNguoi)} người tham gia` : ' '}</p>
        <h1 id="page-title" className={styles.title}>Bảng xếp hạng siêng năng</h1>
      </div>
      <div className={styles.controls}>
        <div className={styles.segment} role="radiogroup" aria-label="Kỳ xếp hạng">
          {PERIODS.map(p => <button key={p.key} type="button" role="radio" aria-checked={ky === p.key} onClick={() => setKy(p.key)}>{p.label}</button>)}
        </div>
        <div className={styles.segment} role="radiogroup" aria-label="Số người hiển thị">
          {LIMITS.map(n => <button key={n} type="button" role="radio" aria-checked={gioiHan === n} onClick={() => setGioiHan(n)}>Top {n}</button>)}
        </div>
      </div>
    </header>

    {data?.thamGia && data.toi && <MySlip data={data} />}
    {data && !data.thamGia && <p className="notice notice-warning">
      Bạn không có tên trên bảng: tài khoản quản trị không được xếp hạng, hoặc bạn đã tắt &ldquo;Tham gia bảng xếp hạng&rdquo;. <Link href="/ca-nhan/rieng-tu">Quyền riêng tư</Link>
    </p>}

    <WeeklyHonors />

    {board.error ? <ErrorState description={board.error.message} onRetry={board.refetch} />
      : !data ? <div className={`${styles.skeleton} sk`} aria-busy="true" />
      : !data.top.length ? <p className={styles.empty}>Chưa có ai ôn đủ lượt trong kỳ này.</p>
      : <table className={styles.table} aria-label={`${context} · Top ${gioiHan}`} aria-busy={board.isFetching}>
        <thead>
          <tr>
            <th scope="col" className={styles.colRank}>Hạng</th>
            <th scope="col">Người học</th>
            <th scope="col" className={styles.colTrack}>{weekly ? 'T2 → CN' : `Ngày đủ lượt / ${total}`}</th>
            <th scope="col" className={`${styles.num} ${styles.colDays}`}>Ngày</th>
            <th scope="col" className={`${styles.num} ${styles.colReviews}`}>Lượt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            if (row.type === 'gap') return <tr key={row.key} className={styles.gap}><td colSpan={5} aria-label="Các hạng ở giữa đã ẩn">· · ·</td></tr>;
            const entry = row.entry;
            const tier = tierFromCode(entry.goiMa);
            return <tr key={entry.nguoiDungId} data-top={entry.hang <= 3 ? entry.hang : undefined} data-tier={tier || undefined} data-me={entry.laToi || undefined}>
              <td><span className={styles.rank}>{entry.hang}</span></td>
              <td className={styles.personCell}>
                <LeaderPerson entry={entry} context={{ rank: entry.hang, label: context }} className={styles.person}>
                  <Avatar entry={entry} />
                  <span className={styles.who}>
                    <span className={styles.name}><span className={styles.nameText} title={entry.tenHienThi}>{entry.tenHienThi}</span>{entry.laToi && <span className={styles.you}>Bạn</span>}</span>
                    {tier && <small>{TIERS[tier]?.label}</small>}
                  </span>
                </LeaderPerson>
              </td>
              <td className={styles.colTrack}>{weekly ? <WeekBubbles days={entry.soNgay} today={today} /> : <MonthBar days={entry.soNgay} total={total} />}</td>
              <td className={`${styles.num} ${styles.colDays}`}><b>{entry.soNgay}</b><small>ngày</small></td>
              <td className={`${styles.num} ${styles.colReviews}`}>{number(entry.soLuotHopLe)}<small>lượt</small></td>
            </tr>;
          })}
        </tbody>
      </table>}

    <footer className={styles.foot}>
      <p>Một ngày được tính khi ôn đủ {data?.luotToiThieu ?? 5} lượt hợp lệ. Bằng số ngày thì xếp theo tổng lượt ôn.{weekly ? ' Bong bóng tô kín là số ngày đã đủ lượt trong tuần.' : ''}</p>
      <Link href="/ca-nhan/rieng-tu">Ẩn tên trong Quyền riêng tư</Link>
    </footer>
  </article>;
}
