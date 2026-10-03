'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

export default function TodayPage() {
  const router = useRouter();
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [minutes, setMinutes] = useState(10);
  
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/learning/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/hoc-phien?id=${res.id}`);
    },
    onError: (err) => alert(err.message || 'Lỗi tạo phiên học')
  });

  const handleStart = (e) => {
    e.preventDefault();
    sessionMutation.mutate({
      boTheId: null,
      chieuHoc,
      quyThoiGian: minutes,
      cheDo: 'THUONG'
    });
  };

  if (isLoading) return <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Đang tải kế hoạch...</div>;
  if (error) return <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-danger)' }}>Lỗi tải kế hoạch</div>;

  const canOn = (plan?.soQuaHan || 0) + (plan?.soDenHan || 0);
  const nothing = canOn + (plan?.soMoiConLai || 0) === 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Hôm nay</span>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>Hôm nay học gì?</h1>
          {nothing ? (
            <p style={{ color: 'var(--color-ink-2)' }}>Không còn thẻ nào cần học hôm nay.</p>
          ) : (
            <p style={{ color: 'var(--color-ink-2)' }}>Có {canOn} thẻ cần ôn và {plan?.soMoiConLai} từ mới, cần khoảng {plan?.uocTinhPhut} phút.</p>
          )}
        </div>

        {!nothing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Quá hạn</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{plan?.soQuaHan} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>thẻ</span></div>
            </div>
            <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Đến hạn hôm nay</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{plan?.soDenHan} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>thẻ</span></div>
            </div>
            <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Từ mới còn lại</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{plan?.soMoiConLai} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>từ</span></div>
            </div>
            <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thời gian cần</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{plan?.uocTinhPhut} <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>phút</span></div>
            </div>
          </div>
        )}

        {nothing ? (
          <div style={{ padding: 'var(--space-5)', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: 'var(--space-3)' }}>
            <Icon name="check" style={{ marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Hôm nay đã ôn xong.</strong>
              Không còn thẻ đến hạn và đã đủ từ mới. Thẻ tiếp theo sẽ đến hạn vào ngày mai.
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Hôm nay bạn có bao nhiêu phút?</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                {[5, 10, 20].map(m => (
                  <label key={m} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: minutes === m ? 'var(--color-primary-tint)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="radio" name="minutes" value={m} checked={minutes === m} onChange={() => setMinutes(m)} />
                    <span style={{ fontWeight: 'bold' }}>{m} phút</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Chiều học</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <label style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: chieuHoc === 'EN_VI' ? 'var(--color-primary-tint)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="chieuHoc" value="EN_VI" checked={chieuHoc === 'EN_VI'} onChange={() => setChieuHoc('EN_VI')} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Anh → Việt</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thấy từ tiếng Anh, nhớ lại nghĩa</div>
                  </div>
                </label>
                <label style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: chieuHoc === 'VI_EN' ? 'var(--color-primary-tint)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="chieuHoc" value="VI_EN" checked={chieuHoc === 'VI_EN'} onChange={() => setChieuHoc('VI_EN')} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Việt → Anh</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thấy nghĩa, nhớ lại từ tiếng Anh</div>
                  </div>
                </label>
              </div>
            </fieldset>

            <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary-tint)' }}>
              <Button type="submit" variant="primary" size="lg" disabled={sessionMutation.isPending}>
                {sessionMutation.isPending ? 'Đang tạo...' : 'Bắt đầu học'}
              </Button>
            </div>
          </form>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Chuỗi ngày học</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--color-primary-strong)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{plan?.chuoiNgay || 0}</span>
            <span style={{ fontWeight: '600' }}>ngày liên tiếp</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>
            {plan?.homNayDaTinhChuoi ? 'Hôm nay đã được tính.' : 'Hôm nay chưa được tính.'}
          </p>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Mục tiêu mỗi ngày</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
            <span>Đã học {plan?.daHocHomNay?.soLuot || 0} lượt</span>
            <span style={{ fontWeight: 'bold' }}>{plan?.daHocHomNay?.soPhut || 0}/{plan?.phutMoiNgay || 10} phút</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--color-primary)', width: `${Math.min(100, ((plan?.daHocHomNay?.soPhut || 0) / (plan?.phutMoiNgay || 10)) * 100)}%` }} />
          </div>
        </section>
      </aside>
    </div>
  );
}
