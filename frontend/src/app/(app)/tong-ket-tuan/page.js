'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

const WEEKS = {
  this: {
    label: '05–11/10/2026',
    metrics: [['18', 'Từ mới đã học'], ['56', 'Lượt ôn hợp lệ'], ['4', 'Ngày học hợp lệ'], ['8 / 10', 'Lượt chính tả đúng']],
    progress: 'Chính tả tăng từ 6/10 lên 8/10 lượt đúng trong dữ liệu mẫu. Phát âm chưa có đủ dữ liệu để so sánh.',
  },
  last: {
    label: '28/09–04/10/2026',
    metrics: [['12', 'Từ mới đã học'], ['40', 'Lượt ôn hợp lệ'], ['3', 'Ngày học hợp lệ'], ['6 / 10', 'Lượt chính tả đúng']],
    progress: 'Bạn đã duy trì được nhịp học ổn định. Tuần này có thể tăng nhẹ số lượt ôn nếu vẫn thấy thoải mái.',
  },
};

export default function WeeklySummaryPage() {
  const [week, setWeek] = useState('this');
  const current = WEEKS[week];

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/goi-y">Gợi ý ôn tập</Link>
      </div>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Tổng kết tuần</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Tiến bộ</span><span>UI37 · Đợt 3</span></div>
          <h1 id="page-title">Tổng kết tuần</h1>
          <p>Nhìn lại một tuần, chọn việc vừa sức cho tuần sau.</p>
        </div>

        <div className={styles.filter}>
          <div className="field">
            <label className="field-label" htmlFor="week">Tuần xem tổng kết</label>
            <select className="select" id="week" value={week} onChange={event => setWeek(event.target.value)}>
              <option value="this">{WEEKS.this.label}</option>
              <option value="last">{WEEKS.last.label}</option>
            </select>
          </div>
          <span className="small muted">Theo Asia/Ho_Chi_Minh · dữ liệu mẫu</span>
        </div>

        <section className={styles.metricsSection} aria-label="Chỉ số tổng kết tuần">
          <div className={styles.metrics}>
            {current.metrics.map(([value, label]) => <div className={styles.metric} key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="progress-title">
          <h2 id="progress-title">Một bước tiến rõ ràng</h2>
          <p>{current.progress}</p>
        </section>

        <section className={styles.section} aria-labelledby="focus-title">
          <h2 id="focus-title">Ba từ cần chú ý</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Tổng kết từ dữ liệu học, không sinh số liệu bằng AI</caption>
              <thead><tr><th>Từ</th><th>Bằng chứng mẫu</th><th>Bước tiếp theo</th></tr></thead>
              <tbody>
                <tr><td data-label="Từ"><strong lang="en">receipt</strong></td><td data-label="Bằng chứng mẫu">Quên 3/5 lượt gần đây</td><td data-label="Bước tiếp theo"><Link className="btn btn-primary btn-sm" href="/luyen-tap?nguon=SO_TAY">Ôn lại</Link></td></tr>
                <tr><td data-label="Từ"><strong lang="en">appointment</strong></td><td data-label="Bằng chứng mẫu">Sai chính tả 2 lần</td><td data-label="Bước tiếp theo"><Link className="btn btn-secondary btn-sm" href="/ai-viet-cau?word=appointment">Viết câu</Link></td></tr>
                <tr><td data-label="Từ"><strong lang="en">complementary</strong></td><td data-label="Bằng chứng mẫu">Nhầm với complimentary</td><td data-label="Bước tiếp theo"><Link className="btn btn-secondary btn-sm" href="/so-tay">Xem sổ tay</Link></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="next-title">
          <h2 id="next-title">Tuần sau, giữ mục tiêu vừa sức</h2>
          <p>Gợi ý 5 phút/ngày và ôn ba từ này trước khi thêm từ mới. Bạn quyết định có thay đổi kế hoạch hay không.</p>
          <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap">Xem thiết lập học</Link>
        </section>
      </article>
    </div>
  );
}
