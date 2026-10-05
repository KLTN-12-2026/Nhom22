'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

const STATUS = {
  HOAT_DONG: { label: 'Đang hoạt động', className: '' },
  BI_KHOA: { label: 'Bị khóa', className: 'var(--color-danger-bg)' },
  CHUA_XAC_THUC: { label: 'Chưa xác thực', className: 'var(--color-warning-bg)' },
  DANG_XOA: { label: 'Đang xóa', className: 'var(--color-ink-3)' }
};

const STATUS_TEXT_COLOR = {
  HOAT_DONG: 'var(--color-ink)',
  BI_KHOA: 'var(--color-danger-text)',
  CHUA_XAC_THUC: 'var(--color-warning-text)',
  DANG_XOA: 'white'
};

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { me } = useMe();

  const defaultQ = searchParams.get('q') || '';
  const defaultStatus = searchParams.get('trangThai') || '';
  const defaultRole = searchParams.get('vaiTro') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [q, setQ] = useState(defaultQ);
  const [trangThai, setTrangThai] = useState(defaultStatus);
  const [vaiTro, setVaiTro] = useState(defaultRole);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, trangThai, vaiTro, page],
    queryFn: () => apiFetch(`/api/v1/admin/users?q=${encodeURIComponent(q)}&trangThai=${trangThai}&vaiTro=${vaiTro}&page=${page}&size=20`)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries(['admin-users'])
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/v1/admin/users/${id}/roles`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries(['admin-users']);
      if (vars.isSelfRevoke) {
        window.location.href = '/hom-nay';
      }
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q); else params.delete('q');
    if (trangThai) params.set('trangThai', trangThai); else params.delete('trangThai');
    if (vaiTro) params.set('vaiTro', vaiTro); else params.delete('vaiTro');
    params.set('page', '0');
    router.push(`/quan-tri/tai-khoan?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    setQ('');
    setTrangThai('');
    setVaiTro('');
    router.push('/quan-tri/tai-khoan', { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/quan-tri/tai-khoan?${params.toString()}`, { scroll: false });
  };

  const promptReason = () => {
    const reason = window.prompt('Nhập lý do thực hiện thao tác (bắt buộc):');
    return reason?.trim();
  };

  const handleLock = (user) => {
    if (user.id === me?.id) return alert('Không tự khóa tài khoản của mình');
    if (!window.confirm(`Khóa tài khoản ${user.tenHienThi}? Người này sẽ bị đăng xuất khỏi mọi thiết bị.`)) return;
    const lyDo = promptReason();
    if (lyDo) statusMutation.mutate({ id: user.id, body: { trangThai: 'BI_KHOA', lyDo } });
  };

  const handleUnlock = (user) => {
    if (!window.confirm(`Mở khóa tài khoản ${user.tenHienThi}?`)) return;
    const lyDo = promptReason();
    if (lyDo) statusMutation.mutate({ id: user.id, body: { trangThai: 'HOAT_DONG', lyDo } });
  };

  const handleGrant = (user) => {
    if (!window.confirm(`Cấp quyền quản trị cho ${user.tenHienThi}?`)) return;
    const lyDo = promptReason();
    if (lyDo) roleMutation.mutate({ id: user.id, body: { vaiTro: ['USER', 'ADMIN'], lyDo } });
  };

  const handleRevoke = (user) => {
    const isSelf = user.id === me?.id;
    const msg = isSelf 
      ? 'Bạn đang thu quyền của chính mình. Sau khi lưu, bạn sẽ không vào được trang quản trị nữa. Tiếp tục?' 
      : `Thu quyền quản trị của ${user.tenHienThi}?`;
    if (!window.confirm(msg)) return;
    const lyDo = promptReason();
    if (lyDo) roleMutation.mutate({ id: user.id, body: { vaiTro: ['USER'], lyDo }, isSelfRevoke: isSelf });
  };

  if (!me?.vaiTro?.includes('ADMIN')) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Không có quyền truy cập</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Quản trị</span>
            <span>{data?.totalElements !== undefined ? `${data.totalElements} tài khoản` : '—'}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Tài khoản và vai trò</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Tìm người dùng, khóa hoặc mở khóa tài khoản, cấp hoặc thu quyền quản trị. Mỗi thao tác cần lý do và được ghi vào nhật ký.</p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Tìm theo email hoặc tên</label>
              <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Ví dụ: an@vocab.local" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Trạng thái</label>
              <select value={trangThai} onChange={e => setTrangThai(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <option value="">Tất cả</option>
                <option value="HOAT_DONG">Đang hoạt động</option>
                <option value="BI_KHOA">Bị khóa</option>
                <option value="CHUA_XAC_THUC">Chưa xác thực</option>
                <option value="DANG_XOA">Đang xóa</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Vai trò</label>
              <select value={vaiTro} onChange={e => setVaiTro(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <option value="">Tất cả</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="USER">Người học</option>
              </select>
            </div>
            <Button type="submit" variant="primary">Tìm</Button>
          </div>
        </form>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
        ) : data?.items?.length > 0 ? (
          <>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>
              {data.totalElements} tài khoản khớp bộ lọc, mới tạo trước
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
              {data.items.map((u, i) => {
                const st = STATUS[u.trangThai];
                const isAdmin = u.vaiTro.includes('ADMIN');
                return (
                  <li key={u.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{page * data.size + i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-primary-strong)' }}>
                          {u.anhDaiDien ? <img src={u.anhDaiDien} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.tenHienThi.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {u.tenHienThi} {u.id === me?.id && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', fontWeight: 'normal' }}>(bạn)</span>}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{u.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', background: st.className || 'var(--color-border)', color: STATUS_TEXT_COLOR[u.trangThai] || 'var(--color-ink)', borderRadius: '4px', fontWeight: 'bold' }}>
                          {st.label}
                        </span>
                        {isAdmin ? <strong style={{ color: 'var(--color-primary-strong)' }}>Quản trị viên</strong> : <span>Người học</span>}
                        <span style={{ color: 'var(--color-ink-2)' }}>&bull;</span>
                        <span>{u.soBoThe} bộ thẻ</span>
                        <span style={{ color: 'var(--color-ink-2)' }}>&bull;</span>
                        <span>Tạo {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span style={{ color: 'var(--color-ink-2)' }}>&bull;</span>
                        <span>{u.dangNhapCuoiAt ? `Đăng nhập ${new Date(u.dangNhapCuoiAt).toLocaleString('vi-VN')}` : 'Chưa đăng nhập'}</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {u.trangThai === 'HOAT_DONG' && (
                          <Button variant="ghost" size="sm" onClick={() => handleLock(u)} disabled={u.id === me?.id} style={u.id !== me?.id ? { color: 'var(--color-danger)' } : {}}>
                            Khóa tài khoản
                          </Button>
                        )}
                        {u.trangThai === 'BI_KHOA' && (
                          <Button variant="ghost" size="sm" onClick={() => handleUnlock(u)}>Mở khóa</Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => handleRevoke(u)}>Thu quyền quản trị</Button>
                        )}
                        {!isAdmin && u.trangThai === 'HOAT_DONG' && (
                          <Button variant="ghost" size="sm" onClick={() => handleGrant(u)}>Cấp quyền quản trị</Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {data.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
                {Array.from({ length: data.totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => handlePageChange(i)}
                    style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: page === i ? 'var(--color-primary)' : 'var(--color-bg)', color: page === i ? 'white' : 'var(--color-ink)', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Không tìm thấy tài khoản</h2>
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Thử bỏ bớt bộ lọc hoặc tìm bằng một phần email.</p>
            <Button variant="secondary" onClick={handleClear}>Xóa bộ lọc</Button>
          </div>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Quy tắc</h2>
          <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            <li>Khóa tài khoản sẽ hủy mọi phiên đăng nhập của người đó ngay lập tức.</li>
            <li>Không tự khóa tài khoản của mình.</li>
            <li>Luôn còn ít nhất một quản trị viên đang hoạt động: không khóa và không thu quyền người cuối cùng.</li>
            <li>Tài khoản chưa xác thực email phải tự xác thực qua thư, quản trị không mở thay.</li>
            <li>Trang này chỉ hiện thông tin cần để quản lý tài khoản, không hiện nội dung học riêng tư.</li>
          </ul>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Nhật ký</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-3)' }}>Xem ai đã khóa, mở khóa hay đổi vai trò, lúc nào và vì sao.</p>
          <Button variant="ghost" onClick={() => router.push('/quan-tri/nhat-ky?loai=NGUOI_DUNG')} style={{ marginLeft: '-12px' }}>
            Mở nhật ký tài khoản
          </Button>
        </section>
      </aside>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
