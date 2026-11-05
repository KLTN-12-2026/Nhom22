'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';

export default function SecurityPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formState, setFormState] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const passwordRules = {
    len: formState.newPassword.length >= 8 && formState.newPassword.length <= 72,
    letter: /[a-zA-Z]/.test(formState.newPassword),
    digit: /\d/.test(formState.newPassword)
  };

  const updateMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/me/password', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setSuccessMsg('Đã đổi mật khẩu');
      setErrorMsg('');
      setFormState({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formState.confirm !== formState.newPassword) {
      setErrorMsg('Hai mật khẩu chưa khớp');
      return;
    }
    if (!passwordRules.len || !passwordRules.letter || !passwordRules.digit) {
      setErrorMsg('Mật khẩu chưa đủ mạnh');
      return;
    }
    if (updateMutation.isPending) return;
    updateMutation.mutate({
      currentPassword: formState.currentPassword,
      newPassword: formState.newPassword
    });
  };


  return (
    <>
      <div className="form-head">
        <div className="form-code"><span>Tài khoản</span><span>Bảo mật</span></div>
        <h1 id="page-title">Đổi mật khẩu</h1>
        <p>Sau khi đổi, bạn vẫn đăng nhập trên thiết bị này. Các thiết bị khác sẽ bị đăng xuất.</p>
      </div>

      <form id="form" className="settings-form" onSubmit={handleSubmit}>
        <div data-form-error hidden={!errorMsg}>{errorMsg}</div>

        <div className="field">
          <label className="field-label" htmlFor="currentPassword">Mật khẩu hiện tại</label>
          <div className="input-group">
            <input
              className="input"
              id="currentPassword"
              name="currentPassword"
              maxLength={72}
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formState.currentPassword}
              onChange={e => setFormState({...formState, currentPassword: e.target.value})}
            />
            <button type="button" className="input-action" onClick={() => setShowCurrent(!showCurrent)} aria-label="Hiện mật khẩu" aria-pressed={showCurrent}>
              <Icon name="eye" />
            </button>
          </div>
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="newPassword">Mật khẩu mới</label>
          <div className="input-group">
            <input
              className="input"
              id="newPassword"
              name="newPassword"
              minLength={8}
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              required
              maxLength="72"
              aria-describedby="pw-rules"
              value={formState.newPassword}
              onChange={e => setFormState({...formState, newPassword: e.target.value})}
            />
            <button type="button" className="input-action" onClick={() => setShowNew(!showNew)} aria-label="Hiện mật khẩu" aria-pressed={showNew}>
              <Icon name="eye" />
            </button>
          </div>
          <ul className="pw-rules" id="pw-rules">
            <li data-rule="len" data-valid={passwordRules.len}><span className="bubble box" aria-hidden="true"></span>8–72 ký tự</li>
            <li data-rule="letter" data-valid={passwordRules.letter}><span className="bubble box" aria-hidden="true"></span>Có chữ cái</li>
            <li data-rule="digit" data-valid={passwordRules.digit}><span className="bubble box" aria-hidden="true"></span>Có chữ số</li>
          </ul>
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="confirm">Nhập lại mật khẩu mới</label>
          <input
            className="input"
            id="confirm"
            name="confirm"
            maxLength={72}
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            required
            value={formState.confirm}
            onChange={e => setFormState({...formState, confirm: e.target.value})}
          />
          <p className="field-error"></p>
        </div>

        <div className="settings-foot">
          <button type="submit" className="btn btn-primary btn-lg" id="save" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
          <a href="/quen-mat-khau" className="small">Quên mật khẩu hiện tại?</a>
        </div>
        <div className="saved-at" style={{ marginTop: '8px' }}>{successMsg}</div>
      </form>
    </>
  );
}
