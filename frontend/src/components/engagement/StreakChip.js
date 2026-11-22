'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { DAY_STATE, isMilestone, nextMilestone, previousMilestone, shortDate, streakKey, weekdayLabel } from '@/lib/streak.mjs';
import { MUC_EVENT, mucCelebrate } from '@/lib/mascot.mjs';
import { StreakCelebration } from './StreakCelebration';
import styles from './StreakChip.module.css';

function Flame({ className }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5c.8 3.6 4.9 5.6 5.9 10.2 1.1 5-2.1 9-5.9 9.3-3.9.3-7.1-3-6.4-7.6.4-2.9 2.2-4.2 2.6-6.9 1.9 1.5 2.2 3.4 2.2 3.4S11.6 6.3 12 2.5Z" />
    <path className={styles.core} d="M12 11.5c.7 2.2 3.1 3.6 3.3 6.3.2 2.6-1.4 4.2-3.3 4.3-2-.1-3.6-1.9-3.3-4.4.2-1.6 1.3-2.4 1.6-3.9.9.8 1.2 1.9 1.2 1.9s.3-2.6.5-4.2Z" />
  </svg>;
}

function DayIcon({ state }) {
  if (state === 'HOC') return <Flame className={styles.dayFlame} />;
  if (state === 'NGHI') return <span aria-hidden="true">❄</span>;
  if (state === 'KHOI_PHUC') return <span aria-hidden="true">⟲</span>;
  if (state === 'LO') return <span aria-hidden="true">✕</span>;
  return <span aria-hidden="true">•</span>;
}

