'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const RECORDS = [
  { id: 1, word: 'receipt', score: 86, clarity: 'Khá rõ', rhythm: 'Ổn định', date: 'Hôm nay, 10:30', duration: '00:04' },
  { id: 2, word: 'receipt', score: 72, clarity: 'Đang cải thiện', rhythm: 'Chưa đều', date: 'Hôm qua, 16:42', duration: '00:05' },
  { id: 3, word: 'schedule', score: 91, clarity: 'Rõ', rhythm: 'Tốt', date: 'Hôm qua, 09:18', duration: '00:03' },
  { id: 4, word: 'appointment', score: 68, clarity: 'Cần luyện thêm', rhythm: 'Chưa đều', date: '31/10/2026, 14:25', duration: '00:06' },
  { id: 5, word: 'receipt', score: 64, clarity: 'Cần luyện thêm', rhythm: 'Chưa đều', date: '30/10/2026, 20:10', duration: '00:04' },
];

const wordLabels = { all: 'Tất cả', receipt: 'receipt', schedule: 'schedule', appointment: 'appointment' };

function speak(text) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

export default function PronunciationHistoryPage() {
  const [wordFilter, setWordFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const records = useMemo(() => RECORDS.filter(record => wordFilter === 'all' || record.word === wordFilter), [wordFilter]);
  const canCompare = selectedIds.length === 2;

  const toggleSelection = (id) => {
    setComparison(null);
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : current.length < 2 ? [...current, id] : [current[1], id]);
  };

  const compare = () => {
    if (!canCompare) return;
    const selected = RECORDS.filter(record => selectedIds.includes(record.id));
    setComparison(selected.sort((a, b) => a.date.localeCompare(b.date)));
  };

  const resetFilter = (event) => {
    setWordFilter(event.target.value);
    setSelectedIds([]);
    setComparison(null);
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/phat-am">Góc phát âm</Link>
      </div>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Lịch sử phát âm</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Học và mở rộng</span><span>UI34 · Đợt 3</span></div>
          <h1 id="page-title">Lịch sử phát âm</h1>
          <p>So sánh các lượt của cùng một từ bằng chỉ số có sẵn.</p>
        </div>

        <section className={styles.historySection} aria-labelledby="records-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="records-title">Các lượt đã ghi</h2>
              <p className="small muted">Chọn hai lượt của cùng một từ để xem sự thay đổi.</p>
            </div>
            <Link className="btn btn-primary" href="/phat-am">Ghi lượt mới</Link>
          </div>
          <div className={styles.filter}>
            <div className="field">
              <label className="field-label" htmlFor="record-filter">Từ cần xem</label>
              <select className="select" id="record-filter" value={wordFilter} onChange={resetFilter}>
                {Object.entries(wordLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <button className="btn btn-secondary" type="button" disabled={!canCompare} onClick={compare}>
              So sánh 2 lượt đã chọn
            </button>
          </div>

          <div className={styles.list}>
            {records.map(record => {
              const checked = selectedIds.includes(record.id);
              return (
                <article className={`${styles.record} ${checked ? styles.selected : ''}`} key={record.id}>
                  <label className="choice">
                    <input type="checkbox" checked={checked} onChange={() => toggleSelection(record.id)} />
                    <span className="bubble" aria-hidden="true"></span>
                    <span>Chọn lượt này</span>
                  </label>
                  <div className={styles.recordMain}>
                    <div className={styles.recordTitle}>
                      <h3 className="word" lang="en">{record.word}</h3>
                      <span className={`stamp ${record.score >= 80 ? 'stamp-success' : 'stamp-warning'}`}>{record.score}/100</span>
                    </div>
                    <div className={styles.recordMeta}>
                      <span>{record.date}</span><span>{record.duration}</span><span>{record.clarity}</span><span>{record.rhythm}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className="btn btn-media btn-sm" type="button" onClick={() => speak(record.word)}><Icon name="volume" />Nghe mẫu</button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => toggleSelection(record.id)}>{checked ? 'Bỏ chọn' : 'Chọn'}</button>
                  </div>
                </article>
              );
            })}
          </div>

          {comparison && (
            <section className={styles.comparison} aria-labelledby="comparison-title">
              <div className={styles.sectionHeader}>
                <div><h2 id="comparison-title">So sánh hai lượt</h2><p className="small muted">Chỉ số mô phỏng từ hai bản ghi đã chọn.</p></div>
                <button className="btn btn-quiet btn-sm" type="button" onClick={() => setComparison(null)}><Icon name="x" />Đóng</button>
              </div>
              <div className={styles.compareGrid}>
                {comparison.map(record => (
                  <div className={styles.compareCard} key={record.id}>
                    <div className={styles.recordTitle}><h3 className="word" lang="en">{record.word}</h3><span className="small muted">{record.date}</span></div>
                    <strong className={styles.compareScore}>{record.score}<small>/100</small></strong>
                    <p><span>Độ rõ</span><strong>{record.clarity}</strong></p>
                    <p><span>Nhịp điệu</span><strong>{record.rhythm}</strong></p>
                  </div>
                ))}
              </div>
              <div className="notice notice-info"><Icon name="info" /><span>{comparison[1].score >= comparison[0].score ? 'Lượt gần đây có điểm tốt hơn. Hãy tiếp tục giữ cách luyện hiện tại.' : 'Lượt gần đây giảm điểm. Bạn nên nghe mẫu và ghi lại ở tốc độ chậm hơn.'}</span></div>
            </section>
          )}
        </section>
      </article>
    </div>
  );
}
