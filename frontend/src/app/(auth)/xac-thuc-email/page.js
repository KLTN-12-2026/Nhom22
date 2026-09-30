'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Icon } from '@/components/ui';
import styles from '../layout.module.css';
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
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{ margin: '0 auto var(--space-4)', width: '64px', height: '64px', border: '2px solid var(--color-border)', borderRadius: '50%', borderTopColor: 'var(--color-primary-strong)', animation: 'spin 1s linear infinite' }} />
          <h1>Đang xác thực email…</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Vui lòng chờ vài giây.</p>
        </div>
      )}

      {view === 'ok' && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{ margin: '0 auto var(--space-4)', width: '64px', height: '64px', border: '2px solid var(--color-success)', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>✓</div>
          <h1>Email đã được xác thực</h1>
          <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-6)' }}>Tài khoản của bạn đã sẵn sàng. Đăng nhập để bắt đầu.</p>
          <Link href={`/dang-nhap${email ? `?email=${encodeURIComponent(email)}` : ''}`} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }}>Đăng nhập</Button>
          </Link>
        </div>
      )}

      {(view === 'bad' || view === 'wait') && (
        <>
          <div className={styles.authTitle}>
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

          <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input 
              id="email" 
              type="email" 
              label="Email đã đăng ký" 
              placeholder="ten@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            
            <Button type="submit" variant="primary" size="lg" disabled={resendMutation.isPending}>
              {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại thư xác thực'}
            </Button>

            {resendMutation.isSuccess && (
              <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                Nếu email này đã đăng ký và chưa xác thực, thư mới sẽ tới trong vài phút.
              </div>
            )}
          </form>
        </>
      )}
    </>
  );
}
