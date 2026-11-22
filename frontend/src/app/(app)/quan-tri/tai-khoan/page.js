'use client';

import { Suspense, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, resetCsrf } from '@/lib/api-client';
import { Button, ErrorState, Input, Modal, Pagination, Select, Textarea, useToast } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import styles from './page.module.css';

const STATUS = {
  HOAT_DONG: { label: 'Đang hoạt động', className: '' },
  BI_KHOA: { label: 'Bị khóa', className: 'stamp-danger' },
  CHUA_XAC_THUC: { label: 'Chưa xác thực', className: 'stamp-warning' },
  DANG_XOA: { label: 'Đang xóa', className: 'stamp-quiet' },
};
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({ value, label }));
const ROLE_OPTIONS = [{ value: 'ADMIN', label: 'Quản trị viên' }, { value: 'USER', label: 'Người học' }];
const ACTIONS = {
  lock: {
    title: name => `Khóa tài khoản ${name}?`,
    message: 'Người này sẽ bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho đến khi được mở khóa. Dữ liệu học vẫn giữ nguyên.',
    label: 'Khóa tài khoản', danger: true, endpoint: 'status', method: 'PATCH',
    body: { trangThai: 'BI_KHOA' }, success: 'Đã khóa tài khoản',
  },
  unlock: {
    title: name => `Mở khóa tài khoản ${name}?`,
    message: 'Người này đăng nhập lại được ngay.',
    label: 'Mở khóa', endpoint: 'status', method: 'PATCH',
    body: { trangThai: 'HOAT_DONG' }, success: 'Đã mở khóa tài khoản',
  },
  grant: {
    title: name => `Cấp quyền quản trị cho ${name}?`,
    message: 'Người này sẽ quản lý được tài khoản, bộ mẫu và xem nhật ký quản trị. Các phiên đăng nhập hiện tại sẽ bị hủy để cập nhật quyền.',
    label: 'Cấp quyền quản trị', endpoint: 'roles', method: 'PUT',
    body: { vaiTro: ['USER', 'ADMIN'] }, success: 'Đã cấp quyền quản trị',
  },
  revoke: {
    title: name => `Thu quyền quản trị của ${name}?`,
    message: 'Người này vẫn học bình thường nhưng không vào được trang quản trị. Các phiên đăng nhập hiện tại sẽ bị hủy để cập nhật quyền.',
    label: 'Thu quyền quản trị', danger: true, endpoint: 'roles', method: 'PUT',
    body: { vaiTro: ['USER'] }, success: 'Đã thu quyền quản trị',
  },
};

function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime ? date.toLocaleString('vi-VN') : date.toLocaleDateString('vi-VN');
}

function UsersLoading() {
  return (
    <div role="status" aria-label="Đang tải danh sách tài khoản" className="skeleton">
      <div className="sk sk-row" /><div className="sk sk-row" /><div className="sk sk-row" />
    </div>
  );
}

function UsersFilters({ initialQ, initialStatus, initialRole, onApply }) {
  const [q, setQ] = useState(initialQ);
  const [trangThai, setTrangThai] = useState(initialStatus);
  const [vaiTro, setVaiTro] = useState(initialRole);

  return (
    <form role="search" aria-label="Lọc tài khoản" className={styles.filterBar} onSubmit={event => {
      event.preventDefault();
      onApply({ q, trangThai, vaiTro });
    }}>
      <Input type="search" name="q" label="Tìm theo email hoặc tên" maxLength={100} autoComplete="off"
        placeholder="Ví dụ: an@vocab.local" value={q} onChange={event => setQ(event.target.value)} />
      <Select name="trangThai" label="Trạng thái" placeholder="Tất cả" options={STATUS_OPTIONS}
        value={trangThai} onChange={event => {
          setTrangThai(event.target.value);
          onApply({ q, trangThai: event.target.value, vaiTro });
        }} />
      <Select name="vaiTro" label="Vai trò" placeholder="Tất cả" options={ROLE_OPTIONS}
        value={vaiTro} onChange={event => {
          setVaiTro(event.target.value);
          onApply({ q, trangThai, vaiTro: event.target.value });
        }} />
      <Button type="submit">Tìm</Button>
    </form>
  );
}

