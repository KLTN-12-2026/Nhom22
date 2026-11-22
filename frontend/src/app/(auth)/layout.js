'use client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AuthDemoCard } from '@/components/layout/AuthDemoCard';


export default function AuthLayout({ children }) {

  return (
    <RouteGuard requireAuth={false}>
      <div className="auth">
        <aside className="auth-aside">
          <Link className="brand" href="/">
            <img className="brand-mark" src="/shared/assets/mascot-mark.svg" alt="" width="28" height="28" />
            <span>Vocab<span className="brand-accent">Learning</span></span>
          </Link>
          <AuthDemoCard />
          <ul className="aside-facts" role="list">
            <li>Bộ mẫu Giao tiếp và TOEIC để bắt đầu ngay</li>
            <li>Ôn đúng lúc bằng lịch lặp lại ngắt quãng</li>
            <li>Tự tạo bộ thẻ, sao chép từ thư viện</li>
          </ul>
        </aside>

        <main className="auth-main" id="main"><ThemeToggle className="theme-auth" />
          <Link className="brand" href="/">
            <img className="brand-mark" src="/shared/assets/mascot-mark.svg" alt="" width="28" height="28" />
            <span>Vocab<span className="brand-accent">Learning</span></span>
          </Link>

          <div className="auth-form">
            {children}
          </div>

          <p className="auth-foot"><Link href="/">Về trang chủ</Link></p>
        </main>
      </div>
    </RouteGuard>
  );
}
