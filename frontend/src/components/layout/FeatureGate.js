'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dot2MockEnabled, isDot2Route } from '@/lib/dot2-mock.mjs';
const FUTURE = ['/quan-tri/tai-khoan', '/quan-tri/bo-mau', '/quan-tri/nhat-ky'];
const DOT2_MOCK = dot2MockEnabled();
export function isPendingRoute(path) {
  return FUTURE.some(route => path === route || path.startsWith(route + '/') || path.startsWith(route + '-')) || (!DOT2_MOCK && isDot2Route(path));
}
export function FeatureGate({ children }) {
  const path = usePathname();
  if (!isPendingRoute(path)) {
    if (!DOT2_MOCK || !isDot2Route(path)) return children;
    return <><p className="notice notice-warning" role="note" style={{ margin: 'var(--sp-3) var(--sp-4) 0' }}>Dữ liệu minh họa: máy chủ chưa có chức năng này nên số liệu và bài luyện trên trang chỉ để xem thử, không phải kết quả học thật.</p>{children}</>;
  }
  return <div className="page page-grid"><section className="sheet"><div className="form-head"><h1>Tính năng đang được hoàn thiện</h1><p>Phiên bản hiện tại hỗ trợ tài khoản, thiết lập học và quản lý bộ thẻ. Nội dung trang này sẽ mở khi chức năng sẵn sàng.</p></div><div className="row"><Link href="/bo-the" className="btn btn-primary">Bộ của tôi</Link><Link href="/" className="btn btn-secondary">Trang chủ</Link></div></section></div>;
}
