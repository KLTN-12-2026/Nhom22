'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import styles from '../layout.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Fake login
    localStorage.setItem('vocab_demo_user', JSON.stringify({ tenHienThi: 'Thảo', vaiTro: ['USER'] }));
    router.push('/bo-the');
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
        
        <Button type="submit" variant="primary" size="lg" style={{ marginTop: 'var(--space-2)' }}>
          Đăng nhập
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-ink-2)' }}>
        Chưa có tài khoản? <Link href="/dang-ky" style={{ color: 'var(--color-primary-strong)', fontWeight: '600', textDecoration: 'none' }}>Đăng ký</Link>
      </p>
    </>
  );
}
