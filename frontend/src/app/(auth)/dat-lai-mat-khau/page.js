'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Icon } from '@/components/ui';
import styles from '../layout.module.css';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [view, setView] = useState(token ? 'ask' : 'bad'); // ask, done, bad

  const resetMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => setView('done'),
    onError: () => setView('bad')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('Hai mật khẩu chưa khớp!');
      return;
    }
    resetMutation.mutate({ token, password });
  };

  return (
    <>
      {view === 'ask' && (
        <>
          <div className={styles.authTitle}>
            <h1>Đặt mật khẩu mới</h1>
            <p>Sau khi đổi, các phiên đăng nhập khác của bạn sẽ bị đăng xuất.</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input 
              id="password" 
              type="password" 
              label="Mật khẩu mới" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', paddingLeft: 'var(--space-2)' }}>
              8–72 ký tự • Có chữ cái • Có chữ số
            </div>
            <Input 
              id="confirm" 
              type="password" 
              label="Nhập lại mật khẩu mới" 
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required 
            />
            <Button type="submit" variant="primary" size="lg" className="btn-block" disabled={resetMutation.isPending} style={{ marginTop: 'var(--space-2)' }}>
              {resetMutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </Button>
          </form>
        </>
      )}

      {view === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <div className={styles.authTitle}>
            <h1>Đã lưu mật khẩu mới</h1>
            <p>Đăng nhập lại bằng mật khẩu vừa đặt.</p>
          </div>
          <Link href="/dang-nhap" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }}>Đăng nhập</Button>
          </Link>
        </div>
      )}

      {view === 'bad' && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{ margin: '0 auto var(--space-4)', width: '64px', height: '64px', border: '2px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>!</div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Liên kết đặt lại không dùng được</h1>
          <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-6)' }}>Liên kết đã hết hạn sau 30 phút, đã được dùng, hoặc bị sao chép thiếu.</p>
          <Link href="/quen-mat-khau" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Gửi liên kết mới</Button>
          </Link>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-ink-2)' }}>
        <Link href="/dang-nhap" style={{ color: 'var(--color-primary-strong)', fontWeight: '600', textDecoration: 'none' }}>Quay lại đăng nhập</Link>
      </p>
    </>
  );
}
