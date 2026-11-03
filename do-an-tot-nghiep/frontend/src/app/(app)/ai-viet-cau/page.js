'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

export default function AiSentencePage() {
  const [word, setWord] = useState('receipt');
  const [sentence, setSentence] = useState('I have keep the receipt yesterday.');
  const [feedback, setFeedback] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback(null);
    setIsChecking(true);
    window.setTimeout(() => {
      setIsChecking(false);
      setFeedback({
        corrected: 'I kept the receipt yesterday.',
        explanation: 'Dùng thì quá khứ đơn “kept” vì câu có mốc thời gian “yesterday”.',
        note: '“Keep” là động từ bất quy tắc: keep → kept → kept.',
      });
    }, 650);
  };

  const speak = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(feedback?.corrected || sentence));
    }
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/ai-lich-su">Lịch sử AI</Link>
      </div>

      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link>
          <span aria-hidden="true">/</span>
          <span>Viết câu dùng thử</span>
        </nav>

        <div className="form-head">
          <div className="form-code">
            <span>Học và mở rộng</span>
            <span>UI31 · Đợt 3</span>
          </div>
          <h1 id="page-title">Viết câu dùng thử</h1>
          <p>Dùng từ mới trong một câu của chính bạn.</p>
        </div>

        <div className={styles.workspace}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="target-word">Từ muốn vận dụng</label>
              <input
                className="input"
                id="target-word"
                value={word}
                onChange={event => setWord(event.target.value)}
                maxLength={100}
                required
              />
              <p className="field-hint">Chọn một từ mới và thử đặt câu theo ngữ cảnh của bạn.</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="sentence">Câu tiếng Anh của bạn</label>
              <textarea
                className="textarea"
                id="sentence"
                value={sentence}
                onChange={event => setSentence(event.target.value)}
                maxLength={1000}
                rows={6}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={isChecking}>
              {isChecking ? 'Đang nhận phản hồi…' : 'Nhận phản hồi'}
            </button>
            <p className="muted small">Giải thích bằng tiếng Việt. Phản hồi AI là gợi ý để tham khảo, không phải điểm kiểm tra cố định.</p>
          </form>

          <section className={styles.output} aria-live="polite">
            {!feedback ? (
              <div className="empty">
                <h2>Câu sửa và giải thích</h2>
                <p>Phản hồi sẽ xuất hiện sau khi bạn gửi câu muốn kiểm tra.</p>
              </div>
            ) : (
              <>
                <div className={styles.feedbackHeader}>
                  <span className="caption">Phản hồi mẫu</span>
                  <span className="stamp stamp-success">Đã nhận xét</span>
                </div>
                <div className={styles.corrected}>
                  <p className="small muted">Câu gợi ý</p>
                  <p className={styles.quote} lang="en">{feedback.corrected}</p>
                  <button className="btn btn-media btn-sm" type="button" onClick={speak}>
                    <Icon name="volume" /> Đọc câu
                  </button>
                </div>
                <div className={styles.explanation}>
                  <h2>Giải thích</h2>
                  <p>{feedback.explanation}</p>
                  <p className="small muted">{feedback.note}</p>
                </div>
                <div className="notice notice-info">
                  <Icon name="info" />
                  <span>Hãy tự viết lại câu một lần nữa để ghi nhớ cách dùng từ.</span>
                </div>
              </>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
