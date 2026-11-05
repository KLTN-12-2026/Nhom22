'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const WORDS = ['receipt', 'appointment', 'schedule'];
const SKILLS = [
  { id: 'meaning', label: 'Nhận nghĩa', level: 'Vững qua nhiều lượt', value: 80, tone: 'steady', evidence: '4/5 lượt gần đây đúng' },
  { id: 'spelling', label: 'Chính tả', level: 'Cần luyện', value: 40, tone: 'low', evidence: 'Sai 3/5 lượt gần đây' },
  { id: 'speaking', label: 'Phát âm', level: 'Chưa đủ dữ liệu', value: 0, tone: 'unknown', evidence: 'Chưa có lượt đánh giá được xác nhận' },
];

export default function MasteryMapPage() {
  const [deck, setDeck] = useState('all');
  const [skill, setSkill] = useState('all');
  const visibleSkills = useMemo(() => SKILLS.filter(item => skill === 'all' || item.id === skill), [skill]);

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/goi-y">Gợi ý ôn tập</Link>
      </div>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Bản đồ làm chủ</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Tiến bộ</span><span>UI36 · Đợt 3</span></div>
          <h1 id="page-title">Bản đồ làm chủ</h1>
          <p>Nhận nghĩa, chính tả và phát âm được xem riêng.</p>
        </div>
        <p className={styles.note}>Mức độ làm chủ được xem riêng theo kỹ năng. Một câu đúng chưa đủ để đánh dấu đã vững.</p>

        <form className={styles.filter} onSubmit={event => event.preventDefault()}>
          <div className="field">
            <label className="field-label" htmlFor="mastery-deck">Bộ thẻ</label>
            <select className="select" id="mastery-deck" value={deck} onChange={event => setDeck(event.target.value)}>
              <option value="all">Tất cả bộ</option>
              <option value="toeic">TOEIC — công sở</option>
              <option value="daily">Giao tiếp hằng ngày</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="mastery-skill">Kỹ năng</label>
            <select className="select" id="mastery-skill" value={skill} onChange={event => setSkill(event.target.value)}>
              <option value="all">Tất cả</option>
              <option value="meaning">Nhận nghĩa</option>
              <option value="spelling">Chính tả</option>
              <option value="speaking">Phát âm</option>
            </select>
          </div>
          <button className="btn btn-secondary" type="submit"><Icon name="filter" />Lọc</button>
        </form>

        <section className={styles.grid} aria-label="Bản đồ theo từng từ">
          {WORDS.map(word => (
            <article className={styles.card} key={word}>
              <div className={styles.cardHeader}>
                <h2 className="word" lang="en">{word}</h2>
                <span className="stamp stamp-quiet">{deck === 'all' ? 'Tất cả bộ' : 'Bộ đã chọn'}</span>
              </div>
              <div className={styles.skills}>
                {visibleSkills.map(item => (
                  <div className={`${styles.skill} ${styles[item.tone]}`} key={item.id}>
                    <div className="row-between"><strong>{item.label}</strong><span className="small">{item.level}</span></div>
                    <div className={styles.meter} role="progressbar" aria-label={`${item.label} của ${word}`} aria-valuenow={item.value} aria-valuemin="0" aria-valuemax="100">
                      <span style={{ width: `${item.value}%` }} />
                    </div>
                    <p className="small muted">Bằng chứng mẫu: {item.evidence}</p>
                  </div>
                ))}
              </div>
              <Link className="btn btn-primary" href={`/luyen-tap?boTheId=${deck === 'all' ? '' : deck}&tu=${word}`}>Luyện lại từ này</Link>
            </article>
          ))}
        </section>
        <p className="small muted">Các nhãn “Cần luyện”, “Đang củng cố”, “Vững qua nhiều lượt”, “Chưa đủ dữ liệu” luôn đi cùng màu.</p>
      </article>
    </div>
  );
}
