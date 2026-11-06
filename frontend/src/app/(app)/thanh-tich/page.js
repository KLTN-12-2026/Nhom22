'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const METRICS = [
  ['180', 'Điểm thưởng mẫu'],
  ['4 ngày', 'Chuỗi ngày hợp lệ'],
  ['2 / 8', 'Huy hiệu mẫu'],
  ['24 / 40', 'Lượt ôn trong thử thách'],
];

const BADGES = [
  { name: 'Khởi động đều', rule: 'Học hợp lệ trong 3 ngày liên tiếp' },
  { name: 'Ôn có chủ đích', rule: 'Hoàn thành 10 lượt ôn trong một tuần' },
];

const REWARDS = [
  ['11/10', 'Phiên ôn 12 lượt', '+12'],
  ['10/10', 'Bài luyện đã nộp', '+8'],
  ['09/10', 'Phiên ôn 10 lượt', '+10'],
];

export default function AchievementsPage() {
  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/tong-ket-tuan">Tổng kết tuần</Link>
      </div>

      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link>
          <span aria-hidden="true">/</span>
          <span>Thành tích của bạn</span>
        </nav>

        <div className="form-head">
          <div className="form-code"><span>Học và mở rộng</span><span>UI38 · Đợt 3</span></div>
          <h1 id="page-title">Thành tích của bạn</h1>
          <p>Ghi nhận những bước học hợp lệ, không chạy đua điểm.</p>
        </div>

        <section className={styles.metrics} aria-label="Tổng quan thành tích">
          {METRICS.map(([value, label]) => (
            <div className={styles.metric} key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className={styles.section} aria-labelledby="badges-title">
          <h2 id="badges-title">Huy hiệu đã nhận</h2>
          <div className={styles.grid}>
            {BADGES.map((badge) => (
              <article className={styles.card} key={badge.name}>
                <Icon name="shield" />
                <div>
                  <h3>{badge.name}</h3>
                  <p className="small muted">{badge.rule}</p>
                  <span className="stamp stamp-success">Đã nhận · dữ liệu mẫu</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="challenge-title">
          <h2 id="challenge-title">Thử thách tuần</h2>
          <div className={styles.challenge}>
            <div className="row-between">
              <h3>Tuần học nhẹ nhàng</h3>
              <span className="stamp stamp-quiet">Đang tham gia</span>
            </div>
            <p>24/40 lượt ôn hợp lệ · còn 3 ngày trong ví dụ</p>
            <div className="meter is-progress" role="progressbar" aria-label="Thử thách tuần mẫu" aria-valuenow="24" aria-valuemin="0" aria-valuemax="40">
              <span style={{ '--v': '.6' }} />
            </div>
            <p className="small muted">Không tự cộng điểm khi bấm xem. Điểm và điều kiện do máy chủ xác nhận.</p>
            <Link className="btn btn-accent" href="/hom-nay">Bắt đầu học</Link>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="history-title">
          <h2 id="history-title">Lịch sử thưởng</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Lịch sử thưởng mẫu</caption>
              <thead><tr><th scope="col">Ngày</th><th scope="col">Nguồn hợp lệ</th><th scope="col">Điểm</th></tr></thead>
              <tbody>
                {REWARDS.map(([date, source, points]) => (
                  <tr key={date}><td data-label="Ngày">{date}</td><td data-label="Nguồn hợp lệ">{source}</td><td data-label="Điểm">{points}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </div>
  );
}
