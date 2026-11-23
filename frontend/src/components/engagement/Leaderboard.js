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

const initial = name => (String(name || '?').trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
const number = value => Number(value || 0).toLocaleString('vi-VN');
const shortDay = value => value ? value.split('-').reverse().slice(0, 2).join('/') : '';

function Avatar({ entry }) {
  return <span className={styles.avatar}>
    {entry.anhDaiDienUrl ? <img src={entry.anhDaiDienUrl} alt="" /> : initial(entry.tenHienThi)}
  </span>;
}

function tierLabel(code) {
  const tier = tierFromCode(code);
  return tier ? TIERS[tier]?.label : '';
}

function WeekDots({ days }) {
  const filled = Math.max(0, Math.min(7, Number(days) || 0));
  return <span className={styles.dots} role="img" aria-label={`Đủ lượt ${filled} trên 7 ngày`}>
    {Array.from({ length: 7 }, (_, i) => <i key={i} data-on={i < filled || undefined} />)}
  </span>;
}

function WeeklyHonors() {
  const honors = useQuery({ queryKey: ['leaderboard', 'weekly-honors'], queryFn: () => apiFetch('/api/v1/leaderboard/weekly-honors'), staleTime: 300000 });
  const list = honors.data?.vinhDanh || [];
  if (!list.length) return null;
  const week = `tuần ${shortDay(honors.data.tuanBatDau)} – ${shortDay(honors.data.tuanKetThuc)}`;
  return <section className={styles.honors} aria-labelledby="honors-title">
    <h2 id="honors-title" className={styles.honorsTitle}><span className={styles.honorStamp}>Vinh danh</span><span className={styles.honorsWeek}>{week}</span></h2>
    <ol className={styles.honorList}>
      {list.map(entry => <li key={entry.nguoiDungId}>
        <LeaderPerson entry={entry} context={{ rank: entry.hang, label: `Vinh danh ${week}` }} className={styles.honorPerson}>
          <span className={styles.honorRank}>{entry.hang}</span>
          <span className={styles.honorName}><span className={styles.nameText} title={entry.tenHienThi}>{entry.tenHienThi}</span></span>
          <span className={styles.honorMeta}>{entry.soNgay} ngày · {number(entry.soLuotHopLe)} lượt{entry.soLanTop3 > 1 ? ` · ${entry.soLanTop3} lần top 3` : ''}</span>
        </LeaderPerson>
      </li>)}
    </ol>
  </section>;
}

export function Leaderboard() {
  const [ky, setKy] = useState('TUAN');
  const [gioiHan, setGioiHan] = useState(10);
  const board = useQuery({ queryKey: leaderboardKey(ky, gioiHan), queryFn: () => apiFetch(`/api/v1/leaderboard?ky=${ky}&gioiHan=${gioiHan}`), staleTime: 60000, placeholderData: previous => previous });
  const data = board.data;
  const rows = boardRows(data);
  const chase = chaseLine(data);
  const context = ky === 'THANG' ? 'Tháng này' : 'Tuần này';
  const weekly = ky === 'TUAN';

  return <article className={`sheet ${styles.sheet}`} aria-labelledby="page-title">
    <header className={styles.head}>
      <div className="form-head">
        <h1 id="page-title">Bảng xếp hạng siêng năng</h1>
        <p>{data && <>{periodLabel(data)}. </>}Xếp theo số ngày ôn đủ {data?.luotToiThieu ?? 5} lượt hợp lệ; bằng ngày thì so tổng lượt ôn.</p>
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

    {data && !data.thamGia && <p className="notice notice-warning">
      Bạn không có tên trên bảng: tài khoản quản trị không được xếp hạng, hoặc bạn đã tắt &ldquo;Tham gia bảng xếp hạng&rdquo;. <Link href="/ca-nhan/rieng-tu">Quyền riêng tư</Link>
    </p>}

    <WeeklyHonors />

    {board.error ? <ErrorState description={board.error.message} onRetry={board.refetch} />
      : !data ? <div className={`${styles.skeleton} sk`} aria-busy="true" />
      : !data.top.length ? <p className={styles.empty}>Chưa có ai ôn đủ lượt trong kỳ này.</p>
      : <ol className={styles.list} aria-label={`${context} · Top ${gioiHan}`} aria-busy={board.isFetching}>
        {rows.map(row => row.type === 'gap'
          ? <li key={row.key} className={styles.gap} aria-label="Các hạng ở giữa đã ẩn">· · ·</li>
          : <li key={row.entry.nguoiDungId} className={styles.row} data-me={row.entry.laToi || undefined}>
            <span className={styles.rank} data-top={row.entry.hang <= 3 || undefined}>{row.entry.hang}</span>
            <LeaderPerson entry={row.entry} context={{ rank: row.entry.hang, label: context }} className={styles.person}>
              <Avatar entry={row.entry} />
              <span className={styles.who}>
                <span className={styles.name}><span className={styles.nameText} title={row.entry.tenHienThi}>{row.entry.tenHienThi}</span>{row.entry.laToi && <span className={styles.you}>Bạn</span>}</span>
                <small>{[tierLabel(row.entry.goiMa), row.entry.laToi && chase].filter(Boolean).join(' · ')}</small>
              </span>
            </LeaderPerson>
            {weekly && <span className={styles.week}><WeekDots days={row.entry.soNgay} /></span>}
            <span className={styles.score}><b>{row.entry.soNgay}</b> ngày<small>{number(row.entry.soLuotHopLe)} lượt</small></span>
          </li>)}
      </ol>}

    <footer className={styles.foot}>
      <span>{weekly ? 'Mỗi ô là một ngày trong tuần đã ôn đủ lượt.' : 'Số ngày tính trong tháng hiện tại.'}{data?.thamGia && data.toi ? ` Bạn đang hạng ${data.toi.hang} / ${number(data.tongNguoi)}.` : ''}</span>
      {data?.thamGia && <Link className="btn btn-accent" href="/hoc">Học ngay</Link>}
    </footer>
  </article>;
}
