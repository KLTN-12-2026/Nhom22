'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dot2MockEnabled, isDot2Route } from '@/lib/dot2-mock.mjs';
const FUTURE = [];
const DOT2_MOCK = dot2MockEnabled();
export function isPendingRoute(path) {
  return FUTURE.some(route => path === route || path.startsWith(route + '/') || path.startsWith(route + '-'));
}
export function FeatureGate({ children }) {
  const path = usePathname();
  if (!isPendingRoute(path)) {
    if (!DOT2_MOCK || !isDot2Route(path)) return children;
    return <><p className="notice notice-warning" role="note" style={{ margin: 'var(--sp-3) var(--sp-4) 0' }}>Chế độ dữ liệu minh họa đang bật (NEXT_PUBLIC_DOT2_MOCK=enabled): khi máy chủ không trả lời, số liệu trên trang là dữ liệu giả.</p>{children}</>;
  }
  return <div className="page page-grid"><section className="sheet"><div className="form-head"><h1>Tính năng đang được hoàn thiện</h1><p>Phiên bản hiện tại hỗ trợ tài khoản, thiết lập học và quản lý bộ thẻ. Nội dung trang này sẽ mở khi chức năng sẵn sàng.</p></div><div className="row"><Link href="/bo-the" className="btn btn-primary">Bộ của tôi</Link><Link href="/" className="btn btn-secondary">Trang chủ</Link></div></section></div>;
}
