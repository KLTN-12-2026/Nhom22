'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export default function ProfileLayout({ children }) {
  const pathname = usePathname();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/v1/me')
  });

  return (
    <div className="page page-grid with-side" data-view={isLoading ? "loading" : "ready"}>
      <div data-when="loading">
        <div className="sheet">
          <div className="skeleton"><div className="sk sk-title"></div><div className="sk sk-row"></div><div className="sk sk-row"></div></div>
        </div>
      </div>
      
      <section className="sheet" data-when="ready" aria-labelledby="page-title">
        <nav className="tabs account-tabs" aria-label="Tài khoản">
          <Link href="/ca-nhan" className="tab" aria-current={pathname === '/ca-nhan' ? 'page' : undefined}>Hồ sơ</Link>
          <Link href="/ca-nhan/hoc-tap" className="tab" aria-current={pathname === '/ca-nhan/hoc-tap' ? 'page' : undefined}>Thiết lập học</Link>
          <Link href="/ca-nhan/bao-mat" className="tab" aria-current={pathname === '/ca-nhan/bao-mat' ? 'page' : undefined}>Bảo mật</Link>
          <Link href="/ca-nhan/thong-bao" className="tab" aria-current={pathname === '/ca-nhan/thong-bao' ? 'page' : undefined}>Thông báo</Link>
        </nav>
        {children}
      </section>

      <aside className="side-col" data-when="ready">
        <section className="panel" aria-labelledby="acc-title">
          <h2 className="panel-title" id="acc-title">Tài khoản</h2>
          <dl className="kv" id="kv">
            <dt>Trạng thái</dt>
            <dd>
              {me?.trangThai === "HOAT_DONG" ? (
                <span className="stamp stamp-success">Đã xác thực email</span>
              ) : (
                <span className="stamp stamp-warning">Chưa xác thực</span>
              )}
            </dd>
            <dt>Vai trò</dt>
            <dd>
              {me?.vaiTro?.map((r) => r === "ADMIN" ? "Quản trị viên" : "Người học").join(", ")}
            </dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
