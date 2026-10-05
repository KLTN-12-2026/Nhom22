'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function HocContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDeckId = searchParams.get('boTheId') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  const [boTheId, setBoTheId] = useState(defaultDeckId);
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [quyThoiGian, setQuyThoiGian] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When data is loaded and no deck is selected, auto-select "Tất cả" if applicable
  if (data && data.boThe && boTheId === '' && !defaultDeckId) {
    // Wait, let's keep boTheId as '' for "Tất cả bộ của tôi"
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        boTheId: boTheId || null,
        chieuHoc,
        quyThoiGian: Number(quyThoiGian),
        cheDo: 'THUONG'
      };
      const res = await apiFetch('/api/v1/learning/sessions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      router.push(`/hoc-phien/${res.id}`);
    } catch (err) {
      alert(err.message || 'Lỗi khi bắt đầu phiên học');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>;
  }
  if (error) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-danger)' }}>Lỗi: {error.message}</div>;
  }

  const boThe = data?.boThe || [];
  const allInfo = boThe.reduce((a, b) => ({ soCanOn: a.soCanOn + b.soCanOn, soMoi: a.soMoi + b.soMoi }), { soCanOn: 0, soMoi: 0 });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
            <span>Phiên học</span>
            <span>&bull;</span>
            <span>Chọn bộ, chiều và thời gian</span>
          </div>
          <Link href="/hom-nay" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-3)' }}>
            <Icon name="arrow-left" /> Hôm nay
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Chọn phiên học</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Hệ thống xếp thẻ theo thứ tự: bước học lại đến hạn, thẻ ôn quá hạn và đến hạn, rồi mới đến từ mới trong hạn mức.</p>
        </div>

        {boThe.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Chưa có bộ thẻ nào để học</h2>
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ thẻ trước.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <Button variant="primary" onClick={() => router.push('/thu-vien')}>Xem thư viện</Button>
              <Button variant="secondary" onClick={() => router.push('/bo-the-tao')}>Tạo bộ thẻ</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-6)' }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Bộ thẻ</legend>
              <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: boTheId === '' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: boTheId === '' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="boTheId" value="" checked={boTheId === ''} onChange={() => setBoTheId('')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Tất cả bộ của tôi</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', display: 'flex', gap: '12px' }}>
                      <span>{allInfo.soCanOn} thẻ cần ôn</span>
                      <span>{allInfo.soMoi} từ chưa học</span>
                    </div>
                  </div>
                </label>
                {boThe.map(b => (
                  <label key={b.boTheId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: boTheId === b.boTheId ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: boTheId === b.boTheId ? 'var(--color-primary)' : 'var(--color-border)' }}>
                    <input type="radio" name="boTheId" value={b.boTheId} checked={boTheId === b.boTheId} onChange={() => setBoTheId(b.boTheId)} style={{ transform: 'scale(1.2)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{b.ten}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', display: 'flex', gap: '12px' }}>
                        <span>{b.soCanOn} thẻ cần ôn</span>
                        <span>{b.soMoi} từ chưa học</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Chiều học</legend>
              <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: chieuHoc === 'EN_VI' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: chieuHoc === 'EN_VI' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="chieuHoc" value="EN_VI" checked={chieuHoc === 'EN_VI'} onChange={() => setChieuHoc('EN_VI')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Anh → Việt</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Mặt trước là từ tiếng Anh, bạn nhớ lại nghĩa</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: chieuHoc === 'VI_EN' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: chieuHoc === 'VI_EN' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="chieuHoc" value="VI_EN" checked={chieuHoc === 'VI_EN'} onChange={() => setChieuHoc('VI_EN')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Việt → Anh</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Mặt trước là nghĩa tiếng Việt, bạn nhớ lại từ</div>
                  </div>
                </label>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>Mỗi chiều có lịch ôn riêng. Học chiều này không làm thay đổi lịch của chiều kia.</p>
            </fieldset>

            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Thời gian</legend>
              <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: quyThoiGian === '5' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: quyThoiGian === '5' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="quyThoiGian" value="5" checked={quyThoiGian === '5'} onChange={() => setQuyThoiGian('5')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>5 phút</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>khoảng 20 lượt</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: quyThoiGian === '10' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: quyThoiGian === '10' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="quyThoiGian" value="10" checked={quyThoiGian === '10'} onChange={() => setQuyThoiGian('10')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>10 phút</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>khoảng 40 lượt</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: quyThoiGian === '20' ? 'var(--color-primary-tint)' : 'var(--color-field)', borderColor: quyThoiGian === '20' ? 'var(--color-primary)' : 'var(--color-border)' }}>
                  <input type="radio" name="quyThoiGian" value="20" checked={quyThoiGian === '20'} onChange={() => setQuyThoiGian('20')} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>20 phút</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>khoảng 80 lượt</div>
                  </div>
                </label>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>Số lượt là ước tính theo 15 giây mỗi lượt. Khi hết giờ, bạn chấm nốt thẻ đang mở rồi phiên kết thúc.</p>
            </fieldset>

            <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary)' }}>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tải...' : 'Bắt đầu học'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push('/hom-nay')} disabled={isSubmitting}>
                Hủy
              </Button>
            </div>
          </form>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Bốn mức tự đánh giá</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-primary)' }}>Mức</th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-primary)' }}>Khi nào chọn</th>
              </tr>
            </thead>
            <tbody>
              {/* Using a bit of manual style for table cells */}
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Quên <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>1</kbd></td>
                <td style={{ padding: '8px 0' }}>Không nhớ ra, hoặc nhớ sai</td>
              </tr>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Khó <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>2</kbd></td>
                <td style={{ padding: '8px 0' }}>Nhớ ra nhưng phải nghĩ lâu</td>
              </tr>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Nhớ <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>3</kbd></td>
                <td style={{ padding: '8px 0' }}>Nhớ đúng trong vài giây</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Dễ <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>4</kbd></td>
                <td style={{ padding: '8px 0' }}>Biết ngay, không cần nghĩ</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginTop: 'var(--space-3)' }}>Chọn theo trí nhớ thật của bạn. Đây không phải điểm số, chỉ dùng để xếp lịch ôn.</p>
        </section>
        
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Phím tắt khi học</h2>
          <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            <li><kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>Space</kbd> Lật thẻ</li>
            <li><kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>1</kbd> <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>2</kbd> <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>3</kbd> <kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>4</kbd> Quên, Khó, Nhớ, Dễ</li>
            <li><kbd style={{ padding: '2px 6px', background: 'var(--color-desk)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>P</kbd> Nghe phát âm</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function HocPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <HocContent />
    </Suspense>
  );
}
