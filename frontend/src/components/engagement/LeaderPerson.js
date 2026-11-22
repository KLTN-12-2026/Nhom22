'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { TIERS, tierFromCode } from '@/lib/tier.mjs';
import { MetalIcon } from '@/components/tier/MetalIcon';
import { Icon } from '@/components/ui';
import { BadgeArt } from './BadgeArt';
import styles from './LeaderPerson.module.css';

const number = value => Number(value || 0).toLocaleString('vi-VN');
const initial = name => (String(name || '?').trim().split(/\s+/).pop()?.[0] || '?').toUpperCase();
const joined = iso => (iso ? new Date(iso).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '');
const CARD_W = 340;
const OPEN_DELAY = 220;
const CLOSE_DELAY = 160;

function Card({ entry, context, profile }) {
  const { data, isLoading, error } = profile;
  const tier = tierFromCode(entry.goiMa);
  const tierInfo = tier && tier !== 'free' ? TIERS[tier] : null;
  const badges = data?.huyHieu || [];
  const stats = data ? [
    { icon: 'flame', label: 'Chuỗi ngày', value: number(data.chuoiNgay), tone: 'warm' },
    { icon: 'calendar', label: 'Ngày học', value: number(data.soNgayHoc) },
    { icon: 'refresh', label: 'Lượt ôn', value: number(data.soLuotOn) },
    { icon: 'practice', label: 'Bài luyện', value: number(data.soBaiLuyen) },
    { icon: 'decks', label: 'Bộ thẻ', value: number(data.soBoThe), note: data.soBoCongKhai ? `${number(data.soBoCongKhai)} công khai` : null },
    { icon: 'card', label: 'Thẻ', value: number(data.soThe) },
  ] : [];
  return <>
    <div className={styles.top} data-tier={tier}>
      <span className={styles.avatar} data-tier={tier}>
        <span>{entry.anhDaiDienUrl ? <img src={entry.anhDaiDienUrl} alt="" /> : initial(entry.tenHienThi)}</span>
      </span>
      <span className={styles.who}>
        <b className={styles.name}>{entry.tenHienThi}</b>
        <span className={styles.subline}>
          {tierInfo && <span className={styles.tier}><MetalIcon name={tierInfo.icon} metal={tierInfo.metal} size={13} />{tierInfo.label}</span>}
          {data?.thamGiaAt && <span>Tham gia {joined(data.thamGiaAt)}</span>}
        </span>
      </span>
    </div>

    {context && <p className={styles.context}>
      {context.rank && <span className={styles.rank}>#{context.rank}</span>}
      <span>{context.label}</span>
      <span className={styles.contextStat}><b>{number(entry.soNgay)}</b> ngày · <b>{number(entry.soLuotHopLe)}</b> lượt</span>
    </p>}

    {isLoading && <div className={styles.loading} role="status" aria-label="Đang tải thông tin">{[0, 1, 2, 3, 4, 5].map(i => <span key={i} />)}</div>}
    {error && <p className={styles.muted}>{error.status === 404 ? 'Người này đã ẩn hồ sơ khỏi bảng xếp hạng.' : 'Chưa tải được thông tin. Thử lại sau.'}</p>}

    {data && <>
      <dl className={styles.stats}>
        {stats.map(stat => <div key={stat.label} data-tone={stat.tone}>
          <dt><Icon name={stat.icon} />{stat.label}</dt>
          <dd>{stat.value}{stat.note && <small>{stat.note}</small>}</dd>
        </div>)}
        {data.soLanTop3 > 0 && <div className={styles.wide}>
          <dt><MetalIcon name="crown" metal="gold" size={15} />Vinh danh tuần</dt>
          <dd>{number(data.soLanTop3)} lần top 3</dd>
        </div>}
      </dl>

      <div className={styles.badges}>
        <span className={styles.badgesTitle}>Huy hiệu <b>{badges.length}</b></span>
        {badges.length
          ? <ul>{badges.slice(0, 7).map(badge => <li key={badge.ma} title={badge.ten}><BadgeArt badge={badge} size={34} number={null} /><span className="sr-only">{badge.ten}</span></li>)}
            {badges.length > 7 && <li className={styles.more}>+{badges.length - 7}</li>}</ul>
          : <p className={styles.muted}>Chưa có huy hiệu nào.</p>}
      </div>

      {data.soBoCongKhai > 0 && <Link className={styles.link} href={`/tac-gia/${entry.nguoiDungId}`}>Xem các bộ công khai<Icon name="chevron-right" /></Link>}
    </>}
  </>;
}

export function LeaderPerson({ entry, context, className = '', children }) {
  const cardId = useId();
  const trigger = useRef(null);
  const card = useRef(null);
  const timer = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const profile = useQuery({
    queryKey: ['leaderboard', 'person', entry.nguoiDungId],
    queryFn: () => apiFetch(`/api/v1/leaderboard/users/${encodeURIComponent(entry.nguoiDungId)}`),
    enabled: open,
    staleTime: 300000,
    retry: false,
  });

  const later = (fn, ms) => { clearTimeout(timer.current); timer.current = setTimeout(fn, ms); };
  const place = useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(CARD_W, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
    const height = card.current?.offsetHeight || 380;
    const below = rect.bottom + 10;
    const room = window.innerHeight - 16;
    let top = below;
    if (below + height > window.innerHeight - 8) {
      top = rect.top - height - 10 > 8 ? rect.top - height - 10 : Math.max(8, window.innerHeight - 8 - Math.min(height, room));
    }
    setPos({ left, top, width, above: top < rect.top, maxHeight: room });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place, profile.data, profile.error]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    const onDown = event => {
      if (!trigger.current?.contains(event.target) && !card.current?.contains(event.target)) setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, place]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const hoverIn = event => { if (event.pointerType === 'mouse') later(() => setOpen(true), OPEN_DELAY); };
  const hoverOut = event => { if (event.pointerType === 'mouse') later(() => setOpen(false), CLOSE_DELAY); };

  return <>
    <button
      ref={trigger}
      type="button"
      className={`${styles.trigger} ${className}`}
      aria-expanded={open}
      aria-controls={open ? cardId : undefined}
      aria-label={`Xem thông tin ${entry.tenHienThi}`}
      onClick={event => { clearTimeout(timer.current); if (event.nativeEvent.pointerType === 'mouse') setOpen(true); else setOpen(value => !value); }}
      onPointerEnter={hoverIn}
      onPointerLeave={hoverOut}
    >
      {children}
    </button>
    {open && typeof document !== 'undefined' && createPortal(<div
      ref={card}
      id={cardId}
      role="dialog"
      aria-label={`Thông tin ${entry.tenHienThi}`}
      className={styles.card}
      data-above={pos?.above || undefined}
      style={pos ? { left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxHeight } : { visibility: 'hidden' }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') clearTimeout(timer.current); }}
      onPointerLeave={hoverOut}
    >
      <Card entry={entry} context={context} profile={profile} />
    </div>, document.body)}
  </>;
}
