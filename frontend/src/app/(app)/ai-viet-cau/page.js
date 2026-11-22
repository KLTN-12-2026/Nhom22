'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAiRequest } from '@/hooks/useAiRequest';
import { AI_STATUS } from '@/lib/remote-contract.mjs';
import { Icon } from '@/components/ui';
import { GuardedAction, QuotaMeter } from '@/components/billing/PlanAccess';
import styles from './page.module.css';

export default function AiSentencePage() {
  const [word, setWord] = useState('');
  const [sentence, setSentence] = useState('');
  const request = useAiRequest();
  const isChecking = request.busy;
  const result = request.data?.trangThai === 'HOAN_TAT' ? request.data.ketQua : null;
  const feedback = result ? { corrected: result.cauSua, explanation: result.nhanXet, note: result.cachDungTu } : null;
  const handleSubmit = event => { event.preventDefault(); request.start('/api/v1/ai/sentence-feedback', { tu: word.trim(), cau: sentence.trim() }); };
  const speak = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(feedback?.corrected || sentence));
    }
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Phản hồi từ dịch vụ AI</span>
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
            <span>AI</span>
          </div>
          <h1 id="page-title">Viết câu dùng thử</h1>
          <p>Dùng từ mới trong một câu của chính bạn.</p>
        </div>
        <QuotaMeter feature="AI" />

        {request.error && <p role="alert" className="notice">{request.error}{request.id && <button type="button" className="btn btn-quiet" onClick={() => request.refetch()}>Kiểm tra lại</button>}</p>}
        {request.data && <p role="status">{AI_STATUS[request.data.trangThai]}{request.data.moPhong ? ' · Nhà cung cấp mô phỏng' : ''}</p>}
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
                maxLength={500}
                rows={6}
                required
              />
            </div>

            <GuardedAction feature="AI" className="btn btn-primary" type="submit" disabled={isChecking}>
              {isChecking ? 'Đang nhận phản hồi…' : 'Nhận phản hồi'}
            </GuardedAction>
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
                  <span className="caption">Phản hồi</span>
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
