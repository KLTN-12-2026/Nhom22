'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './ReviewSchedule.module.css';

const DIR = { EN_VI: 'Anh → Việt', VI_EN: 'Việt → Anh' };
const RATE = { QUEN: 'Quên', KHO: 'Khó', NHO: 'Nhớ', DE: 'Dễ' };
const DAY = 86400000;

const startOfDay = time => { const d = new Date(time); d.setHours(0, 0, 0, 0); return d.getTime(); };
const hm = time => new Date(time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const pad = n => String(n).padStart(2, '0');
const dm = time => { const d = new Date(time); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };

function dueLabel(time, now) {
  const days = Math.round((startOfDay(time) - startOfDay(now)) / DAY);
  if (time <= now) {
    const late = Math.round((startOfDay(now) - startOfDay(time)) / DAY);
    return { group: 'Quá hạn', text: late > 0 ? `trễ ${late} ngày` : `từ ${hm(time)}`, tone: 'late' };
  }
  if (days === 0) return { group: 'Hôm nay', text: `lúc ${hm(time)}`, tone: 'today' };
  if (days === 1) return { group: 'Ngày mai', text: `lúc ${hm(time)}`, tone: 'soon' };
  return { group: `${dm(time)} · ${days} ngày nữa`, text: hm(time), tone: 'later' };
}

function nextLabel(time, now) {
  if (!time) return '—';
  const days = Math.round((startOfDay(time) - startOfDay(now)) / DAY);
  if (time <= now) return `đã đến hạn từ ${dm(time)}`;
  if (days === 0) return `ôn lại hôm nay ${hm(time)}`;
  if (days === 1) return `ôn lại ngày mai ${hm(time)}`;
  return `ôn lại ${dm(time)} (${days} ngày nữa)`;
}

function Upcoming({ decks, now }) {
  const results = useQueries({
    queries: decks.map(deck => ({
      queryKey: ['deck-progress-upcoming', deck.boTheId],
      queryFn: () => apiFetch(`/api/v1/decks/${deck.boTheId}/progress?size=100`),
      staleTime: 30000
    }))
  });
  const loading = results.some(result => result.isLoading);
  const rows = useMemo(() => results.flatMap((result, index) => (result.data?.items || []).flatMap(card => Object.entries(card.chieu || {})
    .filter(([, state]) => state?.hanOnAt && state.trangThai !== 'MOI' && !card.tamNgung)
    .map(([dir, state]) => ({ key: `${card.theId}-${dir}`, tu: card.tu, nghiaVi: card.nghiaVi, dir, deck: decks[index], time: Date.parse(state.hanOnAt) }))))
    .sort((a, b) => a.time - b.time), [results, decks]);

  if (loading) return <p className={styles.state}>Đang tải lịch ôn…</p>;
  if (!rows.length) return <p className={styles.state}>Chưa có thẻ nào được hẹn ôn. Học từ mới xong, thẻ sẽ hiện ở đây kèm ngày giờ ôn lại.</p>;

  const shown = rows.slice(0, 14);
  const groups = [];
  shown.forEach(row => {
    const label = dueLabel(row.time, now);
    const last = groups[groups.length - 1];
    if (last && last.group === label.group) last.rows.push({ ...row, label });
    else groups.push({ group: label.group, tone: label.tone, rows: [{ ...row, label }] });
  });

  return (
    <>
      {groups.map(group => (
        <div key={group.group} className={styles.group}>
          <p className={styles.groupHead} data-tone={group.tone}><span>{group.group}</span><span>{group.rows.length} thẻ</span></p>
          <ul className={styles.rows} role="list">
            {group.rows.map(row => (
              <li key={row.key} className={styles.row}>
                <span className={styles.word} lang="en">{row.tu}</span>
                <span className={styles.mean}>{row.nghiaVi}</span>
                <span className={styles.dir}>{DIR[row.dir]}</span>
                <span className={styles.when} data-tone={row.label.tone}>{row.label.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {rows.length > shown.length && (
        <p className={styles.more}>
          Còn {rows.length - shown.length} thẻ nữa.{' '}
          {decks.map(deck => <Link key={deck.boTheId} href={`/bo-the/${deck.boTheId}/tien-do`}>Tiến độ {deck.ten}</Link>)}
        </p>
      )}
    </>
  );
}

function Recent({ now }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-history-recent'],
    queryFn: () => apiFetch('/api/v1/learning/history?size=40'),
    staleTime: 30000
  });
  if (isLoading) return <p className={styles.state}>Đang tải lịch sử…</p>;
  if (error) return <p className={styles.state}>Chưa tải được lịch sử ôn.</p>;
  const items = data?.items || [];
  if (!items.length) return <p className={styles.state}>Bạn chưa ôn thẻ nào. Sau phiên đầu tiên, từng từ đã ôn sẽ hiện ở đây.</p>;

  const sessions = [];
  items.forEach(item => {
    const last = sessions[sessions.length - 1];
    if (last && last.id === item.phienId) last.items.push(item);
    else sessions.push({ id: item.phienId, items: [item] });
  });

  return sessions.slice(0, 4).map(session => {
    const times = session.items.map(item => Date.parse(item.createdAt));
    const forgot = session.items.filter(item => item.danhGia === 'QUEN').length;
    return (
      <div key={session.id} className={styles.group}>
        <p className={styles.groupHead}>
          <span>Phiên {dm(Math.min(...times))} lúc {hm(Math.min(...times))} · {DIR[session.items[0].chieuHoc]}</span>
          <span>{session.items.length} thẻ{forgot ? ` · ${forgot} quên` : ''}</span>
        </p>
        <ul className={styles.rows} role="list">
          {session.items.map(item => (
            <li key={item.id} className={styles.row}>
              <span className={styles.word} lang="en">{item.tu}</span>
              <span className={styles.mean}>{item.nghiaVi}</span>
              <span className={styles.rate} data-rate={item.danhGia}>{RATE[item.danhGia]}</span>
              <span className={styles.when}>{nextLabel(item.sau?.hanOnAt ? Date.parse(item.sau.hanOnAt) : null, now)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  });
}

export function ReviewSchedule({ decks = [] }) {
  const [tab, setTab] = useState('upcoming');
  const [now] = useState(() => Date.now());
  return (
    <section className={styles.schedule} aria-labelledby="schedule-title">
      <div className={styles.head}>
        <h2 id="schedule-title">Lịch ôn của bạn</h2>
        <div className={styles.tabs} role="tablist" aria-label="Lịch ôn">
          <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}><Icon name="calendar" />Sắp đến hạn</button>
          <button type="button" role="tab" aria-selected={tab === 'recent'} onClick={() => setTab('recent')}><Icon name="clock" />Đã ôn gần đây</button>
        </div>
      </div>
      <div role="tabpanel" className={styles.panel}>
        {tab === 'upcoming' ? <Upcoming decks={decks} now={now} /> : <Recent now={now} />}
      </div>
    </section>
  );
}
