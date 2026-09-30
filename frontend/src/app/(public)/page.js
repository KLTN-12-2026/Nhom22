'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import styles from './page.module.css';

const QUIZ = [
  { dir: "Anh → Việt", prompt: "receipt", sub: "/rɪˈsiːt/  n.", en: true, options: ["lời mời", "biên lai, giấy biên nhận", "công thức nấu ăn", "người nhận"], answer: 1, note: "receipt là biên lai; recipe mới là công thức nấu ăn." },
  { dir: "Việt → Anh", prompt: "hoãn lại", sub: "động từ", en: false, options: ["postpone", "prepare", "propose", "purchase"], answer: 0, note: "The meeting has been postponed until Friday." },
  { dir: "Anh → Việt", prompt: "complimentary", sub: "/ˌkɑːmplɪˈmentri/  adj.", en: true, options: ["bổ sung cho nhau", "miễn phí, tặng kèm", "phức tạp", "khen ngợi quá mức"], answer: 1, note: "Dễ nhầm với complementary (bổ sung cho nhau)." }
];

export default function HomePage() {
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizState, setQuizState] = useState(null); // null, { selected: number, isCorrect: boolean }

  const q = QUIZ[quizIdx];

  const handleQuizSelect = (idx) => {
    if (quizState) return;
    setQuizState({
      selected: idx,
      isCorrect: idx === q.answer
    });
  };

  const nextQuiz = () => {
    setQuizIdx((prev) => (prev + 1) % QUIZ.length);
    setQuizState(null);
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={`sheet ${styles.heroSheet}`}>
            <div className={styles.sheetTop}>
              <strong>Phiếu học từ vựng tiếng Anh</strong>
              <span>Mẫu dành cho người học Giao tiếp và TOEIC</span>
            </div>
            
            <div className={styles.heroGrid}>
              <div>
                <h1 className={styles.hero}>Học từ vựng tiếng Anh, ôn đúng lúc sắp quên.</h1>
                <p className={styles.lead}>Chọn bộ Giao tiếp hoặc TOEIC, học vài phút mỗi ngày. Mỗi từ có hai lịch ôn riêng: Anh → Việt và Việt → Anh, để bạn vừa hiểu nghĩa vừa nhớ được cách dùng.</p>
                
                <form className={styles.fillGrid}>
                  <div className={styles.fillRow}>
                    <span>Mục tiêu</span>
                    <fieldset>
                      <legend>Mục tiêu</legend>
                      <label className="choice"><input type="radio" name="goal" value="GIAO_TIEP" /> <span>Giao tiếp</span></label>
                      <label className="choice"><input type="radio" name="goal" value="TOEIC" defaultChecked /> <span>TOEIC</span></label>
                    </fieldset>
                  </div>
                  <div className={styles.fillRow}>
                    <span>Mỗi ngày</span>
                    <fieldset>
                      <legend>Thời gian</legend>
                      <label className="choice"><input type="radio" name="minutes" value="5" /> <span>5 phút</span></label>
                      <label className="choice"><input type="radio" name="minutes" value="10" defaultChecked /> <span>10 phút</span></label>
                      <label className="choice"><input type="radio" name="minutes" value="20" /> <span>20 phút</span></label>
                    </fieldset>
                  </div>
                </form>
                
                <div className={styles.ctaRow}>
                  <Link href="/dang-ky"><Button variant="primary" size="lg">Bắt đầu học miễn phí</Button></Link>
                  <Link href="/thu-vien"><Button variant="secondary" size="lg">Xem thư viện</Button></Link>
                </div>
              </div>

              <section className={styles.quiz}>
                <div className={styles.quizHead}>
                  <span>Thử một câu</span>
                  <span>Câu {quizIdx + 1} ({q.dir})</span>
                </div>
                <div className={styles.quizBody}>
                  <p className={`${styles.quizPrompt} ${!q.en ? styles.quizPromptVi : ''}`}>{q.prompt}</p>
                  <p className={styles.quizSub}>{q.sub}</p>
                  <ul className={styles.quizOptions}>
                    {q.options.map((opt, i) => {
                      let bgColor = 'transparent';
                      let textColor = 'var(--color-ink)';
                      if (quizState) {
                        if (i === q.answer) bgColor = 'var(--color-success-bg)';
                        if (i === quizState.selected && !quizState.isCorrect) bgColor = 'var(--color-error-100)';
                      }
                      return (
                        <li key={i}>
                          <button 
                            onClick={() => handleQuizSelect(i)} 
                            disabled={quizState !== null}
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{['A','B','C','D'][i]}</span> 
                            {opt}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className={styles.quizFoot}>
                  <p className={styles.verdict} style={{ color: quizState ? (quizState.isCorrect ? 'var(--color-success-text)' : 'var(--color-danger)') : 'inherit' }}>
                    {quizState ? (quizState.isCorrect ? `Đúng. ${q.note}` : `Chưa đúng, đáp án là ${['A','B','C','D'][q.answer]}. ${q.note}`) : 'Chọn một đáp án.'}
                  </p>
                  {quizState && <Button variant="secondary" onClick={nextQuiz}>{quizIdx < QUIZ.length - 1 ? "Câu tiếp" : "Làm lại"}</Button>}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--color-sheet)' }}>
        <div className={styles.wrap}>
          <h2>Một vòng học khép kín</h2>
          <p className={styles.intro}>Mỗi bước dùng kết quả của bước trước. Lịch ôn, chấm bài và điểm do máy chủ tính theo quy tắc cố định, bạn xem được lý do.</p>
          <ol className={styles.loop}>
            <li><span className={styles.no}>1</span><h3>Chọn hoặc tạo bộ thẻ</h3><p>Sao chép bộ mẫu Giao tiếp, TOEIC, hoặc tự tạo và nhập từ tệp CSV.</p></li>
            <li><span className={styles.no}>2</span><h3>Học từ mới</h3><p>Lật thẻ, nghe phát âm, xem ví dụ. Số từ mới mỗi ngày do bạn đặt.</p></li>
            <li><span className={styles.no}>3</span><h3>Ôn đúng lúc</h3><p>Tự đánh giá Quên, Khó, Nhớ, Dễ. Từ hay quên quay lại sớm, từ đã chắc giãn dần.</p></li>
            <li><span className={styles.no}>4</span><h3>Luyện kỹ năng</h3><p>Chọn nghĩa, nghe viết, điền chỗ trống, phân biệt từ dễ nhầm.</p></li>
            <li><span className={styles.no}>5</span><h3>Xem tiến độ</h3><p>Thống kê từ dữ liệu thật; chưa đủ dữ liệu thì hiện là chưa đủ, không đoán.</p></li>
          </ol>
        </div>
      </section>
    </>
  );
}
