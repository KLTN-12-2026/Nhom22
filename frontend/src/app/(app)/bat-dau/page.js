'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon } from '@/components/ui';
import styles from './page.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [topics, setTopics] = useState([]);
  const [mins, setMins] = useState('10');
  const [cards, setCards] = useState('10');

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
    <div className={styles.onb}>
      <section className={`sheet ${styles.onbSheet}`} style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Phiếu khởi đầu</span>
            <span>Bước {step}/5</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Thiết lập việc học của bạn</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Mất khoảng một phút. Bạn có thể đổi mọi lựa chọn sau trong phần Thiết lập học.</p>
        </div>

        <ul className={styles.steps} style={{ marginBottom: 'var(--space-6)' }}>
          {['Mục tiêu', 'Trình độ', 'Chủ đề', 'Thời gian', 'Bộ gợi ý'].map((lbl, i) => (
            <li key={i} data-state={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''}>
              <span className={styles.stepBar}></span>
              <span className={styles.stepLabel}>{lbl}</span>
            </li>
          ))}
        </ul>

        {step === 1 && (
          <div className={styles.onbStep}>
            <h2>Bạn học tiếng Anh để làm gì?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: goal === 'GIAO_TIEP' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="goal" value="GIAO_TIEP" checked={goal === 'GIAO_TIEP'} onChange={() => setGoal('GIAO_TIEP')} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>Giao tiếp</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: '4px' }}>Nói chuyện hằng ngày, công sở, du lịch. Ưu tiên cụm từ dùng được ngay.</div>
                </div>
              </label>
              <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: goal === 'TOEIC' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="goal" value="TOEIC" checked={goal === 'TOEIC'} onChange={() => setGoal('TOEIC')} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>Thi TOEIC</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: '4px' }}>Từ vựng Part 5–7: email, hóa đơn, thông báo, hợp đồng.</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.onbStep}>
            <h2>Bạn tự thấy mình đang ở mức nào?</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Đây là bạn tự đánh giá, không phải kết quả kiểm tra. Hệ thống dùng nó để gợi ý bộ thẻ phù hợp.</p>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {[
                { v: 'MOI_BAT_DAU', t: 'Mới bắt đầu', d: 'Biết chào hỏi, đọc được câu rất ngắn.' },
                { v: 'CO_BAN', t: 'Cơ bản', d: 'Hiểu đoạn hội thoại đơn giản, còn thiếu nhiều từ.' },
                { v: 'TRUNG_CAP', t: 'Trung cấp', d: 'Đọc email công việc, cần từ chuyên đề để lên điểm.' },
                { v: 'NANG_CAO', t: 'Nâng cao', d: 'Đọc tốt, muốn dùng từ chính xác và tự nhiên hơn.' }
              ].map(lv => (
                <label key={lv.v} style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: level === lv.v ? 'var(--color-primary-tint)' : 'transparent' }}>
                  <input type="radio" name="level" value={lv.v} checked={level === lv.v} onChange={() => setLevel(lv.v)} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{lv.t}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{lv.d}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.onbStep}>
            <h2>Chọn chủ đề bạn quan tâm</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Chọn tối đa 5. Có thể bỏ trống.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {['Kinh doanh', 'Đời sống', 'Du lịch', 'Công nghệ', 'Tài chính'].map(t => (
                <label key={t} style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: topics.includes(t) ? 'var(--color-primary-tint)' : 'transparent' }}>
                  <input type="checkbox" checked={topics.includes(t)} onChange={() => toggleTopic(t)} />
                  <span style={{ fontWeight: 'bold' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.onbStep}>
            <h2>Mỗi ngày bạn học bao lâu?</h2>
            
            <div style={{ marginTop: 'var(--space-4)' }}>
              <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Thời gian học mỗi ngày</strong>
              <div className={styles.minutes}>
                {['5', '10', '15', '20', '30'].map(m => (
                  <label key={m}><input type="radio" name="mins" value={m} checked={mins === m} onChange={() => setMins(m)} /> <span>{m} phút</span></label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Số từ mới mỗi ngày</strong>
              <div className={styles.minutes}>
                {['5', '10', '15', '20'].map(c => (
                  <label key={c}><input type="radio" name="cards" value={c} checked={cards === c} onChange={() => setCards(c)} /> <span>{c} từ</span></label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className={styles.onbStep}>
            <h2>Chọn bộ thẻ để bắt đầu</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Gợi ý theo mục tiêu và chủ đề bạn vừa chọn. Bản sao là của riêng bạn, sửa thoải mái.</p>
            <div className={styles.starter}>
              <div className={styles.starterItem}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '4px' }}>3000 Từ Vựng Giao Tiếp</h3>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--color-ink-2)' }}>
                    <span>Bộ mẫu</span> • <span>Giao tiếp</span> • <span>Cơ bản</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm"><Icon name="copy" /> Sao chép</Button>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className={styles.summary} style={{ backgroundColor: 'var(--color-desk)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
        <p style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Phiếu của bạn</p>
        <ul className={styles.sumList}>
          <li>
            <div>
              <p className={styles.sumK}>Mục tiêu</p>
              <p className={`${styles.sumV} ${!goal ? styles.isEmpty : ''}`}>{goal === 'GIAO_TIEP' ? 'Giao tiếp' : goal === 'TOEIC' ? 'Thi TOEIC' : 'Chưa chọn'}</p>
            </div>
          </li>
          <li>
            <div>
              <p className={styles.sumK}>Trình độ</p>
              <p className={`${styles.sumV} ${!level ? styles.isEmpty : ''}`}>{level || 'Chưa chọn'}</p>
            </div>
          </li>
          <li>
            <div>
              <p className={styles.sumK}>Chủ đề</p>
              <p className={`${styles.sumV} ${topics.length === 0 ? styles.isEmpty : ''}`}>{topics.length > 0 ? topics.join(', ') : 'Chưa chọn'}</p>
            </div>
          </li>
        </ul>
      </aside>

      <div className={styles.onbActions}>
        <Button variant="secondary" onClick={handleBack} disabled={step === 1}>Quay lại</Button>
        <Button variant="primary" onClick={handleNext}>{step === 5 ? 'Hoàn tất' : 'Tiếp tục'}</Button>
      </div>
    </div>
  );
}
