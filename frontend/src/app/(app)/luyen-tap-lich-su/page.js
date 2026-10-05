'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const TYPES = {
  CHON_NGHIA: 'Chọn nghĩa',
  CHON_TU: 'Chọn từ',
  GHEP_TU: 'Ghép từ',
  DIEN_CHO_TRONG: 'Điền chỗ trống',
  NHAP_TU_THEO_NGHIA: 'Nhập từ theo nghĩa',
  NGHE_VIET: 'Nghe viết',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm',
  TONG_HOP: 'Tổng hợp'
};

function PracticeHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPage = parseInt(searchParams.get('page') || '0', 10);
  const defaultLoaiBai = searchParams.get('loaiBai') || '';

  const [page, setPage] = useState(defaultPage);
  const [loaiBai, setLoaiBai] = useState(defaultLoaiBai);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-history', page, loaiBai],
    queryFn: () => apiFetch(`/api/v1/practice/history?page=${page}&size=10${loaiBai ? `&loaiBai=${loaiBai}` : ''}`)
  });

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setLoaiBai(val);
    setPage(0);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '0');
    if (val) newParams.set('loaiBai', val);
    else newParams.delete('loaiBai');
    router.push(`/luyen-tap-lich-su?${newParams.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    router.push(`/luyen-tap-lich-su?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="page" style={{ padding: 'var(--space-5)', maxWidth: '1000px', margin: '0 auto' }}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <Button variant="ghost" onClick={() => router.push('/luyen-tap')} style={{ marginLeft: '-12px' }}>
              <Icon name="arrow-left" /> Chọn dạng bài
            </Button>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
              {data?.totalElements !== undefined ? `${data.totalElements} bài` : '—'}
            </div>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Lịch sử bài luyện</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Mở một bài để xem lại đáp án, giải thích và luyện lại câu sai.</p>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Dạng bài</label>
          <select 
            value={loaiBai} 
            onChange={handleTypeChange}
            style={{ width: '100%', maxWidth: '300px', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          >
            <option value="">Tất cả dạng bài</option>
            {Object.keys(TYPES).map(k => (
              <option key={k} value={k}>{TYPES[k]}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
        ) : data?.items?.length > 0 ? (
          <>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
              {data.items.map((item, index) => (
                <li key={item.baiLuyenId} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', fontSize: '1.2rem', marginTop: '4px' }}>
                    {data.page * data.size + index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/luyen-tap-ket-qua?id=${item.baiLuyenId}`} style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary-strong)', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-2)' }}>
                      {TYPES[item.loaiBai] || item.loaiBai}
                    </Link>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
                      {item.laLuyenLai && <span style={{ padding: '2px 8px', background: 'var(--color-border)', borderRadius: '4px', fontWeight: 'bold' }}>Luyện lại</span>}
                      <span>{item.boTheTen}</span>
                      <span>{new Date(item.nopAt).toLocaleString('vi-VN')}</span>
                      <span>{Math.floor(item.thoiGianMs / 60000)}p {Math.floor((item.thoiGianMs % 60000) / 1000)}s</span>
                      {item.soCauSai > 0 ? (
                        <span style={{ color: 'var(--color-danger)' }}>{item.soCauSai} câu sai</span>
                      ) : (
                        <span style={{ color: 'var(--color-success-strong)', fontWeight: 'bold' }}><Icon name="check" size={14} /> Đúng hết</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-ink)' }}>{item.soCauDung}/{item.tongSoCau}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', fontWeight: 'bold' }}>{item.diem} điểm</div>
                  </div>
                </li>
              ))}
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
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>
              {loaiBai ? `Chưa có bài ${TYPES[loaiBai].toLowerCase()}` : 'Bạn chưa làm bài luyện nào'}
            </h2>
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Làm một bài ngắn 5 câu để biết mình hay sai ở đâu.</p>
            <Button variant="primary" onClick={() => router.push('/luyen-tap')}>Chọn dạng bài</Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PracticeHistoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <PracticeHistoryContent />
    </Suspense>
  );
}
