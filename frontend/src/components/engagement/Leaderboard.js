'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { LIMITS, PERIODS, PODIUM_METAL, boardRows, chaseLine, leaderboardKey, periodLabel } from '@/lib/leaderboard.mjs';
import { TIERS, tierFromCode } from '@/lib/tier.mjs';
import { MetalIcon } from '@/components/tier/MetalIcon';
import { ErrorState } from '@/components/ui';
import { LeaderPerson } from './LeaderPerson';
import styles from './Leaderboard.module.css';

const initial = name => (String(name || '?').trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
const number = value => Number(value || 0).toLocaleString('vi-VN');

function Avatar({ entry, size = 40 }) {
  const tier = tierFromCode(entry.goiMa);
  return <span className={styles.avatar} data-tier={tier} style={{ width: size, height: size }}>
    <span className={styles.avatarInner}>
      {entry.anhDaiDienUrl ? <img src={entry.anhDaiDienUrl} alt="" /> : initial(entry.tenHienThi)}
    </span>
  </span>;
}

function TierMark({ code }) {
  const tier = tierFromCode(code);
  if (!tier || tier === 'free') return null;
  const info = TIERS[tier];
  return <span className={styles.tierMark} title={`Gói ${info.label}`}><MetalIcon name={info.icon} metal={info.metal} size={14} /><span className="sr-only">Gói {info.label}</span></span>;
}

function Podium({ entries, context }) {
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  return <ol className={styles.podium} aria-label="Ba người dẫn đầu">
    {order.map(entry => <li key={entry.nguoiDungId} className={styles.step} data-place={entry.hang} data-me={entry.laToi || undefined}>
      <MetalIcon name={entry.hang === 1 ? 'trophy' : 'medal'} metal={PODIUM_METAL[entry.hang]} size={entry.hang === 1 ? 40 : 30} />
      <LeaderPerson entry={entry} context={{ rank: entry.hang, label: context }} className={styles.stepPerson}>
        <Avatar entry={entry} size={entry.hang === 1 ? 64 : 52} />
        <span className={styles.stepName}><span className={styles.nameText} title={entry.tenHienThi}>{entry.tenHienThi}</span><TierMark code={entry.goiMa} /></span>
      </LeaderPerson>
      <span className={styles.stepScore}><b>{entry.soNgay}</b> ngày · {number(entry.soLuotHopLe)} lượt</span>
      <span className={styles.stepBase}><span>{entry.hang}</span></span>
    </li>)}
  </ol>;
}

const shortDay = value => value ? value.split('-').reverse().slice(0, 2).join('/') : '';

function WeeklyHonors() {
  const honors = useQuery({ queryKey: ['leaderboard', 'weekly-honors'], queryFn: () => apiFetch('/api/v1/leaderboard/weekly-honors'), staleTime: 300000 });
  const list = honors.data?.vinhDanh || [];
  if (!list.length) return null;
  const week = `tuần ${shortDay(honors.data.tuanBatDau)} – ${shortDay(honors.data.tuanKetThuc)}`;
  return <section className={styles.honors} aria-labelledby="honors-title">
    <h2 id="honors-title" className={styles.honorsTitle}>
      <MetalIcon name="crown" metal="gold" size={18} />
      <span>Vinh danh <span className={styles.honorsWeek}>{week}</span></span>
    </h2>
    <ol className={styles.honorList}>
      {list.map(entry => <li key={entry.nguoiDungId} className={styles.honor} data-place={entry.hang}>
        <LeaderPerson entry={entry} context={{ rank: entry.hang, label: `Vinh danh ${week}` }} className={styles.honorPerson}>
          <MetalIcon name={entry.hang === 1 ? 'trophy' : 'medal'} metal={PODIUM_METAL[entry.hang]} size={18} />
          <Avatar entry={entry} size={28} />
          <span className={styles.honorBody}>
            <span className={styles.honorName}><span className={styles.nameText} title={entry.tenHienThi}>{entry.tenHienThi}</span><TierMark code={entry.goiMa} /></span>
            <span className={styles.honorMeta}>{entry.soNgay} ngày · {number(entry.soLuotHopLe)} lượt{entry.soLanTop3 > 1 ? ` · ${entry.soLanTop3} lần top 3` : ''}</span>
          </span>
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
  const podium = (data?.top || []).slice(0, 3);
  const chase = chaseLine(data);
  const context = ky === 'THANG' ? 'Tháng này' : 'Tuần này';

  return <div className={styles.page}>
    <header className={styles.head}>
      <div>
        <h1 id="page-title" className={styles.title}><MetalIcon name="trophy" metal="gold" size={34} />Bảng xếp hạng siêng năng</h1>
        <p className={styles.sub}>Xếp theo số ngày ôn đủ {data?.luotToiThieu ?? 5} lượt hợp lệ, hòa thì so tổng lượt ôn. {data && <span className={styles.range}>{periodLabel(data)}</span>}</p>
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

    {data && !data.thamGia && <p className={styles.notice}>
      Bạn không có tên trên bảng: tài khoản quản trị không được xếp hạng, hoặc bạn đã tắt &ldquo;Tham gia bảng xếp hạng&rdquo;. <Link href="/ca-nhan/rieng-tu">Quyền riêng tư</Link>
    </p>}
    {data?.thamGia && data.toi && <p className={styles.mine}>
      <span>Bạn đang hạng <b>#{data.toi.hang}</b> / {number(data.tongNguoi)}</span>
      {chase && <span className={styles.chase}>{chase}</span>}
    </p>}
    {data?.thamGia && !data.toi && <p className={styles.mine}><span>Bạn chưa có lượt ôn nào trong kỳ này.</span><Link className="btn btn-primary btn-sm" href="/hoc">Học ngay</Link></p>}

    <WeeklyHonors />

    {board.error ? <ErrorState description={board.error.message} onRetry={board.refetch} />
      : !data ? <div className={`${styles.skeleton} sk`} aria-busy="true" />
      : !data.top.length ? <p className={styles.empty}>Chưa có ai ôn tập trong kỳ này. Hãy là người đầu tiên!</p>
      : <>
        {podium.length >= 3 && <Podium entries={podium} context={context} />}
        <ol className={styles.list} aria-label={`Top ${gioiHan}`} aria-busy={board.isFetching}>
          {rows.map(row => row.type === 'gap'
            ? <li key={row.key} className={styles.gap} aria-label="Các hạng ở giữa đã ẩn"><span>•</span><span>•</span><span>•</span></li>
            : <li key={row.entry.nguoiDungId} className={styles.row} data-me={row.entry.laToi || undefined} data-place={row.entry.hang <= 3 ? row.entry.hang : undefined}>
              <span className={styles.rank}>{row.entry.hang <= 3 ? <MetalIcon name="medal" metal={PODIUM_METAL[row.entry.hang]} size={22} /> : row.entry.hang}</span>
              <LeaderPerson entry={row.entry} context={{ rank: row.entry.hang, label: context }} className={styles.person}>
                <Avatar entry={row.entry} />
                <span className={styles.name}><span className={styles.nameText} title={row.entry.tenHienThi}>{row.entry.tenHienThi}</span><TierMark code={row.entry.goiMa} />{row.entry.laToi && <span className={styles.you}>Bạn</span>}</span>
              </LeaderPerson>
              <span className={styles.days}><b>{row.entry.soNgay}</b> ngày</span>
              <span className={styles.reviews}>{number(row.entry.soLuotHopLe)} lượt</span>
            </li>)}
        </ol>
      </>}
  </div>;
}
