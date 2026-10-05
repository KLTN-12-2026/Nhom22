'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import styles from './page.module.css';
import { Icon } from '@/components/ui';

export default function LearningSettingsPage() {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { data: settings } = useQuery({
    queryKey: ['learning-settings'],
    queryFn: () => apiFetch('/api/v1/me/learning-settings')
  });

  const { data: topics } = useQuery({
    queryKey: ['public-topics'],
    queryFn: () => apiFetch('/api/v1/public/topics').catch(() => [])
  });

  const [formState, setFormState] = useState({
    goal: 'TOEIC',
    level: 'CO_BAN',
    topicIds: [],
    minutesPerDay: 10,
    newCardsPerDay: 10,
    version: null
  });

  useEffect(() => {
    if (settings) {
      setFormState({
        goal: settings.goal || 'TOEIC',
        level: settings.level || 'CO_BAN',
        topicIds: settings.topicIds || [],
        minutesPerDay: settings.minutesPerDay || 10,
        newCardsPerDay: settings.newCardsPerDay || 10,
        version: settings.version || null
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/me/learning-settings', { method: 'PUT', body: JSON.stringify({...body, onboardingDone: true}) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['learning-settings']);
      if (data && data.version) {
        setFormState(prev => ({ ...prev, version: data.version }));
      }
      setSuccessMsg(`Lưu lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formState);
  };

  const handleTopicChange = (e, topicId) => {
    const checked = e.target.checked;
    let newTopicIds = [...formState.topicIds];
    
    if (checked) {
      if (newTopicIds.length >= 5) {
        e.preventDefault();
        setErrorMsg('Chọn tối đa 5 chủ đề');
        return;
      }
      newTopicIds.push(topicId);
    } else {
      newTopicIds = newTopicIds.filter(id => id !== topicId);
    }
    
    setFormState({...formState, topicIds: newTopicIds});
    setErrorMsg('');
  };

  const m = Number(formState.minutesPerDay);
  const n = Number(formState.newCardsPerDay);
  const estimateWarning = m && n > m ? "Số từ mới đang nhiều hơn số phút mỗi ngày. Bạn có thể không kịp ôn." : "";

  return (
    <>
      <div className="form-head">
        <div className="form-code"><span>Tài khoản</span><span>Thiết lập học</span></div>
        <h1 id="page-title">Thiết lập học</h1>
        <p>Kế hoạch mỗi ngày dùng các con số dưới đây. Thay đổi có hiệu lực từ phiên học tiếp theo.</p>
      </div>

      <form id="form" className="settings-form" noValidate onSubmit={handleSubmit}>
        <div data-form-error hidden={!errorMsg}>{errorMsg}</div>
        
        <fieldset className="fieldset field" data-field="goal">
          <legend>Mục tiêu</legend>
          <div className="choice-grid cols-2">
            <label className="choice choice-card">
              <input type="radio" name="goal" value="GIAO_TIEP" checked={formState.goal === 'GIAO_TIEP'} onChange={() => setFormState({...formState, goal: 'GIAO_TIEP'})} />
              <span className="bubble" aria-hidden="true">A</span>
              <span className="choice-body">
                <span className="choice-title">Giao tiếp</span>
                <span className="choice-desc">Hằng ngày, công sở, du lịch</span>
              </span>
            </label>
            <label className="choice choice-card">
              <input type="radio" name="goal" value="TOEIC" checked={formState.goal === 'TOEIC'} onChange={() => setFormState({...formState, goal: 'TOEIC'})} />
              <span className="bubble" aria-hidden="true">B</span>
              <span className="choice-body">
                <span className="choice-title">Thi TOEIC</span>
                <span className="choice-desc">Part 5–7, email và văn bản công việc</span>
              </span>
            </label>
          </div>
          <p className="field-error"></p>
        </fieldset>

        <fieldset className="fieldset field" data-field="level">
          <legend>Trình độ tự đánh giá</legend>
          <div className="choice-grid cols-2">
            <label className="choice">
              <input type="radio" name="level" value="MOI_BAT_DAU" checked={formState.level === 'MOI_BAT_DAU'} onChange={() => setFormState({...formState, level: 'MOI_BAT_DAU'})} />
              <span className="bubble" aria-hidden="true">A</span>
              <span className="choice-body"><span className="choice-title">Mới bắt đầu</span></span>
            </label>
            <label className="choice">
              <input type="radio" name="level" value="CO_BAN" checked={formState.level === 'CO_BAN'} onChange={() => setFormState({...formState, level: 'CO_BAN'})} />
              <span className="bubble" aria-hidden="true">B</span>
              <span className="choice-body"><span className="choice-title">Cơ bản</span></span>
            </label>
            <label className="choice">
              <input type="radio" name="level" value="TRUNG_CAP" checked={formState.level === 'TRUNG_CAP'} onChange={() => setFormState({...formState, level: 'TRUNG_CAP'})} />
              <span className="bubble" aria-hidden="true">C</span>
              <span className="choice-body"><span className="choice-title">Trung cấp</span></span>
            </label>
            <label className="choice">
              <input type="radio" name="level" value="NANG_CAO" checked={formState.level === 'NANG_CAO'} onChange={() => setFormState({...formState, level: 'NANG_CAO'})} />
              <span className="bubble" aria-hidden="true">D</span>
              <span className="choice-body"><span className="choice-title">Nâng cao</span></span>
            </label>
          </div>
          <p className="field-hint">Chỉ dùng để gợi ý bộ thẻ, không phải kết quả kiểm tra.</p>
          <p className="field-error"></p>
        </fieldset>

        <fieldset className="fieldset field" data-field="topicIds">
          <legend>Chủ đề quan tâm <span className="muted" style={{ fontWeight: 500 }}>(tối đa 5)</span></legend>
          <div className="choice-grid cols-2" id="topics">
            {topics?.map(t => (
              <label className="choice" key={t.id}>
                <input 
                  type="checkbox" 
                  name="topicIds" 
                  value={t.id}
                  checked={formState.topicIds.includes(t.id)}
                  onChange={(e) => handleTopicChange(e, t.id)}
                />
                <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
                <span>{t.name}</span>
              </label>
            ))}
          </div>
          <p className="field-error"></p>
        </fieldset>

        <div className="field">
          <label className="field-label" htmlFor="minutesPerDay">Thời gian học mỗi ngày (phút)</label>
          <div className={styles.numRow}>
            <input 
              className={`input ${styles.input}`} 
              id="minutesPerDay" 
              name="minutesPerDay" 
              type="number" 
              min="1" max="240" 
              inputMode="numeric" 
              required
              value={formState.minutesPerDay}
              onChange={e => setFormState({...formState, minutesPerDay: e.target.value})}
            />
            <div className={styles.quick} aria-label="Chọn nhanh">
              {['5', '10', '15', '20', '30'].map(v => (
                <button 
                  type="button" 
                  key={v} 
                  aria-pressed={String(formState.minutesPerDay) === v}
                  onClick={() => setFormState({...formState, minutesPerDay: v})}
                >{v}</button>
              ))}
            </div>
          </div>
          <p className="field-hint">Từ 1 đến 240 phút.</p>
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="newCardsPerDay">Số từ mới mỗi ngày</label>
          <div className={styles.numRow}>
            <input 
              className={`input ${styles.input}`} 
              id="newCardsPerDay" 
              name="newCardsPerDay" 
              type="number" 
              min="0" max="100" 
              inputMode="numeric" 
              required
              value={formState.newCardsPerDay}
              onChange={e => setFormState({...formState, newCardsPerDay: e.target.value})}
            />
            <div className={styles.quick} aria-label="Chọn nhanh">
              {['0', '5', '10', '20'].map(v => (
                <button 
                  type="button" 
                  key={v} 
                  aria-pressed={String(formState.newCardsPerDay) === v}
                  onClick={() => setFormState({...formState, newCardsPerDay: v})}
                >{v}</button>
              ))}
            </div>
          </div>
          <p className="field-hint">Đặt 0 để chỉ ôn từ đã học. Thẻ đến hạn ôn luôn được đưa vào phiên học.</p>
          <p className={styles.estimate} aria-live="polite">{estimateWarning}</p>
          <p className="field-error"></p>
        </div>

        <div className="settings-foot">
          <button type="submit" className="btn btn-primary btn-lg" id="save" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thiết lập'}
          </button>
          <span className="saved-at" id="saved-at" aria-live="polite">{successMsg}</span>
        </div>
      </form>
    </>
  );
}
