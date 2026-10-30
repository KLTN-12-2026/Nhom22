'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui';

const RATING = { QUEN: 'Quên', KHO: 'Khó', NHO: 'Nhớ', DE: 'Dễ' };
const SRS_STATE = { MOI: 'Mới', DANG_HOC: 'Đang học', ON_TAP: 'Ôn tập', HOC_LAI: 'Học lại', TAM_NGUNG: 'Tạm ngưng' };
const currentTime = () => Date.now();

function until(iso) {
  if (!iso) return 'chưa có lịch';
  const mins = Math.round((Date.parse(iso) - currentTime()) / 60000);
  if (mins <= 0) return 'đã đến hạn';
  if (mins < 60) return `sau ${mins} phút`;
  if (mins < 1440) return `sau ${Math.round(mins / 60)} giờ`;
  return `sau ${Math.round(mins / 1440)} ngày`;
}

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();
  const [practiceError, setPracticeError] = useState('');

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session-summary', id],
    queryFn: () => apiFetch(`/api/v1/learning/sessions/${id}`),
    enabled: !!id
  });

  const ended = session?.trangThai === 'KET_THUC';

  const { data: summary, error: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['session-finish', id],
    queryFn: () => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    enabled: !!id && ended,
    staleTime: Infinity,
    retry: false
  });

  const { data: today, error: todayError } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today'),
    enabled: !!summary
  });

  const finishMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    onSuccess: (result) => {
      queryClient.setQueryData(['session-finish', id], result);
      queryClient.setQueryData(['session-summary', id], (old) => (old ? { ...old, trangThai: result.trangThai } : old));
      queryClient.invalidateQueries({ queryKey: ['learning-today'] });
    }
  });

  const practiceMutation = useMutation({
    mutationFn: (theIds) => apiFetch('/api/v1/practice/sessions', {
      method: 'POST',
      body: JSON.stringify({ loaiBai: 'NHAP_TU_THEO_NGHIA', soCau: 20, theIds })
    }),
    onSuccess: (res) => router.push(`/luyen-tap-lam-bai?id=${res.id}`),
    onError: (err) => setPracticeError(err.message || 'Chưa tạo được bài luyện.')
  });

  if (!id) return <div style={{ padding: 'var(--space-8)' }} role="alert">Thiếu mã phiên học. <Link href="/hoc">Chọn phiên học</Link></div>;
  if (isLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải kết quả...</div>;
  if (error) {
    return (
      <div style={{ padding: 'var(--space-8)' }} role="alert">
        {error.status === 404 ? 'Không tìm thấy phiên học.' : error.message} <Link href="/hoc">Chọn phiên học khác</Link>
      </div>
    );
  }

  if (session?.trangThai === 'DANG_HOC') {
    return (
      <div className="page page-grid">
        <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
              <span>Tổng kết phiên</span> <span>&bull;</span> <span>Đang học</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Phiên này chưa kết thúc</h1>
            <p style={{ color: 'var(--color-ink-2)' }}>Học tiếp để chấm các thẻ còn lại, hoặc kết thúc ngay. Các thẻ đã chấm vẫn được lưu.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="accent" onClick={() => router.push(`/hoc-phien?id=${id}`)}>Học tiếp</Button>
            <Button variant="secondary" onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
              {finishMutation.isPending ? 'Đang kết thúc...' : 'Kết thúc phiên'}
            </Button>
          </div>
          {finishMutation.isError && <p className="notice notice-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>{finishMutation.error.message}</p>}
        </section>
      </div>
    );
  }

  const t = summary;
  if (summaryError) {
    return (
      <div style={{ padding: 'var(--space-8)' }} role="alert">
        Chưa tải được tổng kết: {summaryError.message} <Button variant="secondary" onClick={() => refetchSummary()}>Thử lại</Button>
      </div>
    );
  }
  if (!t) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải tổng kết...</div>;

  const giay = Math.round((t.thoiGian || 0) / 1000);

  const maxRate = Math.max(1, t.theoDanhGia.QUEN, t.theoDanhGia.KHO, t.theoDanhGia.NHO, t.theoDanhGia.DE);

  return (
    <div className="page page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Tổng kết phiên</span> <span>&bull;</span> <span>{t.chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh'}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
            {t.soLuot ? `Bạn đã ôn ${t.soThe} thẻ` : 'Phiên kết thúc khi chưa chấm thẻ nào'}
          </h1>
          <p style={{ color: 'var(--color-ink-2)' }}>{t.boTheTen}{t.soChuaTraLoi ? ` · ${t.soChuaTraLoi} thẻ chưa chấm khi kết thúc` : ''}</p>
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
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thời gian trả lời · quỹ {t.quyThoiGian} phút</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.floor(giay / 60)} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>phút {giay % 60} giây</span></div>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Mức bạn đã chọn</h2>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {['QUEN', 'KHO', 'NHO', 'DE'].map(r => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: '4rem 1fr 2rem', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{RATING[r]}</div>
                <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${(t.theoDanhGia[r] / maxRate) * 100}%` }} />
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
                    {w.danhGia.map((r, k) => (
                      <span key={k} style={{ padding: '4px 8px', marginLeft: '4px', background: 'var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {RATING[r] || r}
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
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>
                    {SRS_STATE[w.trangThai] || w.trangThai}{w.hanOnAt ? ` · ${new Date(w.hanOnAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
                  {until(w.hanOnAt)}
                </div>
              </li>
            )) : (
              <li style={{ color: 'var(--color-ink-2)', fontStyle: 'italic' }}>Chưa có thẻ nào được chấm.</li>
            )}
          </ul>
        </div>

        <div className="action-bar" style={{ paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary-tint)', display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" onClick={() => router.push('/hoc')}>Học phiên khác</Button>
          <Button variant="secondary" onClick={() => router.push('/hom-nay')}>Về trang Hôm nay</Button>
        </div>
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Chuỗi ngày học</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--color-primary-strong)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{today?.chuoiNgay ?? '—'}</span>
            <span style={{ fontWeight: '600' }}>ngày liên tiếp</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>
            {todayError
              ? 'Chưa tải được chuỗi ngày.'
              : !today
                ? 'Đang tải chuỗi ngày…'
                : today.homNayDaTinhChuoi
                  ? 'Hôm nay đã được tính vào chuỗi.'
                  : `Hôm nay chưa được tính. Cần ít nhất ${today.luotToiThieuChuoi} lượt ôn trong ngày.`}
          </p>
        </section>

        {t.tuCanLuyen?.length > 0 && (
          <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Gợi ý tiếp theo</h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
              Bạn chọn Quên hoặc Khó với {t.tuCanLuyen.length} từ. Gõ lại từ theo nghĩa giúp nhớ chắc hơn.
            </p>
            <Button
              variant="primary"
              style={{ marginTop: 'var(--space-3)', width: '100%' }}
              disabled={practiceMutation.isPending}
              onClick={() => { setPracticeError(''); practiceMutation.mutate(t.tuCanLuyen.map(w => w.theId)); }}
            >
              {practiceMutation.isPending ? 'Đang tạo bài luyện…' : `Luyện ${t.tuCanLuyen.length} từ này`}
            </Button>
            {practiceError && <p className="notice notice-danger" role="alert" style={{ marginTop: 'var(--space-3)' }}>{practiceError}</p>}
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
