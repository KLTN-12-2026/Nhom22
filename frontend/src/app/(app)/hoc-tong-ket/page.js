'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['session-summary', id],
    queryFn: () => apiFetch(`/api/v1/learning/sessions/${id}`),
    enabled: !!id
  });

  const { data: history } = useQuery({
    queryKey: ['learning-history', id],
    queryFn: () => apiFetch(`/api/v1/learning/history?phienId=${id}&size=50`),
    enabled: session?.trangThai === 'KET_THUC'
  });

  const finishMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    onSuccess: () => refetch()
  });

  if (!id) return <div>Invalid Session</div>;
  if (isLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải kết quả...</div>;

  if (session?.trangThai === 'DANG_HOC') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid">
        <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
              <span>Tổng kết phiên</span> <span>&bull;</span> <span>Đang học</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Phiên này chưa kết thúc</h1>
            <p style={{ color: 'var(--color-ink-2)' }}>Học tiếp để chấm các thẻ còn lại, hoặc kết thúc ngay. Các thẻ đã chấm vẫn được lưu.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" onClick={() => router.push(`/hoc-phien?id=${id}`)}>Học tiếp</Button>
            <Button variant="secondary" onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
              {finishMutation.isPending ? 'Đang kết thúc...' : 'Kết thúc phiên'}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const t = session?.tongKet;
  if (!t) return <div style={{ padding: 'var(--space-8)' }}>Không có dữ liệu tổng kết</div>;

  const maxRate = Math.max(1, t.theoDanhGia.QUEN, t.theoDanhGia.KHO, t.theoDanhGia.NHO, t.theoDanhGia.DE);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Tổng kết phiên</span> <span>&bull;</span> <span>{t.chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh'}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
            {t.soLuot ? `Bạn đã ôn ${t.soThe} thẻ` : 'Phiên kết thúc khi chưa chấm thẻ nào'}
          </h1>
          <p style={{ color: 'var(--color-ink-2)' }}>{t.boTheTen}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Lượt chấm</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t.soLuot} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>lượt</span></div>
          </div>
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thẻ khác nhau</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t.soThe} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>thẻ</span></div>
          </div>
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Từ mới</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{t.soTheMoi} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>từ</span></div>
          </div>
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thời gian</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.floor(t.thoiGianGiay / 60)} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>phút</span></div>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Mức bạn đã chọn</h2>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {['QUEN', 'KHO', 'NHO', 'DE'].map(r => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: '4rem 1fr 2rem', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{r === 'QUEN' ? 'Quên' : r === 'KHO' ? 'Khó' : r === 'NHO' ? 'Nhớ' : 'Dễ'}</div>
                <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: \`\${(t.theoDanhGia[r] / maxRate) * 100}%\` }} />
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{t.theoDanhGia[r]}</div>
              </div>
            ))}
          </div>
        </div>

        {t.tuCanLuyen?.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Từ cần luyện thêm</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
              {t.tuCanLuyen.map((w, i) => (
                <li key={w.theId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{w.tu}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{w.nghiaVi}</div>
                  </div>
                  <div>
                    {w.danhGia.map(r => (
                      <span key={r} style={{ padding: '4px 8px', background: 'var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {r === 'QUEN' ? 'Quên' : 'Khó'}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Lần ôn tiếp theo</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
            {t.lichTiepTheo?.length > 0 ? t.lichTiepTheo.map((w, i) => (
              <li key={w.theId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderBottom: '1px dashed var(--color-border)' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)' }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{w.tu}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>{w.trangThai === 'ON_TAP' ? 'Đang ôn tập' : w.trangThai}</div>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
                  sau {w.khoangHienThi}
                </div>
              </li>
            )) : (
              <li style={{ color: 'var(--color-ink-2)', fontStyle: 'italic' }}>Chưa có thẻ nào được chấm.</li>
            )}
          </ul>
        </div>

        <div style={{ paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary-tint)', display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" onClick={() => router.push('/hom-nay')}>Học phiên khác</Button>
          <Button variant="secondary" onClick={() => router.push('/hom-nay')}>Về trang Hôm nay</Button>
        </div>
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Chuỗi ngày học</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--color-primary-strong)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{t.chuoiNgay || 0}</span>
            <span style={{ fontWeight: '600' }}>ngày liên tiếp</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>
            {t.homNayDaTinhChuoi ? 'Hôm nay đã được tính vào chuỗi.' : 'Hôm nay chưa được tính.'}
          </p>
        </section>

        {t.tuCanLuyen?.length > 0 && (
          <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Gợi ý tiếp theo</h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
              Bạn chọn Quên hoặc Khó với {t.tuCanLuyen.length} từ. Gõ lại từ theo nghĩa giúp nhớ chắc hơn.
            </p>
            <Button variant="primary" style={{ marginTop: 'var(--space-3)', width: '100%' }}>Luyện {t.tuCanLuyen.length} từ này</Button>
          </section>
        )}
      </aside>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <SummaryContent />
    </Suspense>
  );
}
