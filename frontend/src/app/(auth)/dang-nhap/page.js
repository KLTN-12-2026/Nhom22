'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import styles from '../layout.module.css';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials) => apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/bo-the');
    },
    onError: (err) => {
      alert(err.message || 'Đăng nhập thất bại');
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({
      email: e.target.email.value,
      password: e.target.password.value,
    });
  };

  return (
    <>
      <div className={styles.authTitle}>
        <h1>Đăng nhập</h1>
        <p>Tiếp tục học từ chỗ bạn dừng lại.</p>
      </div>

      <Button variant="secondary" size="lg" className="btn-block" style={{ width: '100%' }}>
        Đăng nhập với Google
      </Button>

      <p className={styles.orDivider}>hoặc dùng email</p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input 
          id="email" 
          type="email" 
          label="Email" 
          placeholder="ten@gmail.com" 
          required 
        />
        
        <Input 
          id="password" 
          type="password" 
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Mật khẩu</span>
              <Link href="/quen-mat-khau" style={{ color: 'var(--color-ink-2)', fontSize: 'var(--font-size-sm)', textDecoration: 'none' }}>Quên mật khẩu?</Link>
            </div>
          } 
          required 
        />
        
        <Button type="submit" variant="primary" size="lg" style={{ marginTop: 'var(--space-2)' }} disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-ink-2)' }}>
        Chưa có tài khoản? <Link href="/dang-ky" style={{ color: 'var(--color-primary-strong)', fontWeight: '600', textDecoration: 'none' }}>Đăng ký</Link>
      </p>
    </>
  );
}
