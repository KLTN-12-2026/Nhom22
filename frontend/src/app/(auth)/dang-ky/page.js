'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useCooldown } from '@/hooks/useCooldown';
import { FieldError } from '@/components/ui/FieldError';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data, variables) => {
      router.push(`/xac-thuc-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err) => {
      setErrorMsg(err.message);
    }
  });

  const cooldown = useCooldown(registerMutation.error);
  const handleRegister = (e) => {
    e.preventDefault();
    if (registerMutation.isPending || cooldown > 0 || !e.currentTarget.reportValidity()) return;
    setErrorMsg('');
    if (e.target.password.value !== e.target.confirm.value) { setErrorMsg('Hai mật khẩu chưa khớp.'); return; }
    registerMutation.mutate({
      tenHienThi: e.target.elements.namedItem('name').value,
      email: e.target.email.value,
      password: e.target.password.value,
      acceptTerms: e.target.querySelector('input[type=checkbox]').checked,
      muiGio: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <>
      <div className="auth-title">
        <h1>Tạo tài khoản</h1>
        <p>Bắt đầu hành trình cải thiện vốn từ.</p>
      </div>

      <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => window.location.assign('/api/v1/auth/google/start')}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5Z" />
          <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1Z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8L32.3 36.3c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48Z" />
        </svg>
        Đăng ký với Google
      </button>

      <p className="or-divider">hoặc dùng email</p>

      {errorMsg && <p className="notice notice-error" role="alert">{errorMsg}</p>}
      <form onSubmit={handleRegister}>
        <div className="field">
          <label className="field-label" htmlFor="name">Tên hiển thị</label>
          <input
            className="input"
            id="name"
            name="name" maxLength={100}
            type="text"
            autoComplete="name"
            required
            placeholder="Ví dụ: Hoàng Anh"
          />
          <FieldError error={registerMutation.error} field="tenHienThi" />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            name="email" maxLength={255}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="ten@gmail.com"
          />
          <FieldError error={registerMutation.error?.status === 409 ? {fieldErrors:[{field:"email",message:"Email đã được đăng ký"}]} : registerMutation.error} field="email" />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">Mật khẩu</label>
          <input
            className="input"
            id="password"
            name="password" minLength={8} maxLength={72} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="Mật khẩu 8–72 ký tự, có chữ cái và chữ số"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldError error={registerMutation.error} field="password" />
        </div>

        <div className="field"><label className="field-label" htmlFor="confirm">Nhập lại mật khẩu</label><input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" required maxLength={72} /></div>
        <label className="choice"><input name="acceptTerms" type="checkbox" required /><span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span><span>Tôi đồng ý với <Link href="/chinh-sach">Điều khoản sử dụng</Link></span></label>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={registerMutation.isPending || cooldown > 0}>
          {cooldown > 0 ? `Thử lại sau ${cooldown} giây` : registerMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
      </form>

      <p className="auth-foot">
        Đã có tài khoản? <Link href="/dang-nhap">Đăng nhập</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: 'var(--sp-2)', fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
        Bằng việc tạo tài khoản, bạn đồng ý với <Link href="/chinh-sach" style={{ color: 'var(--ink-2)' }}>Điều khoản</Link> của chúng tôi.
      </p>
    </>
  );
}
