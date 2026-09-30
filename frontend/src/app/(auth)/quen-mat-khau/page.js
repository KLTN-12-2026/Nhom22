'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Icon } from '@/components/ui';
import styles from '../layout.module.css';
import { useMutation } from '@tanstack/react-query';
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
    onError: (err) => alert(err.message || 'Có lỗi xảy ra')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    forgotMutation.mutate(email);
  };

  return (
    <>
      <Link href="/dang-nhap" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
        <Icon name="arrow-left" /> Quay lại đăng nhập
      </Link>

      {!sent ? (
        <>
          <div className={styles.authTitle}>
            <h1>Quên mật khẩu</h1>
            <p>Nhập email bạn dùng để đăng nhập. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu, có hiệu lực 30 phút.</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input 
              id="email" 
              type="email" 
              label="Email" 
              placeholder="ten@gmail.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <Button type="submit" variant="primary" size="lg" className="btn-block" disabled={forgotMutation.isPending}>
              {forgotMutation.isPending ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className={styles.authTitle}>
            <h1>Kiểm tra hộp thư</h1>
            <p>Nếu <strong>{email}</strong> đã đăng ký, thư đặt lại mật khẩu sẽ tới trong vài phút. Để bảo mật, chúng tôi không cho biết email có tồn tại hay không.</p>
          </div>
          
          {demoToken && (
            <div style={{ background: 'var(--color-field)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
              <p style={{ marginBottom: 'var(--space-3)' }}><strong>Bản mockup:</strong> Đây là link giả lập gửi qua mailpit.</p>
              <Link href={`/dat-lai-mat-khau?token=${demoToken}`}>
                <Button variant="secondary">Mở thư đặt lại mật khẩu</Button>
              </Link>
            </div>
          )}
          
          <Button variant="ghost" onClick={() => setSent(false)} style={{ justifySelf: 'start', padding: 0 }}>Gửi tới email khác</Button>
        </>
      )}

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-ink-2)' }}>
        Chưa có tài khoản? <Link href="/dang-ky" style={{ color: 'var(--color-primary-strong)', fontWeight: '600', textDecoration: 'none' }}>Tạo tài khoản</Link>
      </p>
    </>
  );
}
