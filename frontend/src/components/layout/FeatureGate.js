'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const FUTURE = ['/hom-nay', '/hoc', '/luyen-tap', '/so-tay', '/thong-ke', '/quan-tri/tai-khoan', '/quan-tri/bo-mau', '/quan-tri/nhat-ky'];
export function FeatureGate({ children }) {
  const path = usePathname();
  const pending = FUTURE.some(route => path === route || path.startsWith(route + '/') || path.startsWith(route + '-')) || /^\/bo-the\/[^/]+\/(the-tao|tien-do|nhap-csv)$/.test(path);
  if (!pending) return children;
  return <div className="page page-grid"><section className="sheet"><div className="form-head"><h1>Tính năng đang được hoàn thiện</h1><p>Phiên bản hiện tại hỗ trợ tài khoản, thiết lập học và quản lý bộ thẻ. Nội dung trang này sẽ mở khi chức năng sẵn sàng.</p></div><div className="row"><Link href="/bo-the" className="btn btn-primary">Bộ của tôi</Link><Link href="/" className="btn btn-secondary">Trang chủ</Link></div></section></div>;
}
