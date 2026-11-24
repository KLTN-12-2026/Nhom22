'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { Icon } from '@/components/ui';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import styles from './page.module.css';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const ACCESS = { CONG_KHAI: 'Công khai', RIENG_TU: 'Riêng tư', CHIA_SE_LINK: 'Chia sẻ link' };
const PINNED = 6;

const pinned = decks => [...decks]
  .sort((a, b) => Number(b.yeuThich) - Number(a.yeuThich) || new Date(b.updatedAt) - new Date(a.updatedAt))
  .slice(0, PINNED);

export default function ProfileOverviewPage() {
  const { data: decks = [], isLoading } = useQuery({ queryKey: ['all-my-decks'], queryFn: () => fetchAllPages('/api/v1/decks') });

  return (
    <>
      <section aria-labelledby="pinned-title">
        <div className={styles.sectionHead}>
          <h2 id="pinned-title" className={styles.sectionTitle}>Bộ thẻ nổi bật</h2>
          <Link href="/bo-the" className={styles.more}>Xem tất cả</Link>
        </div>
        {isLoading ? (
          <div className={styles.rows} aria-busy="true">{[0, 1, 2].map(i => <div key={i} className={`${styles.skRow} sk`} />)}</div>
        ) : decks.length ? (
          <ol className={styles.rows} role="list">
            {pinned(decks).map((deck, i) => (
              <li key={deck.id} className={styles.row}>
                <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className={styles.body}>
                  <p className={styles.title}>
                    <Link href={`/bo-the/${deck.id}`} className={styles.deckName}>{deck.ten}</Link>
                    {deck.yeuThich && <span className={styles.fav} title="Yêu thích"><Icon name="heart" /><span className="sr-only">Yêu thích</span></span>}
                    {deck.banSao && <span className={styles.copy}>Bản sao</span>}
                  </p>
                  <p className={styles.deckDesc}>{deck.moTa || 'Chưa có mô tả.'}</p>
                </div>
                <div className={styles.side}>
                  <span className={styles.size}>{Number(deck.soThe || 0).toLocaleString('vi-VN')} <small>thẻ</small></span>
                  <span className={styles.meta}><span className={styles.levelDot} data-level={deck.trinhDo} />{LEVEL[deck.trinhDo] || deck.trinhDo} · {ACCESS[deck.quyenTruyCap] || deck.quyenTruyCap}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>Bạn chưa có bộ thẻ nào. <Link href="/thu-vien">Sao chép từ thư viện</Link> hoặc <Link href="/bo-the/tao">tạo bộ mới</Link>.</p>
        )}
      </section>

      <ActivityHeatmap />
    </>
  );
}
