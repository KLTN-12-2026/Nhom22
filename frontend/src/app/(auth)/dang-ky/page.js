'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import styles from '../layout.module.css';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = (e) => {
    e.preventDefault();
    // Fake login after register
    localStorage.setItem('vocab_demo_user', JSON.stringify({ tenHienThi: 'Thảo', vaiTro: ['USER'] }));
    router.push('/bat-dau');
  };

  return (
    <>
      <div className={styles.authTitle}>
        <h1>Tạo tài khoản</h1>
        <p>Bắt đầu hành trình cải thiện vốn từ.</p>
      </div>

      <Button variant="secondary" size="lg" className="btn-block" style={{ width: '100%' }}>
        Đăng ký với Google
      </Button>

      <p className={styles.orDivider}>hoặc dùng email</p>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input 
          id="name" 
          type="text" 
          label="Tên hiển thị" 
          placeholder="Ví dụ: Hoàng Anh" 
          required 
        />

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
          label="Mật khẩu"
          required 
        />
        
        <Button type="submit" variant="primary" size="lg" style={{ marginTop: 'var(--space-2)' }}>
          Tạo tài khoản
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-ink-2)' }}>
        Đã có tài khoản? <Link href="/dang-nhap" style={{ color: 'var(--color-primary-strong)', fontWeight: '600', textDecoration: 'none' }}>Đăng nhập</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-3)' }}>
        Bằng việc tạo tài khoản, bạn đồng ý với <Link href="/chinh-sach" style={{ color: 'var(--color-ink-2)' }}>Điều khoản</Link> của chúng tôi.
      </p>
    </>
  );
}
