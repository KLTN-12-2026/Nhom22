'use client';
import Link from 'next/link';
import { RouteGuard } from '@/components/layout/RouteGuard';


export default function AuthLayout({ children }) {

  return (
    <RouteGuard requireAuth={false}>
      <div className="auth">
        <aside className="auth-aside">
          <Link className="brand" href="/">
            <img className="brand-mark" src="/shared/assets/logo-mark-inverse.svg" alt="" width="28" height="28" />
            <span>Vocab<span className="brand-accent">Learning</span></span>
          </Link>
          <figure className="aside-sheet" aria-label="Ví dụ một câu hỏi từ vựng">
            <div className="aside-q"><span className="aside-no">Câu 14</span><span className="aside-dir">Anh → Việt</span></div>
            <p className="aside-word" lang="en">receipt</p><p className="aside-ipa" lang="en">/rɪˈsiːt/ <em>n.</em></p>
            <ol className="aside-options" role="list">
              <li><span className="bubble">A</span>lời mời</li>
              <li><span className="bubble aside-pick is-filled">B</span>biên lai, giấy biên nhận</li>
              <li><span className="bubble">C</span>công thức nấu ăn</li>
              <li><span className="bubble">D</span>người nhận</li>
            </ol>
            <figcaption>Mỗi từ có hai chiều học, mỗi chiều một lịch ôn riêng.</figcaption>
          </figure>
          <ul className="aside-facts" role="list">
            <li>Bộ mẫu Giao tiếp và TOEIC để bắt đầu ngay</li>
            <li>Ôn đúng lúc bằng lịch lặp lại ngắt quãng</li>
            <li>Tự tạo bộ thẻ, sao chép từ thư viện</li>
          </ul>
        </aside>

        <main className="auth-main" id="main">
          <Link className="brand" href="/">
            <img className="brand-mark" src="/shared/assets/logo-mark.svg" alt="" width="28" height="28" />
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