export function StreakChip({ userId }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [celebrate, setCelebrate] = useState(null);
  const box = useRef(null);
  const streak = useQuery({ queryKey: streakKey, queryFn: () => apiFetch('/api/v1/learning/streak'), staleTime: 60000 });
  const data = streak.data;

  const restore = useMutation({
    mutationFn: () => apiFetch('/api/v1/learning/streak/restore', { method: 'POST' }),
    onSuccess: result => {
      client.setQueryData(streakKey, result);
      client.invalidateQueries({ queryKey: ['learning-today'] });
      client.invalidateQueries({ queryKey: ['badges'] });
      setConfirming(false);
      mucCelebrate(`Chuỗi ${result.chuoiNgay} ngày đã được khôi phục! 🔥`, 6000);
    }
  });

  useEffect(() => {
    const onMuc = event => { if (event.detail?.type === 'activity') client.invalidateQueries({ queryKey: streakKey }); };
    window.addEventListener(MUC_EVENT, onMuc);
    return () => window.removeEventListener(MUC_EVENT, onMuc);
  }, [client]);

  useEffect(() => {
    if (!data?.homNayDaTinhChuoi || !isMilestone(data.chuoiNgay)) return;
    const key = `vocab:streak:milestone:${userId}`;
    const stamp = `${data.ngay}|${data.chuoiNgay}`;
    try {
      if (localStorage.getItem(key) === stamp) return;
      localStorage.setItem(key, stamp);
    } catch { return; }
    const timer = setTimeout(() => setCelebrate(data.chuoiNgay), 600);
    return () => clearTimeout(timer);
  }, [data, userId]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = event => { if (box.current && !box.current.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const closeCelebration = useCallback(() => setCelebrate(null), []);

  if (!data) return null;
  const value = data.chuoiNgay;
  const lit = data.homNayDaTinhChuoi;
  const left = Math.max(0, data.luotToiThieuChuoi - data.luotHomNay);
  const next = nextMilestone(value);
  const prev = previousMilestone(value);
  const toNext = next ? (value - prev) / (next - prev) : 1;
  const k = data.khoiPhuc;
  const tone = lit ? styles.lit : value > 0 ? styles.pending : styles.off;
  const label = lit ? `Chuỗi ${value} ngày, hôm nay đã giữ` : value > 0 ? `Chuỗi ${value} ngày, hôm nay chưa học đủ` : 'Chưa có chuỗi';

  return <div ref={box} className={styles.wrap}>
    <button type="button" className={`${styles.chip} ${tone}`} aria-expanded={open} aria-haspopup="dialog" aria-label={label} title={label} onClick={() => { setOpen(v => !v); setConfirming(false); }}>
      <Flame className={styles.flame} />
      <span className={styles.value}>{value}</span>
      {(k.coThe || (!lit && value > 0)) && <span className={`${styles.alert}${k.coThe ? ` ${styles.alertRestore}` : ''}`} aria-hidden="true" />}
    </button>

    {open && <div className={styles.pop} role="dialog" aria-label="Chuỗi ngày học">
      <div className={`${styles.hero} ${tone}`}>
        <Flame className={styles.heroFlame} />
        <div>
          <p className={styles.heroValue}><strong>{value}</strong> ngày</p>
          <p className={styles.heroSub}>{lit ? 'Hôm nay đã giữ chuỗi ✓' : value > 0 ? 'Hôm nay chưa giữ chuỗi' : 'Học hôm nay để bắt đầu chuỗi'}</p>
        </div>
      </div>

      {!lit && <div className={styles.today}>
        <div className={styles.row}><span>Hôm nay</span><span className={styles.num}>{data.luotHomNay}/{data.luotToiThieuChuoi} lượt</span></div>
        <div className="meter is-progress" aria-hidden="true"><span style={{ '--v': Math.min(1, data.luotHomNay / data.luotToiThieuChuoi) }} /></div>
        <p className={styles.hint}>Ôn thêm {left} lượt nữa để {value > 0 ? 'giữ' : 'bắt đầu'} chuỗi.</p>
      </div>}

      <ol className={styles.week} aria-label="7 ngày gần nhất">
        {data.bayNgay.map(day => <li key={day.ngay} className={styles[`d${day.trangThai}`]} title={`${shortDate(day.ngay)}: ${DAY_STATE[day.trangThai]?.label}`}>
          <span className={styles.dayDot}><DayIcon state={day.trangThai} /></span>
          <span className={styles.dayLabel}>{day.ngay === data.ngay ? 'Nay' : weekdayLabel(day.ngay)}</span>
          <span className="sr-only">{DAY_STATE[day.trangThai]?.label}</span>
        </li>)}
      </ol>
      <p className={styles.legend}><span><Flame className={styles.legendFlame} /> đã học</span><span>❄ nghỉ tự động</span><span>⟲ khôi phục</span><span>✕ lỡ</span></p>

      {next && <div className={styles.milestone}>
        <div className={styles.row}><span>Mốc tiếp theo</span><span className={styles.num}>{next} ngày · còn {next - value}</span></div>
        <div className={styles.track} aria-hidden="true"><span style={{ width: `${Math.round(toNext * 100)}%` }} /></div>
      </div>}

      {k.coThe && <div className={styles.restore}>
        <p className={styles.restoreTitle}>Chuỗi {k.chuoiSauKhoiPhuc} ngày vừa bị đứt</p>
        <p className={styles.hint}>Dùng {k.ngayCanBu.length} lượt khôi phục để bù {k.ngayCanBu.map(shortDate).join(', ')} và giữ lại chuỗi.</p>
        {!k.duLuot ? <p className={styles.warn}>Tháng này chỉ còn {k.conLai} lượt, chưa đủ để khôi phục.</p>
          : confirming ? <div className={styles.confirm}>
            <button type="button" className="btn btn-accent btn-sm" disabled={restore.isPending} aria-busy={restore.isPending} onClick={() => restore.mutate()}>{restore.isPending ? 'Đang khôi phục…' : `Dùng ${k.ngayCanBu.length} lượt`}</button>
            <button type="button" className="btn btn-quiet btn-sm" disabled={restore.isPending} onClick={() => setConfirming(false)}>Thôi</button>
          </div>
            : <button type="button" className={`btn btn-accent btn-sm ${styles.full}`} onClick={() => setConfirming(true)}>⟲ Khôi phục chuỗi</button>}
        {restore.error && <p className={styles.warn} role="alert">{restore.error.message}</p>}
      </div>}

      <p className={styles.quota}>Lượt khôi phục tháng này: <strong>{k.conLai}/{k.toiDaThang}</strong></p>
      <Link className={`btn btn-primary btn-sm ${styles.full}`} href="/hoc" onClick={() => setOpen(false)}>Học ngay</Link>
      <p className={styles.rules}>Mỗi ngày ôn đủ {data.luotToiThieuChuoi} lượt để giữ chuỗi. Mỗi tuần được nghỉ tự động 1 ngày. Lỡ nhiều hơn thì dùng lượt khôi phục, bù được các ngày trong 7 ngày gần nhất.</p>
    </div>}

    {celebrate && <StreakCelebration value={celebrate} onClose={closeCelebration} />}
  </div>;
}
