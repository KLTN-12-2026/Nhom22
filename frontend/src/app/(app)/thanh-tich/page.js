'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { dateTime } from '@/lib/remote-contract.mjs';
import { Icon, Pagination } from '@/components/ui';
import { RemoteState, EmptyData } from '@/components/remote/Remote';
import styles from './page.module.css';

const REWARD_SOURCE = { ON_THE: 'Lượt ôn thẻ', BAI_LUYEN: 'Bài luyện đã nộp' };
const number = value => value == null ? '—' : value.toLocaleString('vi-VN');
const day = value => value ? value.split('-').reverse().join('/') : '—';
const rewardOptions = page => ({
  queryKey: ['rewards', page],
  queryFn: () => apiFetch(`/api/v1/rewards/history?page=${page - 1}&size=20`),
});

function RewardHistory() {
  const [page, setPage] = useState(1);
  const rewards = useQuery(rewardOptions(page));
  const history = rewards.data?.lichSu;

  return (
    <section className={styles.section} aria-labelledby="history-title">
      <h2 id="history-title">Lịch sử thưởng</h2>
      <div aria-live="polite" aria-busy={rewards.isFetching}>
        <RemoteState queries={[rewards]}>
          {!history?.items.length ? (
            <EmptyData>Chưa có điểm thưởng. Hoàn thành lượt ôn hoặc nộp bài luyện để nhận điểm.</EmptyData>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption>{number(history.totalElements)} sự kiện thưởng, mới nhất trước</caption>
                <thead><tr><th scope="col">Ngày</th><th scope="col">Nguồn hợp lệ</th><th scope="col">Điểm</th></tr></thead>
                <tbody>
                  {history.items.map(reward => (
                    <tr key={reward.id}>
                      <td data-label="Ngày"><time dateTime={reward.ngayDiaPhuong}>{day(reward.ngayDiaPhuong)}</time></td>
                      <td data-label="Nguồn hợp lệ">{REWARD_SOURCE[reward.loaiSuKien] || reward.loaiSuKien}</td>
                      <td data-label="Điểm">
                        <span className={styles.points}>+{number(reward.soDiem)}</span>
                        {reward.soDiem < reward.diemGoc && <span className={styles.capNote}>Đã chạm trần ngày</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RemoteState>
      </div>
      <Pagination page={page} totalPages={history?.totalPages || 0} onPageChange={setPage} />
    </section>
  );
}

export default function AchievementsPage() {
  const rewards = useQuery(rewardOptions(1));
  const badges = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: () => apiFetch('/api/v1/challenges') });
  const today = useQuery({ queryKey: ['learning-today'], queryFn: () => apiFetch('/api/v1/learning/today') });
  const currentChallenge = challenges.data?.[0];
  const metrics = [
    [number(rewards.data?.tongDiem), 'Điểm thưởng'],
    [today.data ? `${number(today.data.chuoiNgay)} ngày` : '—', 'Chuỗi ngày hợp lệ'],
    [badges.data ? `${number(badges.data.filter(badge => badge.daNhan).length)} / ${number(badges.data.length)}` : '—', 'Huy hiệu đã nhận'],
    [currentChallenge ? `${number(currentChallenge.giaTri)} / ${number(currentChallenge.mucTieu)}` : '—', 'Lượt ôn trong thử thách'],
  ];

  return (
    <div className={`page ${styles.page}`}>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span aria-current="page">Thành tích của bạn</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Học và mở rộng</span></div>
          <h1 id="page-title">Thành tích của bạn</h1>
          <p>Ghi nhận những bước học hợp lệ, không chạy đua điểm.</p>
        </div>

        <section className={styles.overview} aria-label="Tổng quan thành tích">
          <RemoteState queries={[rewards, badges, challenges, today]}>
            <dl className={styles.metrics}>
              {metrics.map(([value, label]) => (
                <div className={styles.metric} key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <p className={styles.summary}>Hôm nay <strong>{number(rewards.data?.diemHomNay)} / {number(rewards.data?.diemToiDaNgay)} điểm.</strong></p>
            <p className={styles.restNote}>
              <Icon name="info" />
              <span>{today.data?.daDungNgayNghiTuanNay
                ? `Đã dùng ngày nghỉ tuần này (${day(today.data.ngayNghiDaDung)}). Nghỉ thêm một ngày trong tuần sẽ đứt chuỗi.`
                : 'Mỗi tuần (thứ Hai–Chủ nhật) được nghỉ 1 ngày mà không đứt chuỗi.'}</span>
            </p>
          </RemoteState>
        </section>

        <section className={styles.section} aria-labelledby="badges-title">
          <h2 id="badges-title">Huy hiệu</h2>
          <RemoteState queries={[badges]}>
            {!badges.data?.length ? <EmptyData>Chưa có huy hiệu để hiển thị.</EmptyData> : (
              <div className={styles.grid}>
                {badges.data.map(badge => (
                  <article className={styles.card} key={badge.id}>
                    <Icon name="shield" />
                    <div>
                      <h3>{badge.ten}</h3>
                      <p>{badge.moTa}</p>
                      <span className={`stamp ${badge.daNhan ? 'stamp-success' : 'stamp-quiet'}`}>
                        <Icon name={badge.daNhan ? 'check' : 'lock'} />
                        {badge.daNhan ? 'Đã nhận' : 'Chưa nhận'}
                        {badge.daNhan && badge.nhanAt && <> · <time dateTime={badge.nhanAt}>{dateTime(badge.nhanAt)}</time></>}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </RemoteState>
        </section>

        <section className={styles.section} aria-labelledby="challenges-title">
          <h2 id="challenges-title">Thử thách tuần</h2>
          <RemoteState queries={[challenges]}>
            {!challenges.data?.length ? <EmptyData>Chưa có thử thách trong tuần này.</EmptyData> : challenges.data.map(challenge => (
              <article className={styles.challenge} key={challenge.id}>
                <div className={styles.challengeHead}>
                  <h3>{challenge.ten}</h3>
                  <span className={`stamp ${challenge.hoanThanhAt ? 'stamp-success' : 'stamp-quiet'}`}>
                    {challenge.hoanThanhAt && <Icon name="check" />}
                    {challenge.hoanThanhAt ? 'Đã hoàn thành' : 'Đang tham gia'}
                  </span>
                </div>
                <p className={styles.challengeMeta}>
                  <span>{number(challenge.giaTri)} / {number(challenge.mucTieu)} lượt ôn hợp lệ</span>
                  <span><time dateTime={challenge.tuanBatDau}>{day(challenge.tuanBatDau)}</time> – <time dateTime={challenge.tuanKetThuc}>{day(challenge.tuanKetThuc)}</time></span>
                </p>
                <div className="meter is-progress" role="progressbar" aria-label={challenge.ten}
                  aria-valuenow={Math.min(challenge.giaTri, challenge.mucTieu)} aria-valuemin={0} aria-valuemax={challenge.mucTieu || 1}
                  aria-valuetext={`${number(challenge.giaTri)} trên ${number(challenge.mucTieu)} lượt ôn hợp lệ`}
                  style={{ '--v': challenge.mucTieu > 0 ? Math.min(1, Math.max(0, challenge.giaTri / challenge.mucTieu)) : 0 }}>
                  <span />
                </div>
                <p className={styles.challengeDescription}>{challenge.moTa}</p>
                <p className={styles.challengeDescription}>Điểm và điều kiện do máy chủ xác nhận.</p>
                <Link className="btn btn-accent" href="/hoc"><Icon name="play" />Bắt đầu học</Link>
              </article>
            ))}
          </RemoteState>
        </section>

        <RewardHistory />
      </article>
    </div>
  );
}
