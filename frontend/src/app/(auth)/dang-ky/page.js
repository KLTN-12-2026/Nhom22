'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();

  const registerMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data, variables) => {
      router.push(`/xac-thuc-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err) => {
      alert(err.message || 'Đăng ký thất bại');
    }
  });

  const handleRegister = (e) => {
    e.preventDefault();
    registerMutation.mutate({
      tenHienThi: e.target.name.value,
      email: e.target.email.value,
      password: e.target.password.value,
    });
  };

  return (
    <>
      <div className="auth-title">
        <h1>Tạo tài khoản</h1>
        <p>Bắt đầu hành trình cải thiện vốn từ.</p>
      </div>

      <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => alert('Chức năng Google đang được phát triển')}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5Z" />
          <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1Z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8L32.3 36.3c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48Z" />
        </svg>
        Đăng ký với Google
      </button>

      <p className="or-divider">hoặc dùng email</p>

      <form onSubmit={handleRegister} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="name">Tên hiển thị</label>
          <input 
            className="input" 
            id="name" 
            name="name" 
            type="text" 
            autoComplete="name" 
            required 
            placeholder="Ví dụ: Hoàng Anh"
          />
          <p className="field-error"></p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input 
            className="input" 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email" 
            inputMode="email" 
            required 
            placeholder="ten@gmail.com"
          />
          <p className="field-error"></p>
        </div>
        
        <div className="field">
          <label className="field-label" htmlFor="password">Mật khẩu</label>
          <input 
            className="input" 
            id="password" 
            name="password" 
            type="password" 
            autoComplete="new-password" 
            required 
          />
          <p className="field-error"></p>
        </div>
        
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
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
