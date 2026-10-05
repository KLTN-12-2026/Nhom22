'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

const ACTION = {
  KHOA_TAI_KHOAN: 'Khóa tài khoản', MO_KHOA_TAI_KHOAN: 'Mở khóa tài khoản', CAP_QUYEN_QUAN_TRI: 'Cấp quyền quản trị', THU_QUYEN_QUAN_TRI: 'Thu quyền quản trị',
  TAO_BO_MAU: 'Tạo bộ mẫu', SUA_BO_MAU: 'Sửa bộ mẫu', XUAT_BAN_BO_MAU: 'Xuất bản bộ mẫu', CHUYEN_VE_NHAP: 'Chuyển bộ về nháp', AN_BO_MAU: 'Ẩn bộ mẫu', HIEN_BO_MAU: 'Hiện lại bộ mẫu', XOA_BO_MAU: 'Xóa bộ mẫu',
  TAO_THE_MAU: 'Thêm thẻ mẫu', SUA_THE_MAU: 'Sửa thẻ mẫu', XOA_THE_MAU: 'Xóa thẻ mẫu'
};

const KIND = { NGUOI_DUNG: 'Tài khoản', BO_THE: 'Bộ mẫu', THE_TU_VUNG: 'Thẻ mẫu' };
const FIELD = { trangThai: 'Trạng thái', vaiTro: 'Vai trò', quyenTruyCap: 'Xuất bản', trangThaiKiemDuyet: 'Kiểm duyệt', ten: 'Tên', moTa: 'Mô tả', mucTieu: 'Mục tiêu', chuDeId: 'Chủ đề', trinhDo: 'Trình độ', tu: 'Từ', nghiaVi: 'Nghĩa', tuLoai: 'Từ loại', phienAm: 'Phiên âm', viDuEn: 'Ví dụ', dichVi: 'Dịch ví dụ' };
const VALUE = { HOAT_DONG: 'Đang hoạt động', BI_KHOA: 'Bị khóa', CHUA_XAC_THUC: 'Chưa xác thực', DANG_XOA: 'Đang xóa', ADMIN: 'Quản trị viên', USER: 'Người học', CONG_KHAI: 'Đã xuất bản', RIENG_TU: 'Bản nháp', BINH_THUONG: 'Bình thường', DA_AN: 'Đã ẩn' };
const GOAL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC', IELTS: 'IELTS' };
const LEVEL = { A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2' };

function AdminAuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me } = useMe();

  const today = new Date().toISOString().split('T')[0];

  const defaultQ = searchParams.get('q') || '';
  const defaultHanhDong = searchParams.get('hanhDong') || '';
  const defaultLoai = searchParams.get('loai') || '';
  const defaultTuNgay = searchParams.get('tuNgay') || '';
  const defaultDenNgay = searchParams.get('denNgay') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [q, setQ] = useState(defaultQ);
  const [hanhDong, setHanhDong] = useState(defaultHanhDong);
  const [loai, setLoai] = useState(defaultLoai);
  const [tuNgay, setTuNgay] = useState(defaultTuNgay);
  const [denNgay, setDenNgay] = useState(defaultDenNgay);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', q, hanhDong, loai, tuNgay, denNgay, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (hanhDong) params.set('hanhDong', hanhDong);
      if (loai) params.set('loai', loai);
      if (tuNgay) params.set('tuNgay', tuNgay);
      if (denNgay) params.set('denNgay', denNgay);
      params.set('page', page.toString());
      params.set('size', '20');
      return apiFetch(`/api/v1/admin/audit-logs?${params.toString()}`);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (tuNgay && denNgay && tuNgay > denNgay) {
      alert('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q); else params.delete('q');
    if (hanhDong) params.set('hanhDong', hanhDong); else params.delete('hanhDong');
    if (loai) params.set('loai', loai); else params.delete('loai');
    if (tuNgay) params.set('tuNgay', tuNgay); else params.delete('tuNgay');
    if (denNgay) params.set('denNgay', denNgay); else params.delete('denNgay');
    params.set('page', '0');
    router.push(`/quan-tri/nhat-ky?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    setQ('');
    setHanhDong('');
    setLoai('');
    setTuNgay('');
    setDenNgay('');
    router.push('/quan-tri/nhat-ky', { scroll: false });
  };

  if (!me?.vaiTro?.includes('ADMIN')) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Không có quyền truy cập</div>;

  const showVal = (v) => {
    if (v === null || v === undefined || v === '') return <span style={{ color: 'var(--color-ink-3)' }}>(trống)</span>;
    if (Array.isArray(v)) return v.map(x => VALUE[x] || x).join(', ');
    return VALUE[v] || GOAL[v] || LEVEL[v] || String(v);
  };

  return (
    <div className="page" style={{ padding: 'var(--space-5)', maxWidth: '1000px', margin: '0 auto' }}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Quản trị</span>
            <span>{data?.totalElements !== undefined ? `${data.totalElements} mục` : '—'}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Nhật ký quản trị</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Mọi thao tác quản trị quan trọng: ai làm, làm gì, trên đối tượng nào, vì sao, và giá trị trước, sau. Nhật ký chỉ đọc, không sửa hay xóa được.</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <button style={{ padding: '6px 12px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>Thao tác quản trị</button>
          <button disabled title="Có ở Đợt 3" style={{ padding: '6px 12px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink-3)', borderRadius: 'var(--radius-full)', cursor: 'not-allowed', fontWeight: 'bold' }}>Tác vụ nền (Đợt 3)</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Tìm theo người làm, đối tượng hoặc lý do</label>
              <input type="search" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Hành động</label>
              <select value={hanhDong} onChange={e => setHanhDong(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <option value="">Tất cả hành động</option>
                {Object.entries(ACTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Đối tượng</label>
              <select value={loai} onChange={e => setLoai(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <option value="">Tất cả đối tượng</option>
                {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Từ ngày</label>
              <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)} max={today} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Đến ngày</label>
              <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)} max={today} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary">Lọc nhật ký</Button>
            <Button type="button" variant="ghost" onClick={handleClear}>Xóa bộ lọc</Button>
          </div>
        </form>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
        ) : data?.items?.length > 0 ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
            {data.items.map((l, i) => {
              const keys = [...new Set(Object.keys(l.truoc || {}).concat(Object.keys(l.sau || {})))];
              return (
                <li key={l.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{page * data.size + i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px', marginBottom: 'var(--space-1)' }}>
                      <strong style={{ fontSize: '1.125rem' }}>{ACTION[l.hanhDong] || l.hanhDong}</strong>
                      <span>
                        {KIND[l.doiTuong.loai]}: {l.doiTuong.loai === 'NGUOI_DUNG' ? (
                          <Link href={`/quan-tri/tai-khoan?q=${encodeURIComponent(l.doiTuong.ten)}`} style={{ color: 'var(--color-primary-strong)' }}>{l.doiTuong.ten}</Link>
                        ) : l.doiTuong.loai === 'BO_THE' ? (
                          <Link href={`/quan-tri/bo-mau?id=${l.doiTuong.id}`} style={{ color: 'var(--color-primary-strong)' }}>{l.doiTuong.ten}</Link>
                        ) : (
                          l.doiTuong.ten
                        )}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 'bold' }}>{l.nguoiThucHien.tenHienThi}</span>
                      <span style={{ margin: '0 8px' }}>&bull;</span>
                      <span>{new Date(l.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    {l.lyDo && (
                      <div style={{ padding: 'var(--space-2) var(--space-3)', borderLeft: '4px solid var(--color-primary-tint)', background: 'var(--color-bg)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                        <strong>Lý do:</strong> {l.lyDo}
                      </div>
                    )}

                    {keys.length > 0 && (
                      <details style={{ fontSize: 'var(--font-size-sm)' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-primary)' }}>Trước và sau ({keys.length} trường)</summary>
                        <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <th style={{ padding: '8px' }}>Trường</th>
                              <th style={{ padding: '8px' }}>Trước</th>
                              <th style={{ padding: '8px' }}>Sau</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keys.map(k => (
                              <tr key={k} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{FIELD[k] || k}</td>
                                <td style={{ padding: '8px' }}>{showVal(l.truoc?.[k])}</td>
                                <td style={{ padding: '8px' }}>{showVal(l.sau?.[k])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Chưa có thao tác nào</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Khi quản trị viên khóa tài khoản, đổi vai trò hay sửa bộ mẫu, thao tác sẽ hiện ở đây.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <AdminAuditContent />
    </Suspense>
  );
}
