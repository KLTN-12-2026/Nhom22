'use client';
import { useState } from 'react';
import Link from 'next/link';
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

                <form className={styles.fillGrid} id="plan" aria-label="Điền thử kế hoạch của bạn">
                  <div className={styles.fillRow}>
                    <span>Mục tiêu</span>
                    <fieldset>
                      <legend>Mục tiêu</legend>
                      <label className="choice"><input type="radio" name="goal" value="GIAO_TIEP" /><span className="bubble" aria-hidden="true">A</span><span>Giao tiếp</span></label>
                      <label className="choice"><input type="radio" name="goal" value="TOEIC" defaultChecked /><span className="bubble" aria-hidden="true">B</span><span>TOEIC</span></label>
                    </fieldset>
                  </div>
                  <div className={styles.fillRow}>
                    <span>Mỗi ngày</span>
                    <fieldset>
                      <legend>Thời gian mỗi ngày</legend>
                      <label className="choice"><input type="radio" name="minutes" value="5" /><span className="bubble" aria-hidden="true"></span><span>5 phút</span></label>
                      <label className="choice"><input type="radio" name="minutes" value="10" defaultChecked /><span className="bubble" aria-hidden="true"></span><span>10 phút</span></label>
                      <label className="choice"><input type="radio" name="minutes" value="20" /><span className="bubble" aria-hidden="true"></span><span>20 phút</span></label>
                    </fieldset>
                  </div>
                </form>
                <p className="muted small" id="plan-note" aria-live="polite" style={{ marginTop: 'var(--sp-2)' }}>Tô thử hai ô trên. Bạn có thể lưu kế hoạch trong phần thiết lập học sau khi đăng nhập.</p>

                <div className={styles.ctaRow}>
                  <Link href="/dang-ky" className="btn btn-accent btn-lg">Bắt đầu học miễn phí</Link>
                  <Link href="/thu-vien" className="btn btn-secondary btn-lg">Xem thư viện</Link>
                </div>
              </div>

              <section className={styles.quiz} aria-labelledby="quiz-title" aria-live="polite">
                <div className={styles.quizHead}>
                  <span id="quiz-title">Thử một câu</span>
                  <span id="quiz-code">Câu {quizIdx + 1} ({q.dir})</span>
                </div>
                <div className={styles.quizBody}>
                  <p className={`${styles.quizPrompt} ${!q.en ? styles.quizPromptVi : ''}`}>{q.prompt}</p>
                  <p className={styles.quizSub}>{q.sub}</p>
                  <ul className={styles.quizOptions} role="list">
                    {q.options.map((opt, i) => {
                      let dataResult = undefined;
                      if (quizState) {
                        if (i === q.answer) dataResult = 'correct';
                        else if (i === quizState.selected && !quizState.isCorrect) dataResult = 'wrong';
                        else dataResult = 'answer'; // bg color
                      }
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => handleQuizSelect(i)}
                            disabled={quizState !== null}
                            data-result={dataResult}
                          >
                            <span className="bubble" aria-hidden="true">{['A','B','C','D'][i]}</span>
                            <span className={q.en ? '' : 'en'}>{opt}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className={styles.quizFoot}>
                  <p className={styles.verdict} data-kind={quizState ? (quizState.isCorrect ? 'ok' : 'no') : undefined}>
                    {quizState ? (quizState.isCorrect ? `Đúng. ${q.note}` : `Chưa đúng, đáp án là ${['A','B','C','D'][q.answer]}. ${q.note}`) : 'Chọn một đáp án.'}
                  </p>
                  {quizState && <button type="button" className="btn btn-secondary" onClick={nextQuiz}>{quizIdx < QUIZ.length - 1 ? "Câu tiếp" : "Làm lại"}</button>}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--field)' }}>
        <div className={styles.wrap}>
          <h2>Một vòng học khép kín</h2>
          <p className={styles.intro}>Mỗi bước dùng kết quả của bước trước. Lịch ôn, chấm bài và điểm do máy chủ tính theo quy tắc cố định, bạn xem được lý do.</p>
          <ol className={styles.loop} role="list">
            <li><span className={styles.no}>1</span><h3>Chọn hoặc tạo bộ thẻ</h3><p>Sao chép bộ mẫu Giao tiếp, TOEIC, hoặc tự tạo và nhập từ tệp CSV.</p></li>
            <li><span className={styles.no}>2</span><h3>Học từ mới</h3><p>Lật thẻ, nghe phát âm, xem ví dụ. Số từ mới mỗi ngày do bạn đặt.</p></li>
            <li><span className={styles.no}>3</span><h3>Ôn đúng lúc</h3><p>Tự đánh giá Quên, Khó, Nhớ, Dễ. Từ hay quên quay lại sớm, từ đã chắc giãn dần.</p></li>
            <li><span className={styles.no}>4</span><h3>Luyện kỹ năng</h3><p>Chọn nghĩa, nghe viết, điền chỗ trống, phân biệt từ dễ nhầm.</p></li>
            <li><span className={styles.no}>5</span><h3>Xem tiến độ</h3><p>Thống kê từ dữ liệu thật; chưa đủ dữ liệu thì hiện là chưa đủ, không đoán.</p></li>
          </ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <h2>Mỗi mặt thẻ là một câu hỏi</h2>
          <p className={styles.intro}>Ví dụ với từ <em>recipe</em>, nếu bạn học tốt mặt nghe (Anh → Việt) nhưng lại hay viết sai (Việt → Anh), mặt Việt → Anh sẽ hiển thị thường xuyên hơn để bạn tập trung luyện tập chỗ yếu.</p>
          <div className={styles.schedGrid}>
            <div className={styles.sched}>
              <div className={styles.schedHead}>
                <div className="stack-sm"><span className={styles.word}>recipe</span><span className="muted">Anh → Việt</span></div>
                <span className="badge badge-success">Nhớ chắc</span>
              </div>
              <table>
                <caption>Bạn thường chọn đúng nghĩa ngay lập tức. Câu này sẽ giãn ra 2 tuần mới hỏi lại.</caption>
                <thead><tr><th>Điểm máy chấm</th><th>Lần học trước</th><th>Lần ôn tới</th></tr></thead>
                <tbody><tr><td>100/100</td><td>Hôm qua</td><td className={styles.when}>25/11</td></tr></tbody>
              </table>
            </div>
            <div className={styles.sched}>
              <div className={styles.schedHead}>
                <div className="stack-sm"><span className={styles.word}>công thức (nấu ăn)</span><span className="muted">Việt → Anh</span></div>
                <span className="badge badge-warning">Hay quên</span>
              </div>
              <table>
                <caption>Bạn bị nhầm với receipt hoặc viết sai chính tả. Câu này sẽ hỏi lại vào ngày mai.</caption>
                <thead><tr><th>Điểm máy chấm</th><th>Lần học trước</th><th>Lần ôn tới</th></tr></thead>
                <tbody><tr><td>32/100</td><td>Hôm nay</td><td className={styles.when}>Ngày mai</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.close}`}>
        <div className={styles.wrap}>
          <h2>Bắt đầu từ số 0</h2>
          <p>Tạo tài khoản bằng email của bạn và xác thực qua liên kết trong thư để lưu thiết lập học và quản lý bộ thẻ.</p>
          <div><Link href="/dang-ky" className={`btn btn-lg ${styles.btnOnDark}`}>Tạo tài khoản học thử</Link></div>
        </div>
      </section>
    </>
  );
}
