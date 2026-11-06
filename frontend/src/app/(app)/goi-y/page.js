'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const RECOMMENDATIONS = [
  {
    id: 'receipt',
    title: 'receipt',
    tag: 'Cần ôn lại',
    reason: 'Quên 3/5 lượt gần đây',
    explanation: 'Nhận nghĩa còn chưa ổn định. Ôn lại từ này trước khi thêm từ mới.',
    evidence: 'Sai ở câu chọn nghĩa trong 3 lượt gần đây.',
    action: 'Ôn từ này',
    href: '/luyen-tap?nguon=SO_TAY',
  },
  {
    id: 'confusing',
    title: 'complimentary / complementary',
    tag: 'Cặp từ dễ nhầm',
    reason: 'Nhầm 2 lần trong bài điền từ',
    explanation: 'So sánh “miễn phí” và “bổ trợ” trong hai câu cụ thể.',
    evidence: 'Chọn nhầm “complimentary” khi muốn nói tính bổ trợ.',
    action: 'Luyện phân biệt',
    href: '/luyen-tap?loaiBai=PHAN_BIET_CAP',
  },
];

export default function RecommendationsPage() {
  const [openedEvidence, setOpenedEvidence] = useState(null);

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
      </div>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Gợi ý ôn tập</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Tiến bộ</span><span>UI28 · Đợt 3</span></div>
          <h1 id="page-title">Gợi ý ôn tập</h1>
          <p>Một vài bước tiếp theo, kèm bằng chứng từ việc học.</p>
        </div>

        <section className={styles.section} aria-labelledby="focus-title">
          <div className={styles.sectionHeader}>
            <div><h2 id="focus-title">Hôm nay, tập trung vào đâu?</h2><p className="small muted">Gợi ý dựa trên những lượt học gần đây của bạn.</p></div>
            <span className="stamp stamp-quiet">2 gợi ý mẫu</span>
          </div>
          <div className={styles.grid}>
            {RECOMMENDATIONS.map(item => (
              <article className={styles.card} key={item.id}>
                <h3 className="word" lang="en">{item.title}</h3>
                <span className="stamp stamp-warning">{item.tag}</span>
                <p>{item.explanation}</p>
                <p className="small"><strong>Bằng chứng mẫu:</strong> {item.reason}</p>
                <div className={styles.actions}>
                  <Link className="btn btn-primary" href={item.href}>{item.action}</Link>
                  <button className="btn btn-secondary" type="button" onClick={() => setOpenedEvidence(openedEvidence === item.id ? null : item.id)}>
                    <Icon name="eye" />Xem bằng chứng
                  </button>
                </div>
                {openedEvidence === item.id && (
                  <div className={styles.evidence} role="status">
                    <Icon name="info" />
                    <span>{item.evidence}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="notebook-title">
          <h2 id="notebook-title">Gợi ý trong sổ tay</h2>
          <article className={styles.notebookCard}>
            <div>
              <span className="caption">Viết lại trong ngữ cảnh</span>
              <h3 className="word" lang="en">appointment</h3>
              <p>Sai chính tả 2/4 lượt gần đây. Tập viết trong một câu ngắn, không chỉ nhận nghĩa.</p>
            </div>
            <div className={styles.actions}>
              <Link className="btn btn-primary" href="/ai-viet-cau?word=appointment">Viết câu dùng thử</Link>
              <Link className="btn btn-quiet" href="/so-tay">Mở sổ tay</Link>
            </div>
          </article>
        </section>
      </article>
    </div>
  );
}
