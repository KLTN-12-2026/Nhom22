'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { PODIUM_METAL, chaseLine, leaderboardKey } from '@/lib/leaderboard.mjs';
import { MetalIcon } from '@/components/tier/MetalIcon';
import styles from './LeaderboardMini.module.css';

export function LeaderboardMini() {
  const board = useQuery({ queryKey: leaderboardKey('TUAN', 10), queryFn: () => apiFetch('/api/v1/leaderboard?ky=TUAN&gioiHan=10'), staleTime: 60000 });
  const data = board.data;
  if (!data || !data.thamGia) return null;
  const me = data.toi;
  const metal = me && me.hang <= 3 ? PODIUM_METAL[me.hang] : 'steel';
  return <Link href="/bang-xep-hang" className={styles.card} aria-label="Mở bảng xếp hạng siêng năng">
    <MetalIcon name={me && me.hang === 1 ? 'trophy' : 'medal'} metal={metal} size={34} />
    <span className={styles.body}>
      <span className={styles.title}>{me ? <>Bạn hạng <b>#{me.hang}</b> tuần này</> : 'Bảng xếp hạng tuần này'}</span>
      <span className={styles.line}>{me ? chaseLine(data) || `${me.soNgay} ngày học đủ` : 'Ôn đủ 5 lượt hôm nay để có tên trên bảng'}</span>
    </span>
    <span className={styles.more} aria-hidden="true">Xem bảng</span>
  </Link>;
}
