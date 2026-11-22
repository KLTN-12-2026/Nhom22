'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Icon, useToast } from '@/components/ui';
import { useAvatar } from '@/hooks/useAvatar';
import { useEventStream } from '@/hooks/useEventStream';
import { apiFetch, logout } from '@/lib/api-client';
import '@/styles/admin.css';

export const ADMIN_NAV = [
  { group: 'Hằng ngày', items: [
    { key: 'dashboard', label: 'Sổ trực ban', href: '/quan-tri', exact: true },
    { key: 'publish', label: 'Duyệt công khai', href: '/quan-tri/duyet-cong-khai', badge: 'publish' },
    { key: 'reports', label: 'Báo cáo vi phạm', href: '/quan-tri/bao-cao', badge: 'reports', tone: 'red' },
  ] },
  { group: 'Hồ sơ', items: [
    { key: 'users', label: 'Tài khoản và vai trò', href: '/quan-tri/tai-khoan' },
    { key: 'decks', label: 'Bộ mẫu và thẻ', href: '/quan-tri/bo-mau' },
    { key: 'topics', label: 'Chủ đề và nhãn', href: '/quan-tri/chu-de' },
    { key: 'motivation', label: 'Huy hiệu và thử thách', href: '/quan-tri/dong-luc' },
  ] },
  { group: 'Sổ sách', items: [
    { key: 'payments', label: 'Thanh toán và gói', href: '/quan-tri/thanh-toan', badge: 'payments', tone: 'red' },
    { key: 'revenue', label: 'Doanh thu', href: '/quan-tri/doanh-thu' },
    { key: 'services', label: 'Dịch vụ và hạn mức', href: '/quan-tri/dich-vu' },
    { key: 'announcements', label: 'Thông báo hệ thống', href: '/quan-tri/thong-bao' },
    { key: 'audit', label: 'Nhật ký thao tác', href: '/quan-tri/nhat-ky' },
  ] },
];

const ENV = process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'production' ? '' : 'DEV');
const isActive = (pathname, href, exact) => pathname === href || (!exact && pathname.startsWith(href + '/'));
const initials = name => (name || 'A').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();

function useAdminQueue() {
  const { data } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: () => apiFetch('/api/v1/admin/dashboard/queue'),
    staleTime: 30_000,
    refetchInterval: 300_000,
  });
  return {
    publish: data?.congKhaiChoDuyet || 0,
    reports: data?.baoCaoChoXuLy || 0,
    payments: data?.giaoDichTreo || 0,
  };
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
                <span className="adm-bub" aria-hidden="true" />
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
  const badges = useAdminQueue();
  const { publish } = badges;
  useEventStream(user?.id);
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
          <span>Phòng quản trị<small>VocabLearning</small></span>
        </Link>
        {ENV && <p className="adm-env"><span>Môi trường chạy</span><b>{ENV}</b></p>}
        <SideNav pathname={pathname} badges={badges} />
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
            <span>Phòng quản trị</span>
            {current && <><span aria-hidden="true">/</span><b aria-current="page">{current.label}</b></>}
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
