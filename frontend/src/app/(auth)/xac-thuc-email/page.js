'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  
  const [view, setView] = useState(token ? 'loading' : 'wait'); // loading, ok, bad, wait

  const verifyMutation = useMutation({
    mutationFn: (t) => apiFetch('/api/v1/auth/verify-email', { method: 'POST', body: JSON.stringify({ token: t }) }),
    onSuccess: () => setView('ok'),
    onError: () => setView('bad')
  });

  const resendMutation = useMutation({
    mutationFn: (e) => apiFetch('/api/v1/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: e }) })
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  const handleResend = (e) => {
    e.preventDefault();
    if (!email) return;
    resendMutation.mutate(email);
  };

  return (
    <>
      {view === 'loading' && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
          <div style={{ margin: '0 auto var(--sp-4)', width: '64px', height: '64px', border: '2px solid var(--border)', borderRadius: '50%', borderTopColor: 'var(--primary-strong)', animation: 'spin 1s linear infinite' }} />
          <h1>Đang xác thực email…</h1>
          <p style={{ color: 'var(--ink-2)' }}>Vui lòng chờ vài giây.</p>
        </div>
      )}

      {view === 'ok' && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
          <div style={{ margin: '0 auto var(--sp-4)', width: '64px', height: '64px', border: '2px solid var(--success)', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>✓</div>
          <h1>Email đã được xác thực</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: 'var(--sp-6)' }}>Tài khoản của bạn đã sẵn sàng. Đăng nhập để bắt đầu.</p>
          <Link href={`/dang-nhap${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="btn btn-primary btn-lg btn-block">
            Đăng nhập
          </Link>
        </div>
      )}

      {(view === 'bad' || view === 'wait') && (
        <>
          <div className="auth-title">
            {view === 'bad' ? (
              <>
                <h1>Liên kết không hợp lệ</h1>
                <p>Liên kết có thể đã hết hạn hoặc bị lỗi. Nhập email để nhận liên kết mới.</p>
              </>
            ) : (
              <>
                <h1>Xác thực email</h1>
                <p>Mở thư chúng tôi gửi và bấm liên kết xác thực. Nếu không nhận được thư, gửi lại bên dưới.</p>
              </>
            )}
          </div>

          <form onSubmit={handleResend} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">Email đã đăng ký</label>
              <input 
                className="input" 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email" 
                inputMode="email" 
                required 
                placeholder="ten@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="field-error"></p>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={resendMutation.isPending}>
              {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại thư xác thực'}
            </button>

            {resendMutation.isSuccess && (
              <p className="notice notice-success" style={{ marginTop: 'var(--sp-4)' }}>
                <Icon name="check" />
                <span>Nếu email này đã đăng ký và chưa xác thực, thư mới sẽ tới trong vài phút.</span>
              </p>
            )}
          </form>
          <p className="auth-foot">
            <Link href="/dang-nhap">Quay lại đăng nhập</Link>
          </p>
        </>
      )}
    </>
  );
}
