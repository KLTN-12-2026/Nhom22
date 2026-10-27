'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon, ErrorState } from '@/components/ui';

function HocContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDeckId = searchParams.get('boTheId') || '';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  const [boTheId, setBoTheId] = useState(defaultDeckId);
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [quyThoiGian, setQuyThoiGian] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        boTheId: boTheId || null,
        chieuHoc,
        quyThoiGian: Number(quyThoiGian)
      };
      const res = await apiFetch('/api/v1/learning/sessions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      router.push(`/hoc-phien?id=${res.id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi bắt đầu phiên học');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page page-grid with-side">
        <section className="sheet">
          <div className="skeleton">
            <div className="sk sk-title"></div>
            <div className="sk sk-row"></div>
            <div className="sk sk-row"></div>
            <div className="sk sk-row"></div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page page-grid with-side">
        <section className="sheet">
          <ErrorState title="Chưa tải được thông tin phiên học" description={error.message} onRetry={refetch} />
        </section>
      </div>
    );
  }

  const boThe = data?.boThe || [];
  const allInfo = boThe.reduce(
    (a, b) => ({ soCanOn: a.soCanOn + (b.soCanOn || 0), soMoi: a.soMoi + (b.soMoi || 0) }),
    { soCanOn: 0, soMoi: 0 }
  );

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Phiên học</span><span>Chọn bộ, chiều và thời gian</span></div>
          <Link href="/hom-nay" className="btn btn-quiet" style={{ justifySelf: 'start', marginLeft: '-12px' }}>
            <Icon name="arrow-left" /> Hôm nay
          </Link>
          <h1 id="page-title">Chọn phiên học</h1>
          <p>Hệ thống xếp thẻ theo thứ tự: bước học lại đến hạn, thẻ ôn quá hạn và đến hạn, rồi mới đến từ mới trong hạn mức.</p>
        </div>

        {errorMessage && (
          <p className="notice notice-danger study-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {errorMessage}
          </p>
        )}

        {boThe.length === 0 && data?.tongSoThe === 0 ? (
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true">
              <span data-n="1"><i></i><i></i><i></i><i></i></span>
              <span data-n="2"><i></i><i></i><i></i><i></i></span>
            </div>
            <h2>Chưa có bộ thẻ nào để học</h2>
            <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ thẻ trước.</p>
            <div className="row">
              <Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link>
              <Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack-lg" noValidate>
            <fieldset className="fieldset" data-field="boTheId">
              <legend>Bộ thẻ</legend>
              <div className="choice-grid" id="decks">
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="boTheId"
                    value=""
                    checked={boTheId === ''}
                    onChange={() => setBoTheId('')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">Tất cả bộ của tôi</span>
                    <span className="choice-desc">
                      {allInfo.soCanOn} thẻ cần ôn, {allInfo.soMoi} từ chưa học
                    </span>
                  </span>
                </label>

                {boThe.map((b) => (
                  <label key={b.boTheId} className="choice choice-card">
                    <input
                      type="radio"
                      name="boTheId"
                      value={b.boTheId}
                      checked={boTheId === String(b.boTheId)}
                      onChange={() => setBoTheId(String(b.boTheId))}
                    />
                    <span className="bubble" aria-hidden="true"></span>
                    <span className="choice-body">
                      <span className="choice-title">{b.ten}</span>
                      <span className="choice-desc">
                        {b.soCanOn} thẻ cần ôn, {b.soMoi} từ chưa học
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="fieldset field" data-field="chieuHoc">
              <legend>Chiều học</legend>
              <div className="choice-grid cols-2">
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="chieuHoc"
                    value="EN_VI"
                    checked={chieuHoc === 'EN_VI'}
                    onChange={() => setChieuHoc('EN_VI')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">Anh → Việt</span>
                    <span className="choice-desc">Mặt trước là từ tiếng Anh, bạn nhớ lại nghĩa</span>
                  </span>
                </label>
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="chieuHoc"
                    value="VI_EN"
                    checked={chieuHoc === 'VI_EN'}
                    onChange={() => setChieuHoc('VI_EN')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">Việt → Anh</span>
                    <span className="choice-desc">Mặt trước là nghĩa tiếng Việt, bạn nhớ lại từ</span>
                  </span>
                </label>
              </div>
              <p className="field-hint">Mỗi chiều có lịch ôn riêng. Học chiều này không làm thay đổi lịch của chiều kia.</p>
            </fieldset>

            <fieldset className="fieldset field" data-field="quyThoiGian">
              <legend>Thời gian</legend>
              <div className="choice-grid cols-3">
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="quyThoiGian"
                    value="5"
                    checked={quyThoiGian === '5'}
                    onChange={() => setQuyThoiGian('5')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">5 phút</span>
                    <span className="choice-desc">khoảng 15 lượt</span>
                  </span>
                </label>
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="quyThoiGian"
                    value="10"
                    checked={quyThoiGian === '10'}
                    onChange={() => setQuyThoiGian('10')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">10 phút</span>
                    <span className="choice-desc">khoảng 30 lượt</span>
                  </span>
                </label>
                <label className="choice choice-card">
                  <input
                    type="radio"
                    name="quyThoiGian"
                    value="20"
                    checked={quyThoiGian === '20'}
                    onChange={() => setQuyThoiGian('20')}
                  />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">20 phút</span>
                    <span className="choice-desc">khoảng 60 lượt</span>
                  </span>
                </label>
              </div>
              <p className="field-hint">Số lượt là ước tính theo 20 giây mỗi lượt. Khi hết giờ, bạn chấm nốt thẻ đang mở rồi phiên kết thúc.</p>
            </fieldset>

            <div className="form-foot" style={{ marginTop: 'var(--space-6)' }}>
              <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Đang khởi tạo…' : 'Bắt đầu học'}
              </Button>
              <Link className="btn btn-quiet" href="/hom-nay">Hủy</Link>
            </div>
          </form>
        )}
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="rate-title">
          <h2 className="panel-title" id="rate-title">Bốn mức tự đánh giá</h2>
          <table className="rate-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th scope="col" style={{ textAlign: 'left', padding: 'var(--space-2) 0' }}>Mức</th>
                <th scope="col" style={{ textAlign: 'left', padding: 'var(--space-2) 0' }}>Khi nào chọn</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <th scope="row" style={{ textAlign: 'left', padding: 'var(--space-2) 0', fontWeight: 'bold' }}>
                  Quên <span className="kbd">1</span>
                </th>
                <td style={{ padding: 'var(--space-2) 0' }}>Không nhớ ra, hoặc nhớ sai</td>
              </tr>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <th scope="row" style={{ textAlign: 'left', padding: 'var(--space-2) 0', fontWeight: 'bold' }}>
                  Khó <span className="kbd">2</span>
                </th>
                <td style={{ padding: 'var(--space-2) 0' }}>Nhớ ra nhưng phải nghĩ lâu</td>
              </tr>
              <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                <th scope="row" style={{ textAlign: 'left', padding: 'var(--space-2) 0', fontWeight: 'bold' }}>
                  Nhớ <span className="kbd">3</span>
                </th>
                <td style={{ padding: 'var(--space-2) 0' }}>Nhớ đúng trong vài giây</td>
              </tr>
              <tr>
                <th scope="row" style={{ textAlign: 'left', padding: 'var(--space-2) 0', fontWeight: 'bold' }}>
                  Dễ <span className="kbd">4</span>
                </th>
                <td style={{ padding: 'var(--space-2) 0' }}>Biết ngay, không cần nghĩ</td>
              </tr>
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>
            Chọn theo trí nhớ thật của bạn. Đây không phải điểm số, chỉ dùng để xếp lịch ôn.
          </p>
        </section>

        <section className="panel" aria-labelledby="key-title">
          <h2 className="panel-title" id="key-title">Phím tắt khi học</h2>
          <ul className="queue-order" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-2)' }}>
            <li><span className="kbd">Space</span> Lật thẻ</li>
            <li>
              <span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span> <span className="kbd">4</span> Quên, Khó, Nhớ, Dễ
            </li>
            <li><span className="kbd">P</span> Nghe phát âm</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function HocPage() {
  return (
    <Suspense fallback={<div className="page sheet skeleton"><div className="sk sk-row" /></div>}>
      <HocContent />
    </Suspense>
  );
}