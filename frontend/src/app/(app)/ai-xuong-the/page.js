'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const SOURCE_TEXT = 'Please keep the receipt. You can request a refund within seven days. The store will confirm your appointment by email.';

const SAMPLE_CARDS = [
  {
    word: 'receipt',
    meaning: 'biên lai; giấy biên nhận',
    sentence: 'Please keep the receipt.',
    duplicate: false,
    selected: true,
  },
  {
    word: 'refund',
    meaning: 'khoản hoàn tiền; hoàn tiền',
    sentence: 'You can request a refund within seven days.',
    duplicate: false,
    selected: true,
  },
  {
    word: 'appointment',
    meaning: 'cuộc hẹn',
    sentence: 'The store will confirm your appointment by email.',
    duplicate: true,
    selected: false,
  },
];

export default function AiCardWorkshopPage() {
  const [passage, setPassage] = useState(SOURCE_TEXT);
  const [deck, setDeck] = useState('');
  const [draftCount, setDraftCount] = useState('3');
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const selectedCount = cards.filter(card => card.selected).length;

  const generateDraft = (event) => {
    event.preventDefault();
    setIsSaved(false);
    setStatus('');
    setIsGenerating(true);
    window.setTimeout(() => {
      setCards(SAMPLE_CARDS.slice(0, Number(draftCount)).map(card => ({ ...card })));
      setIsGenerating(false);
      setStatus('Đã tạo bản nháp mẫu. Hãy kiểm tra nội dung trước khi lưu.');
    }, 650);
  };

  const toggleCard = (index) => {
    setCards(current => current.map((card, cardIndex) => (
      cardIndex === index ? { ...card, selected: !card.selected } : card
    )));
    setIsSaved(false);
  };

  const updateCard = (index, field, value) => {
    setCards(current => current.map((card, cardIndex) => (
      cardIndex === index ? { ...card, [field]: value } : card
    )));
    setIsSaved(false);
  };

  const saveCards = () => {
    if (!selectedCount) {
      setStatus('Hãy chọn ít nhất một thẻ trước khi lưu.');
      return;
    }
    setIsSaved(true);
    setStatus(`Đã lưu ${selectedCount} thẻ vào ${deck ? 'bộ thẻ đã chọn' : 'bộ thẻ nháp'}.`);
  };

  const speak = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
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
          <span>Xưởng thẻ AI</span>
        </nav>

        <div className="form-head">
          <div className="form-code">
            <span>Học và mở rộng</span>
            <span>UI29 · Đợt 3</span>
          </div>
          <h1 id="page-title">Xưởng thẻ AI</h1>
          <p>Từ một đoạn văn đến thẻ nháp bạn đã kiểm tra.</p>
        </div>

        <p className={styles.status} role="status" aria-live="polite">{status}</p>

        <div className={styles.workspace}>
          <form className={styles.form} onSubmit={generateDraft}>
            <div className="field">
              <label className="field-label" htmlFor="passage">Đoạn văn tiếng Anh</label>
              <textarea
                className="textarea"
                id="passage"
                value={passage}
                onChange={event => setPassage(event.target.value)}
                maxLength={5000}
                required
                rows={7}
              />
              <p className="field-hint">Tối đa 5.000 ký tự trong mẫu giao diện. Bản mẫu tạo tối đa 3 thẻ.</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="deck">Bộ thẻ nhận bản nháp</label>
              <select className="select" id="deck" value={deck} onChange={event => setDeck(event.target.value)}>
                <option value="">Chọn bộ thẻ</option>
                <option value="toeic">TOEIC — công sở</option>
                <option value="daily">Giao tiếp hằng ngày</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="draft-count">Số thẻ mong muốn</label>
              <input
                className="input"
                id="draft-count"
                type="number"
                min="1"
                max="3"
                value={draftCount}
                onChange={event => setDraftCount(event.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={isGenerating}>
              {isGenerating ? 'Đang tạo bản nháp…' : 'Tạo bản nháp'}
            </button>
            <p className="muted small">Nội dung gốc không bị thay đổi. Thẻ chưa được lưu tự động.</p>
            <Link className="btn btn-quiet" href="/ai-lich-su">Lịch sử và hạn mức</Link>
          </form>

          <section className={styles.output} aria-labelledby="output-title" tabIndex="-1">
            {!cards.length ? (
              <div className="empty">
                <h2 id="output-title">Thẻ nháp sẽ nằm ở đây</h2>
                <p>Gửi một đoạn văn để AI đề xuất từ vựng, nghĩa và câu ví dụ.</p>
              </div>
            ) : (
              <>
                <div className={styles.notice}>
                  <Icon name="info" />
                  <span>Bản nháp mẫu cho đoạn văn gợi ý. Chưa phân tích đoạn văn tùy ý; hãy chọn và sửa trước khi lưu.</span>
                </div>
                <div className={styles.drafts}>
                  {cards.map((card, index) => (
                    <article className={`${styles.card} ${card.selected ? styles.selected : ''}`} key={card.word}>
                      <label className="choice">
                        <input type="checkbox" checked={card.selected} onChange={() => toggleCard(index)} />
                        <span className="bubble" aria-hidden="true"></span>
                        <span>Chọn thẻ {index + 1}</span>
                      </label>
                      <div className={styles.cardFields}>
                        <div className="field">
                          <label className="field-label" htmlFor={`word-${index}`}>Từ tiếng Anh</label>
                          <input className="input" id={`word-${index}`} value={card.word} onChange={event => updateCard(index, 'word', event.target.value)} />
                        </div>
                        <div className="field">
                          <label className="field-label" htmlFor={`meaning-${index}`}>Nghĩa tiếng Việt</label>
                          <textarea className="textarea" id={`meaning-${index}`} value={card.meaning} onChange={event => updateCard(index, 'meaning', event.target.value)} rows={2} />
                        </div>
                      </div>
                      <p className={styles.sentence} lang="en">{card.sentence}</p>
                      {card.duplicate && <span className="stamp stamp-warning">Có thể trùng · chưa được chọn</span>}
                      <div className={styles.actions}>
                        <button className="btn btn-edit btn-sm" type="button" onClick={() => document.getElementById(`word-${index}`)?.focus()}><Icon name="edit" />Sửa bản nháp</button>
                        <button className="btn btn-media btn-sm" type="button" onClick={() => speak(card.word)}><Icon name="volume" />Đọc từ</button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className={styles.footer}>
                  <span>{selectedCount} thẻ đang chọn</span>
                  <button className="btn btn-primary" type="button" disabled={!selectedCount || isSaved} onClick={saveCards}>
                    {isSaved ? 'Đã lưu bản nháp' : `Lưu ${selectedCount} thẻ đã chọn`}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