function ReasonDialog({ selection, me, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const formId = useId();
  const reasonId = useId();
  const hintId = useId();
  const queryClient = useQueryClient();
  const config = ACTIONS[selection.kind];
  const isSelfRevoke = selection.kind === 'revoke' && selection.user.id === me.id;
  const mutation = useMutation({
    mutationFn: lyDo => apiFetch(`/api/v1/admin/users/${encodeURIComponent(selection.user.id)}/${config.endpoint}`, {
      method: config.method,
      body: JSON.stringify({ ...config.body, lyDo }),
    }),
    onSuccess: result => onSuccess(result, config, isSelfRevoke),
    // A session-revocation failure can happen after the account change commits.
    onError: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });
  const serverReasonError = mutation.error?.fieldErrors?.find(field => field.field === 'lyDo')?.message;

  function submit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    const lyDo = reason.trim();
    if (lyDo.length < 10 || lyDo.length > 500) {
      setReasonError('Lý do cần từ 10 đến 500 ký tự sau khi bỏ khoảng trắng ở đầu và cuối.');
      return;
    }
    setReasonError('');
    mutation.mutate(lyDo);
  }

  return (
    <Modal isOpen onClose={onClose} loading={mutation.isPending} size="sm"
      title={config.title(selection.user.tenHienThi || selection.user.email)}
      footer={<>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>Hủy</Button>
        <Button type="submit" form={formId} variant={config.danger ? 'danger-solid' : 'primary'} loading={mutation.isPending}>
          {config.label}
        </Button>
      </>}>
      <form id={formId} noValidate onSubmit={submit} className={styles.reasonForm}>
        <p>{isSelfRevoke
          ? 'Bạn đang thu quyền của chính mình. Sau khi lưu, bạn sẽ bị đăng xuất và không còn truy cập được các trang quản trị.'
          : config.message}</p>
        <p className={styles.dialogEmail}>{selection.user.email}</p>
        <Textarea id={reasonId} label="Lý do thực hiện" required autoFocus maxLength={500} rows={4}
          value={reason} disabled={mutation.isPending} placeholder="Nhập lý do để lưu vào nhật ký quản trị…"
          error={reasonError || serverReasonError}
          aria-describedby={reasonError || serverReasonError ? `${reasonId}-error` : hintId}
          hint={<span id={hintId}>10–500 ký tự, được ghi vào nhật ký. {reason.trim().length}/500</span>}
          onChange={event => {
            setReason(event.target.value);
            setReasonError('');
            mutation.reset();
          }} />
        {mutation.isError && !serverReasonError && (
          <p className="notice notice-danger" role="alert">{mutation.error.message || 'Chưa lưu được thay đổi. Vui lòng thử lại.'}</p>
        )}
      </form>
    </Modal>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { toast } = useToast();
  const [selection, setSelection] = useState(null);
  const q = (searchParams.get('q') || '').trim().slice(0, 100);
  const rawStatus = searchParams.get('trangThai') || '';
  const trangThai = Object.hasOwn(STATUS, rawStatus) ? rawStatus : '';
  const rawRole = searchParams.get('vaiTro') || '';
  const vaiTro = ROLE_OPTIONS.some(option => option.value === rawRole) ? rawRole : '';
  const rawPage = Number(searchParams.get('page') || 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const isAdmin = me?.vaiTro?.includes('ADMIN');

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', q, trangThai, vaiTro, page],
    enabled: !!isAdmin,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), size: '10' });
      if (q) params.set('q', q);
      if (trangThai) params.set('trangThai', trangThai);
      if (vaiTro) params.set('vaiTro', vaiTro);
      return apiFetch(`/api/v1/admin/users?${params}`, { signal });
    },
  });

  function navigate(filters, nextPage = 0) {
    const params = new URLSearchParams();
    if (filters.q?.trim()) params.set('q', filters.q.trim());
    if (filters.trangThai) params.set('trangThai', filters.trangThai);
    if (filters.vaiTro) params.set('vaiTro', filters.vaiTro);
    if (nextPage) params.set('page', String(nextPage));
    router.push(`/quan-tri/tai-khoan${params.size ? `?${params}` : ''}`, { scroll: false });
  }

  function actionSucceeded(result, config, isSelfRevoke) {
    if (result?.banThanMatQuyen || isSelfRevoke) {
      resetCsrf();
      queryClient.clear();
      window.location.assign('/dang-nhap');
      return;
    }
    setSelection(null);
    toast(`${config.success}${result?.soPhienDaHuy ? `, hủy ${result.soPhienDaHuy} phiên đăng nhập` : ''}`, { variant: 'success' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
  }

  if (!isAdmin) return null;
  const users = data?.items || [];

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Quản trị</span><span>{data ? `${data.totalElements} tài khoản` : '—'}</span></div>
          <h1 id="page-title">Tài khoản và vai trò</h1>
          <p>Tìm người dùng, khóa hoặc mở khóa tài khoản, cấp hoặc thu quyền quản trị. Mỗi thao tác cần lý do và được ghi vào nhật ký.</p>
        </div>

        <UsersFilters key={searchParams.toString()} initialQ={q} initialStatus={trangThai} initialRole={vaiTro} onApply={navigate} />

        <div aria-live="polite" aria-busy={isFetching}>
          {isPending ? <UsersLoading /> : isError ? (
            <ErrorState title="Chưa tải được danh sách tài khoản" description={error?.message} onRetry={refetch} />
          ) : users.length ? (
            <>
              <p className={styles.resultLine}>{data.totalElements} tài khoản khớp bộ lọc, mới tạo trước</p>
              <ol className="answer-list" aria-label="Danh sách tài khoản" start={page * data.size + 1}>
                {users.map((user, index) => {
                  const status = STATUS[user.trangThai] || { label: user.trangThai, className: 'stamp-quiet' };
                  const admin = user.vaiTro?.includes('ADMIN');
                  const self = user.id === me.id;
                  return (
                    <li key={user.id} className={`answer-row ${styles.userRow}`}>
                      <span className="answer-no" aria-hidden="true">{page * data.size + index + 1}</span>
                      <div className="answer-main">
                        <div className={styles.userHead}>
                          <span className={`avatar ${styles.avatar}`} aria-hidden="true">{(user.tenHienThi || user.email || '?').charAt(0).toLocaleUpperCase('vi-VN')}</span>
                          <div className={styles.identity}>
                            <div className={styles.userName}>{user.tenHienThi || 'Chưa đặt tên'}{self && <span className={styles.self}> (bạn)</span>}</div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                        <div className="answer-meta">
                          <span className={`stamp ${status.className}`}>{status.label}</span>
                          {admin ? <strong>Quản trị viên</strong> : <span>Người học</span>}
                          <span>{user.soBoThe} bộ thẻ</span>
                          <span>Tạo {formatDate(user.createdAt)}</span>
                          <span>{user.dangNhapCuoiAt ? `Đăng nhập ${formatDate(user.dangNhapCuoiAt, true)}` : 'Chưa đăng nhập'}</span>
                        </div>
                        <div className={styles.userTools} role="group" aria-label={`Thao tác với ${user.tenHienThi || user.email}`}>
                          {user.trangThai === 'HOAT_DONG' && (
                            <Button variant="ghost" className={styles.dangerText} disabled={self}
                              title={self ? 'Không tự khóa tài khoản của mình' : undefined}
                              onClick={() => setSelection({ kind: 'lock', user })}>Khóa tài khoản</Button>
                          )}
                          {user.trangThai === 'BI_KHOA' && (
                            <Button variant="ghost" disabled={self} onClick={() => setSelection({ kind: 'unlock', user })}>Mở khóa</Button>
                          )}
                          {admin ? (
                            <Button variant="ghost" onClick={() => setSelection({ kind: 'revoke', user })}>Thu quyền quản trị</Button>
                          ) : user.trangThai === 'HOAT_DONG' && (
                            <Button variant="ghost" onClick={() => setSelection({ kind: 'grant', user })}>Cấp quyền quản trị</Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className={styles.pagerWrap}>
                <Pagination page={page + 1} totalPages={data.totalPages} onPageChange={value => navigate({ q, trangThai, vaiTro }, value - 1)} />
              </div>
            </>
          ) : (
            <div className="empty">
              <h2>Không tìm thấy tài khoản</h2>
              <p>Thử bỏ bớt bộ lọc hoặc tìm bằng một phần email.</p>
              <Button variant="secondary" onClick={() => navigate({})}>Xóa bộ lọc</Button>
              {page > 0 && <Button variant="ghost" onClick={() => navigate({ q, trangThai, vaiTro })}>Về trang đầu</Button>}
            </div>
          )}
        </div>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="rules-title">
          <h2 className="panel-title" id="rules-title">Quy tắc</h2>
          <ul className={styles.rules}>
            <li>Khóa tài khoản sẽ hủy mọi phiên đăng nhập của người đó ngay lập tức.</li>
            <li>Không tự khóa tài khoản của mình.</li>
            <li>Luôn còn ít nhất một quản trị viên đang hoạt động: không khóa và không thu quyền người cuối cùng.</li>
            <li>Tài khoản chưa xác thực email phải tự xác thực qua thư, quản trị không mở thay.</li>
            <li>Trang này chỉ hiện thông tin cần để quản lý tài khoản, không hiện nội dung học riêng tư.</li>
          </ul>
        </section>
        <section className="panel" aria-labelledby="log-title">
          <h2 className="panel-title" id="log-title">Nhật ký</h2>
          <p className="small muted">Xem ai đã khóa, mở khóa hay đổi vai trò, lúc nào và vì sao.</p>
          <Link className={`btn btn-quiet ${styles.logLink}`} href="/quan-tri/nhat-ky?loai=NGUOI_DUNG">Mở nhật ký tài khoản</Link>
        </section>
      </aside>

      {selection && <ReasonDialog selection={selection} me={me} onClose={() => setSelection(null)} onSuccess={actionSucceeded} />}
    </div>
  );
}

export default function AdminUsersPage() {
  return <Suspense fallback={<div className="page sheet"><UsersLoading /></div>}><AdminUsersContent /></Suspense>;
}
