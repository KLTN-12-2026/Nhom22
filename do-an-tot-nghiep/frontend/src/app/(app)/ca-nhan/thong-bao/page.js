'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import styles from './page.module.css';
import { ErrorState, Icon } from '@/components/ui';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me')
  });

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => apiFetch('/api/v1/me/notification-settings')
  });

  const [draft, setFormState] = useState(null);
  const formState = draft ?? settings ?? {
    nhanTrongUngDung: false,
    nhanEmail: false,
    nhacHoc: false,
    gioNhac: '',
    version: null
  };



  const updateMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/me/notification-settings', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-settings'], data);
      setFormState(data);
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
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
    if (!updateMutation.isPending) updateMutation.mutate({...formState, gioNhac: formState.nhacHoc ? formState.gioNhac || null : null});
  };

  if (isLoading) return <div className="skeleton"><div className="sk sk-row" /></div>;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <>
      <div className="form-head">
        <div className="form-code"><span>Tài khoản</span><span>Thông báo</span></div>
        <h1 id="page-title">Thông báo và nhắc học</h1>
        <p>Thông báo quan trọng về tài khoản (xác thực, đổi mật khẩu) luôn được gửi qua email.</p>
      </div>

      <form id="form" className="settings-form" onSubmit={handleSubmit}>
        <div data-form-error hidden={!errorMsg}>{errorMsg}</div>
        {updateMutation.error?.status === 409 && <button type="button" className="btn btn-secondary" onClick={async () => { const result = await refetch(); if (result.data) { setFormState(null); setErrorMsg(''); updateMutation.reset(); } }}>Tải lại cài đặt</button>}

        <fieldset className="fieldset">
          <legend>Kênh nhận thông báo</legend>
          <label className="choice choice-card">
            <input
              type="checkbox"
              name="nhanTrongUngDung"
              checked={formState.nhanTrongUngDung}
              onChange={e => setFormState({...formState, nhanTrongUngDung: e.target.checked})}
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
              name="nhanEmail"
              checked={formState.nhanEmail}
              onChange={e => setFormState({...formState, nhanEmail: e.target.checked})}
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
              name="nhacHoc"
              id="nhacHoc"
              checked={formState.nhacHoc}
              onChange={e => setFormState({...formState, nhacHoc: e.target.checked})}
            />
            <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
            <span className="choice-body">
              <span className="choice-title">Nhắc tôi học</span>
              <span className="choice-desc">Không nhắc nếu hôm đó bạn đã học xong.</span>
            </span>
          </label>
          <div className={`field ${styles.timeField}`} id="time-field" data-disabled={!formState.nhacHoc ? true : undefined}>
            <label className="field-label" htmlFor="gioNhac">Giờ nhắc</label>
            <input
              className="input"
              id="gioNhac"
              name="gioNhac"
              type="time"
              required={formState.nhacHoc}
              disabled={!formState.nhacHoc}
              value={formState.gioNhac || ''}
              onChange={e => setFormState({...formState, gioNhac: e.target.value})}
            />
            <p className="field-hint" id="tz-hint">Theo múi giờ {me?.muiGio || "Asia/Ho_Chi_Minh"}</p>
            <p className="field-error"></p>
          </div>
        </fieldset>

        <div className="settings-foot">
          <button type="submit" className="btn btn-primary btn-lg" id="save" disabled={updateMutation.isPending || !settings}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          <span className="saved-at" id="saved-at" aria-live="polite">{successMsg}</span>
        </div>
      </form>
    </>
  );
}
