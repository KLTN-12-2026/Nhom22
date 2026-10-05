'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import styles from './page.module.css';
import { Icon } from '@/components/ui';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me')
  });

  const { data: settings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => apiFetch('/api/v1/me/notification-settings')
  });

  const [formState, setFormState] = useState({
    inApp: false,
    email: false,
    studyReminder: false,
    reminderTime: ''
  });

  useEffect(() => {
    if (settings) {
      setFormState({
        inApp: settings.inApp || false,
        email: settings.email || false,
        studyReminder: settings.studyReminder || false,
        reminderTime: settings.reminderTime || ''
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/me/notification-settings', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-settings']);
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

  return (
    <>
      <div className="form-head">
        <div className="form-code"><span>Tài khoản</span><span>Thông báo</span></div>
        <h1 id="page-title">Thông báo và nhắc học</h1>
        <p>Thông báo quan trọng về tài khoản (xác thực, đổi mật khẩu) luôn được gửi qua email.</p>
      </div>

      <form id="form" className="settings-form" noValidate onSubmit={handleSubmit}>
        <div data-form-error hidden={!errorMsg}>{errorMsg}</div>
        
        <fieldset className="fieldset">
          <legend>Kênh nhận thông báo</legend>
          <label className="choice choice-card">
            <input 
              type="checkbox" 
              name="inApp" 
              checked={formState.inApp}
              onChange={e => setFormState({...formState, inApp: e.target.checked})}
            />
            <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
            <span className="choice-body">
              <span className="choice-title">Trong ứng dụng</span>
              <span className="choice-desc">Hiện ở biểu tượng chuông khi bạn đăng nhập.</span>
            </span>
          </label>
          <label className="choice choice-card">
            <input 
              type="checkbox" 
              name="email" 
              checked={formState.email}
              onChange={e => setFormState({...formState, email: e.target.checked})}
            />
            <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
            <span className="choice-body">
              <span className="choice-title">Email</span>
              <span className="choice-desc">Tổng kết tuần và nhắc học. Mỗi email có liên kết ngừng nhận.</span>
            </span>
          </label>
        </fieldset>
        
        <fieldset className="fieldset">
          <legend>Nhắc học mỗi ngày</legend>
          <label className="choice choice-card">
            <input 
              type="checkbox" 
              name="studyReminder" 
              id="studyReminder"
              checked={formState.studyReminder}
              onChange={e => setFormState({...formState, studyReminder: e.target.checked})}
            />
            <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
            <span className="choice-body">
              <span className="choice-title">Nhắc tôi học</span>
              <span className="choice-desc">Không nhắc nếu hôm đó bạn đã học xong.</span>
            </span>
          </label>
          <div className={`field ${styles.timeField}`} id="time-field" data-disabled={!formState.studyReminder ? true : undefined}>
            <label className="field-label" htmlFor="reminderTime">Giờ nhắc</label>
            <input 
              className="input" 
              id="reminderTime" 
              name="reminderTime" 
              type="time" 
              disabled={!formState.studyReminder}
              value={formState.reminderTime}
              onChange={e => setFormState({...formState, reminderTime: e.target.value})}
            />
            <p className="field-hint" id="tz-hint">Theo múi giờ {me?.muiGio || "Asia/Ho_Chi_Minh"}</p>
            <p className="field-error"></p>
          </div>
        </fieldset>
        
        <div className="settings-foot">
          <button type="submit" className="btn btn-primary btn-lg" id="save" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          <span className="saved-at" id="saved-at" aria-live="polite">{successMsg}</span>
        </div>
      </form>
    </>
  );
}
