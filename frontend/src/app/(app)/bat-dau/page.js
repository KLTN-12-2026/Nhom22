'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [topics, setTopics] = useState([]);
  const [mins, setMins] = useState('10');
  const [cards, setCards] = useState('10');

  useEffect(() => {
    document.body.classList.add('no-bottom-nav');
    return () => document.body.classList.remove('no-bottom-nav');
  }, []);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else router.push('/bo-the');
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleTopic = (id) => {
    if (topics.includes(id)) {
      setTopics(topics.filter(t => t !== id));
    } else {
      if (topics.length < 5) setTopics([...topics, id]);
    }
  };

  return (
    <>
      <header className={styles.onbHeader}>
        <div className={styles.onbHeaderInner}>
          <Link className="brand" href="/bo-the">
            <img className="brand-mark" src="/shared/assets/logo-mark.svg" alt="" width="28" height="28" />
            <span>Vocab<span className="brand-accent">Learning</span></span>
          </Link>
          <button type="button" className="btn btn-quiet" onClick={() => router.push('/dang-nhap?loggedOut=1')}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main id="main" className={styles.onb}>
        <section className={`sheet ${styles.onbSheet}`} aria-labelledby="onb-title">
          <div className="form-head">
            <div className="form-code">
              <span>Phiếu khởi đầu</span>
              <span id="step-code">Bước {step}/5</span>
            </div>
            <h1 id="onb-title">Thiết lập việc học của bạn</h1>
            <p>Mất khoảng một phút. Bạn có thể đổi mọi lựa chọn sau trong phần Thiết lập học.</p>
          </div>

          <ol className="steps" aria-label="Các bước" id="steps">
            {['Mục tiêu', 'Trình độ', 'Chủ đề', 'Thời gian', 'Bộ khởi động'].map((lbl, i) => (
              <li key={i} data-state={step === i + 1 ? 'current' : step > i + 1 ? 'done' : undefined}>
                <span className="bubble">{i + 1}</span>
                <span className="step-bar"></span>
                <span className="step-label">{lbl}</span>
              </li>
            ))}
          </ol>

          <form id="form" noValidate style={{ marginTop: 'var(--sp-6)' }} onSubmit={(e) => e.preventDefault()}>
            <fieldset className={`fieldset field ${styles.onbStep}`} data-step="1" data-field="goal" hidden={step !== 1}>
              <legend><h2 tabIndex="-1">Bạn học tiếng Anh để làm gì?</h2></legend>
              <div className="choice-grid cols-2">
                <label className="choice choice-card">
                  <input type="radio" name="goal" value="GIAO_TIEP" checked={goal === 'GIAO_TIEP'} onChange={() => setGoal('GIAO_TIEP')} />
                  <span className="bubble" aria-hidden="true">A</span>
                  <span className="choice-body">
                    <span className="choice-title">Giao tiếp</span>
                    <span className="choice-desc">Nói chuyện hằng ngày, công sở, du lịch. Ưu tiên cụm từ dùng được ngay.</span>
                  </span>
                </label>
                <label className="choice choice-card">
                  <input type="radio" name="goal" value="TOEIC" checked={goal === 'TOEIC'} onChange={() => setGoal('TOEIC')} />
                  <span className="bubble" aria-hidden="true">B</span>
                  <span className="choice-body">
                    <span className="choice-title">Thi TOEIC</span>
                    <span className="choice-desc">Từ vựng Part 5–7: email, hóa đơn, thông báo, hợp đồng.</span>
                  </span>
                </label>
              </div>
              <p className="field-error"></p>
            </fieldset>

            <fieldset className={`fieldset field ${styles.onbStep}`} data-step="2" data-field="level" hidden={step !== 2}>
              <legend><h2 tabIndex="-1">Bạn tự thấy mình đang ở mức nào?</h2></legend>
              <p className="muted">Đây là bạn tự đánh giá, không phải kết quả kiểm tra. Hệ thống dùng nó để gợi ý bộ thẻ phù hợp.</p>
              <div className="choice-grid">
                {[
                  { v: 'MOI_BAT_DAU', c: 'A', t: 'Mới bắt đầu', d: 'Biết chào hỏi, đọc được câu rất ngắn.' },
                  { v: 'CO_BAN', c: 'B', t: 'Cơ bản', d: 'Hiểu đoạn hội thoại đơn giản, còn thiếu nhiều từ.' },
                  { v: 'TRUNG_CAP', c: 'C', t: 'Trung cấp', d: 'Đọc email công việc, cần từ chuyên đề để lên điểm.' },
                  { v: 'NANG_CAO', c: 'D', t: 'Nâng cao', d: 'Đọc tốt, muốn dùng từ chính xác và tự nhiên hơn.' }
                ].map(lv => (
                  <label key={lv.v} className="choice choice-card">
                    <input type="radio" name="level" value={lv.v} checked={level === lv.v} onChange={() => setLevel(lv.v)} />
                    <span className="bubble" aria-hidden="true">{lv.c}</span>
                    <span className="choice-body">
                      <span className="choice-title">{lv.t}</span>
                      <span className="choice-desc">{lv.d}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="field-error"></p>
            </fieldset>

            <fieldset className={`fieldset field ${styles.onbStep}`} data-step="3" data-field="topicIds" hidden={step !== 3}>
              <legend><h2 tabIndex="-1">Chọn chủ đề bạn quan tâm</h2></legend>
              <p className="muted">Chọn tối đa 5. Có thể bỏ trống.</p>
              <div className="choice-grid cols-2" id="topics" aria-live="polite">
                {['Kinh doanh', 'Đời sống', 'Du lịch', 'Công nghệ', 'Tài chính', 'Sức khoẻ'].map(t => (
                  <label key={t} className="choice choice-card">
                    <input type="checkbox" checked={topics.includes(t)} onChange={() => toggleTopic(t)} />
                    <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
                    <span className="choice-body"><span className="choice-title">{t}</span></span>
                  </label>
                ))}
              </div>
              <p className="field-error"></p>
            </fieldset>

            <div className={styles.onbStep} data-step="4" hidden={step !== 4}>
              <h2 tabIndex="-1">Mỗi ngày bạn học bao lâu?</h2>

              <fieldset className="fieldset field" data-field="minutesPerDay">
                <legend>Thời gian học mỗi ngày</legend>
                <div className={styles.minutes}>
                  {['5', '10', '15', '20', '30'].map(m => (
                    <label key={m} className="choice">
                      <input type="radio" name="minutesPerDay" value={m} checked={mins === m} onChange={() => setMins(m)} />
                      <span className="bubble" aria-hidden="true"></span>
                      <span>{m} phút</span>
                    </label>
                  ))}
                </div>
                <p className="field-error"></p>
              </fieldset>

              <fieldset className="fieldset field" data-field="newCardsPerDay">
                <legend>Số từ mới mỗi ngày</legend>
                <div className={styles.minutes}>
                  {['5', '10', '15', '20'].map(c => (
                    <label key={c} className="choice">
                      <input type="radio" name="newCardsPerDay" value={c} checked={cards === c} onChange={() => setCards(c)} />
                      <span className="bubble" aria-hidden="true"></span>
                      <span>{c} từ</span>
                    </label>
                  ))}
                </div>
                <p className="field-hint">Từ đến hạn ôn vẫn được đưa vào phiên học, không bị giới hạn bởi con số này.</p>
                <p className="field-error"></p>
              </fieldset>

              <div className="choice-grid cols-2">
                <div className="field">
                  <label className="field-label" htmlFor="reminderTime"><span>Giờ nhắc học</span><span className="optional">Không bắt buộc</span></label>
                  <input className="input" type="time" id="reminderTime" name="reminderTime" defaultValue="20:30" />
                  <p className="field-error"></p>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="muiGio">Múi giờ</label>
                  <select className="select" id="muiGio" name="muiGio" defaultValue="Asia/Ho_Chi_Minh">
                    <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                    <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                    <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                    <option value="Europe/Berlin">Berlin (GMT+1)</option>
                    <option value="America/New_York">New York (GMT−5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.onbStep} data-step="5" hidden={step !== 5}>
              <h2 tabIndex="-1">Chọn bộ thẻ để bắt đầu</h2>
              <p className="muted">Gợi ý theo mục tiêu và chủ đề bạn vừa chọn. Bản sao là của riêng bạn, sửa thoải mái. Bạn có thể bỏ qua bước này.</p>
              <div className={styles.starter}>
                <div className={styles.starterItem}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '4px' }}>3000 Từ Vựng Giao Tiếp</h3>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--ink-2)' }}>
                      <span>Bộ mẫu</span> • <span>Giao tiếp</span> • <span>Cơ bản</span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => alert('Đã chép vào bộ của bạn')}>
                    <Icon name="copy" /> Sao chép
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <aside className={`panel ${styles.summary}`} aria-labelledby="sum-title">
          <h2 className="panel-title" id="sum-title">Phiếu của bạn</h2>
          <ul className={styles.sumList}>
            <li>
              <span className={styles.sumK}>Mục tiêu</span>
              <span className={`${styles.sumV} ${!goal ? styles.isEmpty : ''}`}>{goal === 'GIAO_TIEP' ? 'Giao tiếp' : goal === 'TOEIC' ? 'Thi TOEIC' : 'Chưa chọn'}</span>
            </li>
            <li>
              <span className={styles.sumK}>Trình độ</span>
              <span className={`${styles.sumV} ${!level ? styles.isEmpty : ''}`}>{level === 'MOI_BAT_DAU' ? 'Mới bắt đầu' : level === 'CO_BAN' ? 'Cơ bản' : level === 'TRUNG_CAP' ? 'Trung cấp' : level === 'NANG_CAO' ? 'Nâng cao' : 'Chưa chọn'}</span>
            </li>
            <li>
              <span className={styles.sumK}>Chủ đề</span>
              <span className={`${styles.sumV} ${topics.length === 0 ? styles.isEmpty : ''}`}>{topics.length > 0 ? topics.join(', ') : 'Chưa chọn'}</span>
            </li>
          </ul>
        </aside>

        <div className={styles.onbActions}>
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={step === 1}>Quay lại</button>
          <button type="button" className="btn btn-primary" onClick={handleNext}>{step === 5 ? 'Hoàn tất' : 'Tiếp tục'}</button>
        </div>
      </main>
    </>
  );
}
