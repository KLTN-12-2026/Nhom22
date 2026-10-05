'use client';
import { useAvatar } from '@/hooks/useAvatar';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, logout } from '@/lib/api-client';
import { uploadAvatar } from '@/lib/upload-avatar';
import { Icon } from '@/components/ui';
import styles from './layout.module.css';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const avatarMutation = useMutation({
    mutationFn: file => file ? uploadAvatar(file) : apiFetch('/api/v1/me/avatar', { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); setSuccessMsg('Đã lưu ảnh đại diện'); setErrorMsg(''); },
    onError: error => setErrorMsg(error.message)
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me')
  });

  const { data: avatar } = useAvatar(me);
  const [draft, setFormState] = useState(null);
  const formState = draft ?? me ?? {
    tenHienThi: '',
    email: '',
    muiGio: 'Asia/Ho_Chi_Minh'
  };



  const updateMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSuccessMsg(`Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      tenHienThi: formState.tenHienThi,
      muiGio: formState.muiGio
    });
  };

  const handleLogout = () => {
    // Basic logout handling
    logout(queryClient).catch(error => alert(error.message));
  };

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.split(/\s+/).pop()[0].toUpperCase();
  };

  return (
    <>
      <div className="form-head">
        <div className="form-code">
          <span>Tài khoản</span>
          <span>Hồ sơ</span>
        </div>
        <h1 id="page-title">Hồ sơ của bạn</h1>
      </div>

      <form id="form" className="settings-form" noValidate onSubmit={handleSubmit}>
        <div data-form-error hidden={!errorMsg}>{errorMsg}</div>

        <div className="field" data-field="file">
          <span className="field-label">Ảnh đại diện</span>
          <div className={styles.avatarRow}>
            <span id="avatar">
              <span className="avatar avatar-xl">
                {avatar?.downloadUrl ? (
                  <img src={avatar?.downloadUrl} alt="" />
                ) : (
                  getInitial(me?.tenHienThi)
                )}
              </span>
            </span>
            <div className={styles.avatarActions}>
              <button type="button" className="btn btn-secondary" id="avatar-upload" disabled={avatarMutation.isPending} onClick={() => fileRef.current.click()}>
                <Icon name="upload" />Tải ảnh lên
              </button>
              <input ref={fileRef} onChange={event => { const file = event.target.files[0]; if (file) avatarMutation.mutate(file); event.target.value = ''; }} type="file" id="avatar-file" className="sr-only" accept="image/jpeg,image/png,image/webp" />
              <button type="button" className="btn btn-quiet" id="avatar-remove" disabled={avatarMutation.isPending} onClick={() => avatarMutation.mutate(null)} hidden={!avatar?.downloadUrl}>Gỡ ảnh</button>
              <p className="field-hint">JPG, PNG hoặc WEBP, tối đa 2 MB.</p>
            </div>
          </div>
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="tenHienThi">Tên hiển thị</label>
          <input
            className="input"
            id="tenHienThi"
            name="tenHienThi"
            maxLength="100"
            autoComplete="nickname"
            required
            value={formState.tenHienThi}
            onChange={e => setFormState({...formState, tenHienThi: e.target.value})}
          />
          <p className="field-hint">Hiện trên bộ thẻ bạn chia sẻ công khai.</p>
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">Email đăng nhập</label>
          <input
            className="input"
            id="email"
            type="email"
            readOnly
            aria-describedby="email-hint"
            value={formState.email}
          />
          <p className="field-hint" id="email-hint">Không đổi được email ở bản này.</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="muiGio">Múi giờ</label>
          <select
            className="select"
            id="muiGio"
            name="muiGio"
            value={formState.muiGio}
            onChange={e => setFormState({...formState, muiGio: e.target.value})}
          >
            <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
            <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
            <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
            <option value="Europe/Berlin">Berlin (GMT+1)</option>
            <option value="America/New_York">New York (GMT−5)</option>
          </select>
          <p className="field-hint">Dùng để tính ngày học và giờ nhắc.</p>
        </div>

        <div className="settings-foot">
          <button type="submit" className="btn btn-primary btn-lg" id="save" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
          <span className="saved-at" id="saved-at" aria-live="polite">{successMsg}</span>
        </div>
      </form>

      <div className={styles.mobileOnly} style={{ marginTop: 'var(--sp-6)' }}>
        <Link className="btn btn-secondary" id="admin-link" href="/quan-tri/chu-de" hidden={!me?.vaiTro?.includes('ADMIN')}>
          Quản trị chủ đề và nhãn
        </Link>
        <button type="button" className="btn btn-quiet" data-logout onClick={handleLogout}>Đăng xuất</button>
      </div>
    </>
  );
}
