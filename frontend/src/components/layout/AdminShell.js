'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Icon, useToast } from '@/components/ui';
import { useAvatar } from '@/hooks/useAvatar';
import { apiFetch, logout } from '@/lib/api-client';
import { listPublishRequests } from '@/lib/publish-requests.mjs';
import { listReports } from '@/lib/admin-ops.mjs';
import '@/styles/admin.css';

export const ADMIN_NAV = [
  { group: 'Tổng quan', items: [
    { key: 'dashboard', label: 'Bảng điều khiển', icon: 'target', href: '/quan-tri', exact: true },
  ] },
  { group: 'Người dùng', items: [
    { key: 'users', label: 'Tài khoản & vai trò', icon: 'user', href: '/quan-tri/tai-khoan' },
  ] },
  { group: 'Nội dung', items: [
    { key: 'decks', label: 'Bộ mẫu & thẻ', icon: 'decks', href: '/quan-tri/bo-mau' },
    { key: 'topics', label: 'Chủ đề & nhãn', icon: 'tag', href: '/quan-tri/chu-de' },
    { key: 'publish', label: 'Duyệt công khai', icon: 'check', href: '/quan-tri/duyet-cong-khai', badge: 'publish' },
    { key: 'reports', label: 'Báo cáo vi phạm', icon: 'alert', href: '/quan-tri/bao-cao', badge: 'reports', tone: 'red' },
  ] },
  { group: 'Kinh doanh', items: [
    { key: 'payments', label: 'Thanh toán & gói', icon: 'file', href: '/quan-tri/thanh-toan' },
    { key: 'revenue', label: 'Doanh thu', icon: 'chart', href: '/quan-tri/doanh-thu' },
  ] },
  { group: 'Hệ thống', items: [
    { key: 'services', label: 'Dịch vụ & hạn mức', icon: 'settings', href: '/quan-tri/dich-vu' },
    { key: 'announcements', label: 'Thông báo hệ thống', icon: 'bell', href: '/quan-tri/thong-bao' },
    { key: 'audit', label: 'Nhật ký thao tác', icon: 'clock', href: '/quan-tri/nhat-ky' },
  ] },
];

const ENV = process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'production' ? '' : 'DEV');
const isActive = (pathname, href, exact) => pathname === href || (!exact && pathname.startsWith(href + '/'));
const initials = name => (name || 'A').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();

function usePendingPublishCount() {
  const { data } = useQuery({
    queryKey: ['publish-requests', 'admin', 'CHO_DUYET', 'badge'],
    queryFn: () => listPublishRequests(apiFetch, { admin: true, trangThai: 'CHO_DUYET', page: 0, size: 1 }),
    staleTime: 60_000,
  });
  return data?.totalElements || 0;
}

function usePendingReportCount() {
  const { data } = useQuery({
    queryKey: ['admin-reports', 'CHO_XU_LY', '', 'count'],
    queryFn: () => listReports(apiFetch, { trangThai: 'CHO_XU_LY', size: 1 }),
    staleTime: 30_000,
  });
  return data?.totalElements || 0;
}

function SideNav({ pathname, badges }) {
  return (
    <nav className="adm-nav" aria-label="Điều hướng quản trị">
      {ADMIN_NAV.map(group => (
        <div className="adm-group" key={group.group}>
          <p className="adm-group-title">{group.group}</p>
          {group.items.map(item => {
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link key={item.key} href={item.href} className="adm-link" aria-current={isActive(pathname, item.href, item.exact) ? 'page' : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {count > 0 && <span className={`adm-badge${item.tone === 'red' ? ' adm-badge-red' : ''}`} aria-label={`${count} đang chờ`}>{count > 99 ? '99+' : count}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children, user }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: avatar } = useAvatar(user);
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === pathname;
  const setOpen = value => setOpenAt(value ? pathname : null);
  const publish = usePendingPublishCount();
  const reports = usePendingReportCount();
  const handleLogout = () => logout(queryClient).catch(error => toast(error.message, { variant: 'error' }));

  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => { if (event.key === 'Escape') setOpenAt(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = ADMIN_NAV.flatMap(group => group.items.map(item => ({ ...item, group: group.group }))).find(item => isActive(pathname, item.href, item.exact));
  const name = user?.tenHienThi || 'Quản trị viên';

  return (
    <div className="adm" data-open={open || undefined}>
      <aside className="adm-side" id="adm-side">
        <Link href="/quan-tri" className="adm-brand">
          <span className="adm-brand-mark" aria-hidden="true">VL</span>
          <span>VocabLearning<small>Admin Console</small></span>
        </Link>
        {ENV && <p className="adm-env"><span>Môi trường</span><b>{ENV}</b></p>}
        <SideNav pathname={pathname} badges={{ publish, reports }} />
        <div className="adm-side-foot">
          <Link href="/hom-nay" className="adm-link adm-back"><Icon name="arrow-left" /><span>Về trang học</span></Link>
          <div className="adm-me">
            <span className="adm-avatar">{avatar?.downloadUrl ? <img src={avatar.downloadUrl} alt="" /> : initials(name)}</span>
            <span className="adm-me-text"><b>{name}</b><small>{user?.email || 'ADMIN'}</small></span>
            <button type="button" className="adm-icon-btn adm-icon-quiet" aria-label="Đăng xuất" title="Đăng xuất" onClick={handleLogout}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>
      <button type="button" className="adm-scrim" aria-label="Đóng điều hướng" tabIndex={-1} onClick={() => setOpen(false)} />

      <div className="adm-main">
        <header className="adm-top">
          <button type="button" className="adm-icon-btn adm-menu" aria-label="Mở điều hướng" aria-controls="adm-side" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <nav className="adm-crumb" aria-label="Đường dẫn">
            <span>Quản trị</span>
            {current && <><span aria-hidden="true">/</span><span>{current.group}</span><span aria-hidden="true">/</span><b aria-current="page">{current.label}</b></>}
          </nav>
          <div className="adm-top-actions">
            {publish > 0 && (
              <Link href="/quan-tri/duyet-cong-khai" className="adm-pending">
                <Icon name="alert" /><span><b>{publish}</b> yêu cầu chờ duyệt</span>
              </Link>
            )}
            <ThemeToggle />
            {user && <NotificationBell key={user.id} userId={user.id} />}
          </div>
        </header>
        <main className="adm-content" id="main">{children}</main>
      </div>
    </div>
  );
}
