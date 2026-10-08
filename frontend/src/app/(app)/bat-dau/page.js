'use client';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorState, Icon } from '@/components/ui';
import { useTopics } from '@/hooks/useTopics';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';
import { apiFetch } from '@/lib/api-client';
import styles from './page.module.css';

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { data: topicList = [], error: topicsError, refetch: reloadTopics } = useTopics();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [topics, setTopics] = useState([]);
  const [muiGio, setMuiGio] = useState('Asia/Ho_Chi_Minh');
  const [gioNhac, setGioNhac] = useState('20:30');
  const [mins, setMins] = useState('10');
  const [cards, setCards] = useState('10');
  const [savedSettings, setSavedSettings] = useState(null);
  const starters = useLibraryDecks({ nguon: 'MAU', mucTieu: savedSettings?.mucTieu, trinhDo: savedSettings?.trinhDo, size: 4 }, { enabled: step === 5 && !!savedSettings });

  useEffect(() => {
    document.body.classList.add('no-bottom-nav');
    return () => document.body.classList.remove('no-bottom-nav');
  }, []);

  const handleNext = async () => {
    if ((step === 1 && !goal) || (step === 2 && !level)) { setErrorMsg('Chọn một mục để tiếp tục.'); return; }
    setErrorMsg('');
    if (step < 4) { setStep(step + 1); return; }
    if (step === 5) { router.push('/bo-the'); return; }
    setSaving(true);
    try {
      const current = await apiFetch('/api/v1/me/learning-settings');
      const notification = await apiFetch('/api/v1/me/notification-settings');
      await apiFetch('/api/v1/me', { method: 'PATCH', body: JSON.stringify({ muiGio }) });
      await apiFetch('/api/v1/me/notification-settings', { method: 'PUT', body: JSON.stringify({ nhanTrongUngDung: notification.nhanTrongUngDung, nhanEmail: notification.nhanEmail, nhacHoc: !!gioNhac, gioNhac: gioNhac || null, version: notification.version }) });
      const saved = await apiFetch('/api/v1/me/learning-settings', { method: 'PUT', body: JSON.stringify({ mucTieu: goal, trinhDo: level, chuDeIds: topics, phutMoiNgay: Number(mins), tuMoiMoiNgay: Number(cards), version: current.version }) });
      setSavedSettings(saved);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['learning-settings'] });
      setStep(5);
    } catch (error) { setErrorMsg(error.message); }
    finally { setSaving(false); }
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
          <button type="button" className="btn btn-quiet" onClick={() => logout(queryClient).catch(error => alert(error.message))}>
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
                {topicList.map(t => (
                  <label key={t.id} className="choice choice-card">
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={() => toggleTopic(t.id)} />
                    <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
                    <span className="choice-body"><span className="choice-title">{t.ten}</span></span>
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
                  <input className="input" type="time" id="reminderTime" name="reminderTime" value={gioNhac} onChange={e => setGioNhac(e.target.value)} />
                  <p className="field-error"></p>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="muiGio">Múi giờ</label>
                  <select className="select" id="muiGio" name="muiGio" value={muiGio} onChange={e => setMuiGio(e.target.value)}>
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
              <h2>Đã lưu phiếu của bạn</h2>
              <p>Xem bộ mẫu phù hợp với mục tiêu và trình độ đã lưu.</p>
              {starters.isLoading && <p role="status">Đang tìm bộ mẫu…</p>}
              {starters.error && <ErrorState description={starters.error.message} onRetry={starters.refetch} />}
              {starters.data?.items.length === 0 && <p>Chưa có bộ mẫu phù hợp. Bạn có thể xem toàn bộ thư viện hoặc tạo bộ đầu tiên.</p>}
              <ul>{starters.data?.items.map(deck => <li key={deck.id}><Link href={`/thu-vien/${deck.id}`}>{deck.ten}</Link> — {deck.soThe} thẻ</li>)}</ul>
              <Link href="/thu-vien" className="btn btn-secondary">Xem thư viện</Link>
            </div>
            {topicsError && <ErrorState description={topicsError.message} onRetry={reloadTopics} />}
            {errorMsg && <p className="notice notice-error" role="alert">{errorMsg}</p>}

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
              <span className={`${styles.sumV} ${topics.length === 0 ? styles.isEmpty : ''}`}>{topics.length > 0 ? topics.map(id => topicList.find(t => t.id === id)?.ten || id).join(', ') : 'Chưa chọn'}</span>
            </li>
          </ul>
        </aside>

        <div className={styles.onbActions}>
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={step === 1 || saving}>Quay lại</button>
          <button type="button" className="btn btn-primary" onClick={handleNext} disabled={saving}>{saving ? 'Đang lưu...' : step === 5 ? 'Hoàn tất' : step === 4 ? 'Lưu thiết lập' : 'Tiếp tục'}</button>
        </div>
      </main>
    </>
  );
}
