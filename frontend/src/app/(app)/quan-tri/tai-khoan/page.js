'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon, useToast } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill, Who } from '@/components/admin/AdminPageHead';
import { useAdminConfirm } from '@/components/admin/AdminConfirm';
import { UserDetailDrawer } from '@/components/admin/UserDetailDrawer';
import { apiFetch, resetCsrf } from '@/lib/api-client';
import { useMe } from '@/hooks/useMe';
import { relativeTime } from '@/lib/admin-dashboard.mjs';
import { fetchAllPages, runSequential, setParams } from '@/lib/admin-table.mjs';

const STATUS = {
  HOAT_DONG: ['Hoạt động', 'ok'],
  BI_KHOA: ['Bị khóa', 'bad'],
  CHUA_XAC_THUC: ['Chưa xác thực', 'warn'],
  DANG_XOA: ['Đang xóa', 'mute'],
};
const PAGE_SIZE = 20;
const fullTime = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');
const isAdmin = user => (user.vaiTro || []).includes('ADMIN');

function usersUrl({ q, trangThai, vaiTro, page, size }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (q) params.set('q', q);
  if (trangThai) params.set('trangThai', trangThai);
  if (vaiTro) params.set('vaiTro', vaiTro);
  return `/api/v1/admin/users?${params}`;
}

function UsersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const client = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useMe();
  const { confirm, dialog } = useAdminConfirm();
  const [busy, setBusy] = useState(false);

  const q = (params.get('q') || '').trim().slice(0, 100);
  const rawStatus = params.get('trangThai') || '';
  const trangThai = Object.hasOwn(STATUS, rawStatus) ? rawStatus : '';
  const rawRole = params.get('vaiTro') || '';
  const vaiTro = ['ADMIN', 'USER'].includes(rawRole) ? rawRole : '';
  const rawPage = Number(params.get('page') || 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const openId = params.get('nguoi') || null;
  const [search, setSearch] = useState(q);
  const go = (changes, resetPage = true) => router.replace(`${pathname}${setParams(params, changes, { resetPage })}`, { scroll: false });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', q, trangThai, vaiTro, page],
    queryFn: () => apiFetch(usersUrl({ q, trangThai, vaiTro, page, size: PAGE_SIZE })),
    placeholderData: previous => previous,
  });
  const rows = data?.items || [];

  const setStatus = (user, next, lyDo) => apiFetch(`/api/v1/admin/users/${user.id}/status`, { method: 'PATCH', body: JSON.stringify({ trangThai: next, lyDo }) });
  const setRoles = (user, roles, lyDo) => apiFetch(`/api/v1/admin/users/${user.id}/roles`, { method: 'PUT', body: JSON.stringify({ vaiTro: roles, lyDo }) });

  async function act(kind, user) {
    if (busy) return;
    const self = user.id === me?.id;
    const options = {
      lock: { title: 'Khóa tài khoản', message: `${user.tenHienThi} sẽ bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi mở khóa.`, confirmLabel: 'Khóa tài khoản', tone: 'danger' },
      unlock: { title: 'Mở khóa tài khoản', message: `${user.tenHienThi} sẽ đăng nhập lại được.`, confirmLabel: 'Mở khóa' },
      grant: { title: 'Cấp quyền quản trị', message: `${user.tenHienThi} sẽ vào được toàn bộ trang quản trị.`, confirmLabel: 'Cấp quyền' },
      revoke: { title: 'Thu quyền quản trị', message: self ? 'Bạn đang thu quyền của chính mình. Sau khi lưu, bạn sẽ rời trang quản trị.' : `${user.tenHienThi} sẽ không vào được trang quản trị nữa.`, confirmLabel: 'Thu quyền', tone: 'danger' },
    }[kind];
    const answer = await confirm({ ...options, reason: true });
    if (!answer) return;
    setBusy(true);
    try {
      let result;
      if (kind === 'lock') result = await setStatus(user, 'BI_KHOA', answer.lyDo);
      if (kind === 'unlock') result = await setStatus(user, 'HOAT_DONG', answer.lyDo);
      if (kind === 'grant') result = await setRoles(user, ['USER', 'ADMIN'], answer.lyDo);
      if (kind === 'revoke') result = await setRoles(user, ['USER'], answer.lyDo);
      if (result?.banThanMatQuyen || (kind === 'revoke' && self)) {
        resetCsrf();
        client.clear();
        window.location.assign('/dang-nhap');
        return;
      }
      toast(`${options.confirmLabel}: ${user.tenHienThi}.`, { variant: 'success' });
    } catch (err) {
      toast(err.message, { variant: 'error' });
    } finally {
      setBusy(false);
      // Session revocation can fail after the account change has committed.
      for (const queryKey of [['admin-users'], ['admin-audit'], ['admin-dashboard'], ['admin-user-detail', user.id], ['admin-user-audit', user.id]]) {
        void client.invalidateQueries({ queryKey });
      }
    }
  }

  async function bulk(kind, selected, clear) {
    if (busy) return;
    const targets = selected.filter(user => (kind === 'lock' ? user.trangThai === 'HOAT_DONG' && user.id !== me?.id : user.trangThai === 'BI_KHOA'));
    if (!targets.length) {
      toast(kind === 'lock' ? 'Không có tài khoản đang hoạt động nào để khóa (không tự khóa chính mình).' : 'Không có tài khoản bị khóa nào trong các dòng đã chọn.', { variant: 'error' });
      return;
    }
    const answer = await confirm({
      title: kind === 'lock' ? `Khóa ${targets.length} tài khoản` : `Mở khóa ${targets.length} tài khoản`,
      message: kind === 'lock' ? 'Các tài khoản sẽ bị đăng xuất khỏi mọi thiết bị. Dùng cùng một lý do cho tất cả.' : 'Dùng cùng một lý do cho tất cả.',
      items: targets.map(user => `${user.tenHienThi} · ${user.email}`),
      confirmLabel: kind === 'lock' ? 'Khóa tất cả' : 'Mở khóa tất cả',
      tone: kind === 'lock' ? 'danger' : undefined,
      reason: true,
    });
    if (!answer) return;
    setBusy(true);
    const result = await runSequential(targets, user => setStatus(user, kind === 'lock' ? 'BI_KHOA' : 'HOAT_DONG', answer.lyDo));
    setBusy(false);
    clear();
    client.invalidateQueries({ queryKey: ['admin-users'] });
    client.invalidateQueries({ queryKey: ['admin-dashboard'] });
    client.invalidateQueries({ queryKey: ['admin-audit'] });
    client.invalidateQueries({ queryKey: ['admin-user-detail'] });
    client.invalidateQueries({ queryKey: ['admin-user-audit'] });
    if (result.failed.length) {
      toast(`Xong ${result.ok.length}/${targets.length}. Lỗi: ${result.failed.map(f => `${f.item.tenHienThi} (${f.error.message})`).join('; ')}`, { variant: 'error' });
    } else {
      toast(`Đã ${kind === 'lock' ? 'khóa' : 'mở khóa'} ${result.ok.length} tài khoản.`, { variant: 'success' });
    }
  }

  const columns = [
    { key: 'user', header: 'Người dùng', sortValue: u => u.tenHienThi, csv: u => u.tenHienThi, render: u => <Who name={<>{u.tenHienThi}{u.id === me?.id && <span className="adm-muted"> (bạn)</span>}</>} sub={u.email} initials={(u.tenHienThi || u.email).trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase()} /> },
    { key: 'email', header: 'Email', csv: u => u.email, render: null, hidden: true },
    { key: 'role', header: 'Vai trò', sortValue: u => (isAdmin(u) ? 0 : 1), csv: u => (isAdmin(u) ? 'ADMIN' : 'USER'), render: u => (isAdmin(u) ? <Pill tone="acc">Quản trị</Pill> : <Pill>Người học</Pill>) },
    { key: 'status', header: 'Trạng thái', sortValue: u => STATUS[u.trangThai]?.[0], csv: u => STATUS[u.trangThai]?.[0] || u.trangThai, render: u => { const [label, tone] = STATUS[u.trangThai] || [u.trangThai, 'mute']; return <Pill tone={tone}>{label}</Pill>; } },
    { key: 'decks', header: 'Bộ thẻ', align: 'right', sortValue: u => u.soBoThe, csv: u => u.soBoThe, render: u => u.soBoThe.toLocaleString('vi-VN') },
    { key: 'login', header: 'Đăng nhập cuối', nowrap: true, sortValue: u => (u.dangNhapCuoiAt ? Date.parse(u.dangNhapCuoiAt) : null), csv: u => fullTime(u.dangNhapCuoiAt), render: u => (u.dangNhapCuoiAt ? <span title={fullTime(u.dangNhapCuoiAt)}>{relativeTime(u.dangNhapCuoiAt)}</span> : <span className="adm-muted">Chưa đăng nhập</span>) },
    { key: 'created', header: 'Tạo lúc', nowrap: true, sortValue: u => Date.parse(u.createdAt), csv: u => fullTime(u.createdAt), render: u => <span title={fullTime(u.createdAt)}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span> },
    { key: 'actions', header: 'Thao tác', srHeader: true, render: u => (
      <div className="adm-row-actions">
        {u.trangThai === 'HOAT_DONG' && u.id !== me?.id && <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => act('lock', u)}><Icon name="lock" />Khóa</button>}
        {u.trangThai === 'BI_KHOA' && <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => act('unlock', u)}>Mở khóa</button>}
        {isAdmin(u) ? <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => act('revoke', u)}>Thu quyền</button>
          : u.trangThai === 'HOAT_DONG' && <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => act('grant', u)}><Icon name="shield" />Cấp quyền</button>}
        <Link className="adm-btn adm-btn-sm" href={`/quan-tri/nhat-ky?loai=NGUOI_DUNG&q=${encodeURIComponent(u.email)}`} title="Nhật ký của tài khoản" aria-label={`Nhật ký của ${u.tenHienThi}`}><Icon name="clock" /></Link>
      </div>
    ) },
  ];
  const visible = columns.filter(column => !column.hidden);

  const toolbar = (
    <>
      <form role="search" onSubmit={event => { event.preventDefault(); go({ q: search.trim() }); }} style={{ display: 'contents' }}>
        <label className="sr-only" htmlFor="user-q">Tìm theo email hoặc tên</label>
        <input id="user-q" className="adm-input" type="search" placeholder="Tìm email hoặc tên, Enter để tìm" value={search} onChange={event => setSearch(event.target.value)} />
      </form>
      <label className="sr-only" htmlFor="user-status">Trạng thái</label>
      <select id="user-status" className="adm-select" value={trangThai} onChange={event => go({ trangThai: event.target.value })}>
        <option value="">Mọi trạng thái</option>
        {Object.entries(STATUS).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="sr-only" htmlFor="user-role">Vai trò</label>
      <select id="user-role" className="adm-select" value={vaiTro} onChange={event => go({ vaiTro: event.target.value })}>
        <option value="">Mọi vai trò</option>
        <option value="ADMIN">Quản trị viên</option>
        <option value="USER">Người học</option>
      </select>
      {(q || trangThai || vaiTro) && <button type="button" className="adm-btn" onClick={() => { setSearch(''); router.replace(pathname, { scroll: false }); }}>Xóa lọc</button>}
    </>
  );

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Tài khoản & vai trò"
        meta={data ? data.totalElements.toLocaleString('vi-VN') : null}
        description="Khóa, mở khóa, cấp hoặc thu quyền quản trị. Mỗi thao tác cần lý do và được ghi nhật ký. Không thể tự khóa mình, và luôn phải còn ít nhất một quản trị viên hoạt động."
        actions={<button type="button" className="adm-btn" onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" />{isFetching ? 'Đang tải…' : 'Làm mới'}</button>}
      />
      <section className="adm-card">
        <AdminTable
          caption="Danh sách tài khoản"
          columns={visible}
          rows={rows}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          toolbar={toolbar}
          selectable
          isSelectable={u => u.id !== me?.id}
          rowLabel={u => u.tenHienThi}
          onRowClick={u => go({ nguoi: u.id }, false)}
          bulkActions={(selected, clear) => (
            <>
              <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => bulk('lock', selected, clear)}><Icon name="lock" />Khóa</button>
              <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => bulk('unlock', selected, clear)}>Mở khóa</button>
            </>
          )}
          emptyTitle="Không tìm thấy tài khoản"
          emptyText="Thử bỏ bớt bộ lọc hoặc tìm bằng một phần email."
          pagination={data ? { page, size: PAGE_SIZE, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: value => go({ page: value || null }) } : null}
          exportCsv={{
            filename: 'tai-khoan.csv',
            columns,
            fetchAll: () => fetchAllPages((p, size) => apiFetch(usersUrl({ q, trangThai, vaiTro, page: p, size }))),
          }}
        />
      </section>
      <UserDetailDrawer userId={openId} me={me} busy={busy} onAction={act} onClose={() => go({ nguoi: null }, false)} />
      {dialog}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="adm-empty" role="status">Đang tải…</div>}>
      <UsersContent />
    </Suspense>
  );
}
