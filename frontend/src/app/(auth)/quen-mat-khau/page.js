'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import { useCooldown } from '@/hooks/useCooldown';
import { apiFetch } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState(null);

  const forgotMutation = useMutation({
    mutationFn: (e) => apiFetch('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: e }) }),
    onSuccess: (data) => {
      setSent(true);
      if (data?.demoToken) setDemoToken(data.demoToken);
    },
    onError: () => {}
  });

  const cooldown = useCooldown(forgotMutation.error);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || forgotMutation.isPending || cooldown > 0) return;
    forgotMutation.mutate(email);
  };

  return (
    <>
      <Link href="/dang-nhap" className="btn btn-quiet" style={{ justifySelf: 'start', marginLeft: '-12px' }}>
        <Icon name="arrow-left" />Quay lại đăng nhập
      </Link>

      {!sent ? (
        <div id="ask" className="stack">
          <div className="auth-title">
            <h1>Quên mật khẩu</h1>
            <p>Nhập email bạn dùng để đăng nhập. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu, có hiệu lực 30 phút.</p>
          </div>
          <form id="form" onSubmit={handleSubmit}>
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
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className="field-error"></p>
            </div>
            {forgotMutation.error && <p className="notice notice-error" role="alert">{forgotMutation.error.message}</p>}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={forgotMutation.isPending || cooldown > 0}>
              {cooldown > 0 ? `Thử lại sau ${cooldown} giây` : forgotMutation.isPending ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          </form>
        </div>
      ) : (
        <div id="sent" className="stack" aria-live="polite">
          <div className="auth-title">
            <h1 tabIndex="-1">Kiểm tra hộp thư</h1>
            <p>Nếu <strong id="sent-email">{email}</strong> đã đăng ký, thư đặt lại mật khẩu sẽ tới trong vài phút. Để bảo mật, chúng tôi không cho biết email có tồn tại hay không.</p>
          </div>

          {process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && demoToken && (
            <div className="notice" id="demo-link">
              <Icon name="mail" />
              <div className="stack-sm">
                <p><strong>Bản mockup:</strong> thư được mô phỏng như trong Mailpit.</p>
                <Link className="btn btn-secondary" id="open-mail" href={`/dat-lai-mat-khau?token=${demoToken}`}>
                  Mở thư đặt lại mật khẩu
                </Link>
              </div>
            </div>
          )}

          <button type="button" className="btn btn-quiet" id="again" style={{ justifySelf: 'start' }} onClick={() => setSent(false)}>
            Gửi tới email khác
          </button>
        </div>
      )}
    </>
  );
}
