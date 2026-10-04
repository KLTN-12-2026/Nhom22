'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const nextParam = searchParams.get('next');
  const loggedOutParam = searchParams.get('loggedOut');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const loginMutation = useMutation({
    mutationFn: (credentials) => apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      const dest = !user.daHoanTatKhoiDau ? "/bat-dau" : (nextParam ? nextParam : "/hom-nay");
      router.push(dest);
    },
    onError: (err) => {
      alert(err.message || 'Đăng nhập thất bại');
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({
      email,
      password,
      remember
    });
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('12345678');
  };

  return (
    <>
      <div className="auth-title">
        <h1>Đăng nhập</h1>
        <p>Tiếp tục học từ chỗ bạn dừng lại.</p>
      </div>

      {loggedOutParam && (
        <p className="notice notice-success">
          <Icon name="check" />
          <span>Bạn đã đăng xuất. Phiên đăng nhập trên thiết bị này đã kết thúc.</span>
        </p>
      )}

      {nextParam && (
        <p className="notice">
          <Icon name="info" />
          <span>Đăng nhập để mở trang bạn vừa chọn.</span>
        </p>
      )}

      <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => alert('Chức năng Google đang được phát triển')}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5Z" />
          <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1Z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8L32.3 36.3c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48Z" />
        </svg>
        Đăng nhập với Google
      </button>

      <p className="or-divider">hoặc dùng email</p>

      <form id="form" noValidate onSubmit={handleLogin}>
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input 
            className="input" 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="username" 
            inputMode="email" 
            required 
            placeholder="ten@gmail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="field-error"></p>
        </div>
        
        <div className="field">
          <label className="field-label" htmlFor="password">
            <span>Mật khẩu</span>
            <Link href="/quen-mat-khau" className="small" style={{ fontWeight: 550 }}>Quên mật khẩu?</Link>
          </label>
          <div className="input-group">
            <input 
              className="input" 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              autoComplete="current-password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              className="input-action" 
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} 
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>
          <p className="field-error"></p>
        </div>

        <label className="choice">
          <input type="checkbox" name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
          <span className="choice-body"><span>Ghi nhớ đăng nhập trên thiết bị này (7 ngày)</span></span>
        </label>
        
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <details className="demo-accounts">
        <summary>Tài khoản dùng thử (mockup)</summary>
        <p className="muted" style={{ marginTop: '4px' }}>Mật khẩu chung: <code>12345678</code>. Bấm để điền.</p>
        <ul id="demo-list">
          <li>
            <button type="button" onClick={() => handleDemoFill('an@vocab.local')}>
              <span>an@vocab.local</span><span className="muted">Người học, đã có bộ thẻ</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => handleDemoFill('admin@vocab.local')}>
              <span>admin@vocab.local</span><span className="muted">Quản trị viên</span>
            </button>
          </li>
        </ul>
      </details>

      <p className="auth-foot" style={{ marginTop: 0 }}>
        Chưa có tài khoản? <Link href="/dang-ky">Tạo tài khoản</Link>
      </p>
    </>
  );
}
