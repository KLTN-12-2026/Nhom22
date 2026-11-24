'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { LibraryDeckList } from '@/components/content/LibraryDeckList';
import { ReportDialog } from '@/components/content/ReportDialog';
import { isUnavailableUser } from '@/lib/share.mjs';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';
import { useLibraryAuthor } from '@/hooks/useSearch';
import { useMe } from '@/hooks/useMe';
import { libraryPage } from '@/lib/library-query.mjs';
import { ProfileAvatar } from '@/components/profile/ProfileParts';
import { MemberActions, MemberFields, MemberHero, monthText } from '@/components/profile/MemberSheet';
import { MembershipCard } from '@/components/tier/MembershipCard';
import { TierPlate } from '@/components/tier/TierPlate';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { TIERS, tierFromCode } from '@/lib/tier.mjs';
import styles from './page.module.css';

const SIZE = 20;

export default function AuthorPage() {
  return <Suspense fallback={<p className="page" role="status">Đang tải tác giả…</p>}><AuthorContent /></Suspense>;
}

function AuthorContent() {
  const { id } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const sort = ['updated', 'name', 'size'].includes(search.get('sort')) ? search.get('sort') : 'updated';
  const page = libraryPage(search.get('page'));
  const validId = /^[1-9][0-9]{0,18}$/.test(String(id || ''));

  const { data: me } = useMe();
  const [reporting, setReporting] = useState(false);
  const author = useLibraryAuthor(validId ? id : null);
  const decks = useLibraryDecks({ chuSoHuuId: id, sort, page, size: SIZE }, { enabled: validId && Boolean(author.data) });

  const change = (key, value) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.replace(`/tac-gia/${id}?${next}`, { scroll: false });
  };

  if (isUnavailableUser(author.error)) {
    return (
      <div className="page">
        <section className="sheet">
          <div className="empty" role="status">
            <h1>Người dùng không khả dụng</h1>
            <p>Tài khoản này đang bị tạm khóa. Hồ sơ và các bộ thẻ công khai của họ đã được ẩn.</p>
            <Link className="btn btn-secondary" href="/thu-vien">Mở thư viện</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!validId || author.error?.status === 404) {
    return (
      <div className="page">
        <section className="sheet">
          <div className="empty">
            <h1>Không tìm thấy tác giả</h1>
            <p>Tác giả không tồn tại hoặc chưa chia sẻ bộ thẻ công khai nào.</p>
            <Link className="btn btn-secondary" href="/thu-vien">Mở thư viện</Link>
          </div>
        </section>
      </div>
    );
  }

  if (author.error) {
    return <div className="page"><ErrorState description={author.error.message} onRetry={author.refetch} /></div>;
  }

  const profile = author.data;
  const items = decks.data?.items || [];
  const isMe = Boolean(me && profile && String(me.id) === String(profile.id));
  const badges = profile?.huyHieu || [];
  const tier = profile?.goiMa ? tierFromCode(profile.goiMa) : null;

  return (
    <div className={`page ${styles.profile}`}>
      <p className={styles.back}><Link href="/thu-vien"><Icon name="arrow-left" />Về thư viện</Link></p>
      <MemberHero
        card={tier && profile ? <MembershipCard tier={tier} name={profile.tenHienThi} since={profile.thamGiaAt} /> : null}
        avatar={<ProfileAvatar src={profile?.anhDaiDienUrl} name={profile?.tenHienThi} tier={tier} size="md" />}
        name={profile ? profile.tenHienThi : 'Đang tải…'}
        sub={<>{tier && <TierPlate tier={tier} />}<span>{isMe ? 'Hồ sơ công khai của bạn' : 'Tác giả bộ thẻ công khai'}</span></>}
        statsLabel="Số liệu tác giả"
        statsLoading={author.isLoading}
        stats={[
          { label: 'Bộ công khai', value: profile?.soBoThe },
          { label: 'Thẻ từ vựng', value: profile?.soThe },
        ]}
        badges={{ earned: badges }}
      >
        <MemberFields items={[
          { label: 'Tham gia', value: monthText(profile?.thamGiaAt) },
          { label: 'Gói', value: TIERS[tier]?.label || 'Free' },
          { label: 'Vai trò', value: tier === 'admin' ? 'Quản trị viên' : 'Tác giả' },
        ]} />
        {(isMe || (me && profile)) && (
          <MemberActions>
            {isMe && <Link className="btn btn-secondary" href="/ca-nhan"><Icon name="edit" />Chỉnh sửa hồ sơ</Link>}
            {me && profile && !isMe && <button type="button" className="btn btn-quiet" onClick={() => setReporting(true)}><Icon name="flag" />Báo cáo người dùng</button>}
          </MemberActions>
        )}
      </MemberHero>
      {reporting && profile && <ReportDialog loaiDoiTuong="NGUOI_DUNG" doiTuongId={String(profile.id)} name={profile.tenHienThi} onClose={() => setReporting(false)} />}

      <section className={styles.main} aria-labelledby="decks-title">
        {profile && <ActivityHeatmap title="Hoạt động học trong năm" source={{ url: `/api/v1/library/authors/${id}/activity`, queryKey: ['author-activity', String(id)], metrics: ['soLuotOn', 'soCongKhai'] }} />}
        <nav className={styles.tabs} aria-label="Hồ sơ tác giả">
          <span className={styles.tab} aria-current="page">
            <Icon name="library" />Bộ thẻ công khai{decks.data && <span className={styles.count}>{decks.data.totalElements}</span>}
          </span>
        </nav>
        <h2 id="decks-title" className="sr-only">Bộ thẻ công khai</h2>

        <div className={styles.bar}>
          <p className="muted" aria-live="polite">{decks.data ? `${decks.data.totalElements} bộ thẻ` : ''}</p>
          <label className={styles.sort}>
            <span className="caption">Sắp xếp</span>
            <select className="select" value={sort} onChange={event => change('sort', event.target.value)}>
              <option value="updated">Mới cập nhật</option>
              <option value="name">Tên A–Z</option>
              <option value="size">Nhiều thẻ nhất</option>
            </select>
          </label>
        </div>

        {decks.error && <ErrorState description={decks.error.message} onRetry={decks.refetch} />}
        {!decks.error && (author.isLoading || decks.isLoading) && (
          <div className="skeleton" role="status" aria-label="Đang tải bộ thẻ">
            <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
          </div>
        )}
        {!decks.error && decks.data && items.length === 0 && (
          <div className="empty">
            <h2>Chưa có bộ thẻ công khai</h2>
            <p>Tác giả này chưa chia sẻ bộ thẻ nào.</p>
          </div>
        )}
        {items.length > 0 && <LibraryDeckList decks={items} offset={page * SIZE} showAuthor={false} />}
        <Pagination page={page + 1} totalPages={decks.data?.totalPages || 0} onPageChange={value => change('page', String(value - 1))} />
      </section>
    </div>
  );
}
