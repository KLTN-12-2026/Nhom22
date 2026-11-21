'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { Icon } from '@/components/ui';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { CopyBadge } from '@/components/content/CopyBadge';
import styles from './page.module.css';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const ACCESS = { CONG_KHAI: 'Công khai', RIENG_TU: 'Riêng tư', CHIA_SE_LINK: 'Chia sẻ link' };
const PINNED = 6;

const pinned = decks => [...decks]
  .sort((a, b) => Number(b.yeuThich) - Number(a.yeuThich) || new Date(b.updatedAt) - new Date(a.updatedAt))
  .slice(0, PINNED);

export default function ProfileOverviewPage() {
  const { data: decks = [], isLoading } = useQuery({ queryKey: ['all-my-decks'], queryFn: () => fetchAllPages('/api/v1/decks') });
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });
  const totalCards = decks.reduce((sum, d) => sum + (d.soThe || 0), 0);
  const publicDecks = decks.filter(d => d.quyenTruyCap === 'CONG_KHAI').length;
  const stats = [
    { label: 'Bộ thẻ', value: decks.length, icon: 'decks' },
    { label: 'Thẻ từ vựng', value: totalCards, icon: 'notebook' },
    { label: 'Bộ công khai', value: publicDecks, icon: 'globe' },
    { label: 'Huy hiệu', value: badges.filter(b => b.daNhan).length, icon: 'star' },
  ];

  return (
    <>
      <h1 id="page-title" className="sr-only">Tổng quan hồ sơ</h1>

      <ul className={styles.stats} role="list">
        {stats.map(s => (
          <li key={s.label} className={styles.stat}>
            <Icon name={s.icon} />
            <b>{isLoading ? '—' : s.value.toLocaleString('vi-VN')}</b>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="pinned-title">
        <div className={styles.sectionHead}>
          <h2 id="pinned-title" className={styles.sectionTitle}>Bộ thẻ nổi bật</h2>
          <Link href="/bo-the" className={styles.more}>Xem tất cả</Link>
        </div>
        {isLoading ? (
          <div className={styles.pinned}>{[0, 1, 2, 3].map(i => <div key={i} className={`${styles.deck} sk`} style={{ height: 112 }} />)}</div>
        ) : decks.length ? (
          <ul className={styles.pinned} role="list">
            {pinned(decks).map(deck => (
              <li key={deck.id} className={styles.deck}>
                <div className={styles.deckHead}>
                  <Icon name="decks" />
                  <Link href={`/bo-the/${deck.id}`} className={styles.deckName}>{deck.ten}</Link>
                  <span className={styles.access}>{ACCESS[deck.quyenTruyCap] || deck.quyenTruyCap}</span>
                </div>
                {deck.banSao && <CopyBadge banSao={deck.banSao} compact />}
                <p className={styles.deckDesc}>{deck.moTa || 'Chưa có mô tả.'}</p>
                <p className={styles.deckMeta}>
                  {deck.yeuThich && <span><Icon name="heart" />Yêu thích</span>}
                  <span><span className={styles.levelDot} data-level={deck.trinhDo} />{LEVEL[deck.trinhDo] || deck.trinhDo}</span>
                  <span>{deck.soThe} thẻ</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Bạn chưa có bộ thẻ nào. <Link href="/thu-vien">Sao chép từ thư viện</Link> hoặc <Link href="/bo-the/tao">tạo bộ mới</Link>.</p>
        )}
      </section>

      <ActivityHeatmap />
    </>
  );
}
