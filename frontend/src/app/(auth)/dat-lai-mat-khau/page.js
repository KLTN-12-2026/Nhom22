'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [view, setView] = useState(token ? 'ask' : 'bad'); // ask, done, bad

  const resetMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => setView('done'),
    onError: error => { setErrorMsg(error.message); if (error.code === 'TOKEN_INVALID') setView('bad'); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Hai mật khẩu chưa khớp.');
      return;
    }
    if (resetMutation.isPending) return;
    setErrorMsg('');
    resetMutation.mutate({ token, password });
  };

  return (
    <>
      {view === 'ask' && (
        <>
          <div className="auth-title">
            <h1>Đặt mật khẩu mới</h1>
            <p>Sau khi đổi, các phiên đăng nhập khác của bạn sẽ bị đăng xuất.</p>
          </div>
          <form onSubmit={handleSubmit}>
            {errorMsg && <p className="notice notice-error" role="alert">{errorMsg}</p>}
            <div className="field">
              <label className="field-label" htmlFor="password">Mật khẩu mới</label>
              <input
                className="input"
                id="password"
                name="password" minLength={8} maxLength={72} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="Mật khẩu 8–72 ký tự, có chữ cái và chữ số"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
                8–72 ký tự • Có chữ cái • Có chữ số
              </div>
              <p className="field-error"></p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="confirm">Nhập lại mật khẩu mới</label>
              <input
                className="input"
                id="confirm"
                name="confirm" maxLength={72}
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              <p className="field-error"></p>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        </>
      )}

      {view === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <div className="auth-title">
            <h1>Đã lưu mật khẩu mới</h1>
            <p>Đăng nhập lại bằng mật khẩu vừa đặt.</p>
          </div>
          <Link href="/dang-nhap" className="btn btn-primary btn-lg btn-block">Đăng nhập</Link>
        </div>
      )}

      {view === 'bad' && (
        <div className="error-state" role="alert">
          <Icon name="alert" className="icon-lg" />
          <h1>Liên kết đặt lại không dùng được</h1>{errorMsg && <p>{errorMsg}</p>}
          <p>Liên kết đã hết hạn sau 30 phút, đã được dùng, hoặc bị sao chép thiếu.</p>
          <div className="row">
            <Link href="/quen-mat-khau" className="btn btn-secondary">Gửi liên kết mới</Link>
          </div>
        </div>
      )}

      <p className="auth-foot">
        <Link href="/dang-nhap">Quay lại đăng nhập</Link>
      </p>
    </>
  );
}
