'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const ratings = [
  ['Quên', '1', 'Không nhớ ra, hoặc nhớ sai'],
  ['Khó', '2', 'Nhớ ra nhưng phải nghĩ lâu'],
  ['Nhớ', '3', 'Nhớ đúng trong vài giây'],
  ['Dễ', '4', 'Biết ngay, không cần nghĩ']
];

function Choice({ checked, name, value, onChange, title, description, className = '' }) {
  return (
    <label className={`choice choice-card ${checked ? 'is-selected' : ''} ${className}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span className="bubble" aria-hidden="true"></span>
      <span className="choice-body">
        <span className="choice-title">{title}</span>
        {description && <span className="choice-desc">{description}</span>}
      </span>
    </label>
  );
}

function HocContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDeckId = searchParams.get('boTheId') || '';
  const [boTheId, setBoTheId] = useState(defaultDeckId);
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [quyThoiGian, setQuyThoiGian] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  const decks = data?.boThe || [];
  const selectedDecks = boTheId
    ? decks.filter(deck => String(deck.boTheId) === boTheId)
    : decks;

  const { data: progressByDeck, isFetching: isCheckingProgress } = useQuery({
    queryKey: ['learning-session-availability', boTheId, selectedDecks.map(deck => deck.boTheId)],
    enabled: selectedDecks.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(selectedDecks.map(async deck => {
        const progress = await apiFetch(`/api/v1/decks/${encodeURIComponent(deck.boTheId)}/progress?size=1000&page=0`);
        return [String(deck.boTheId), progress];
      }));
      return Object.fromEntries(entries);
    },
    staleTime: 30 * 1000
  });

  const directionAvailability = ['EN_VI', 'VI_EN'].reduce((result, direction) => {
    result[direction] = selectedDecks.reduce((total, deck) => {
      const progress = progressByDeck?.[String(deck.boTheId)];
      const available = progress?.items?.filter(item => {
        const state = item.chieu?.[direction]?.nhom;
        return state === 'MOI' || state === 'DEN_HAN' || state === 'QUA_HAN';
      }).length || 0;
      return total + available;
    }, 0);
    return result;
  }, {});

  const selectedDirectionCount = directionAvailability[chieuHoc] || 0;
  const canStart = isCheckingProgress || selectedDirectionCount > 0 || !progressByDeck;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isCheckingProgress && progressByDeck && selectedDirectionCount === 0) {
      setSubmitError(`Chưa có thẻ khả dụng ở chiều ${chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh'} trong lựa chọn hiện tại.`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const session = await apiFetch('/api/v1/learning/sessions', {
        method: 'POST',
        body: JSON.stringify({
          boTheId: boTheId || null,
          chieuHoc,
          quyThoiGian: Number(quyThoiGian),
          cheDo: 'THUONG'
        })
      });
      router.push(`/hoc-phien?id=${session.id}`);
    } catch (submitError) {
      setIsSubmitting(false);
      setSubmitError(submitError.message || 'Chưa thể bắt đầu phiên học.');
    }
  };

  const totals = decks.reduce((total, deck) => ({
    soCanOn: total.soCanOn + deck.soCanOn,
    soMoi: total.soMoi + deck.soMoi
  }), { soCanOn: 0, soMoi: 0 });

  if (isLoading) {
    return <div className="page page-grid with-side"><section className="sheet"><div className="skeleton"><div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div></div></section></div>;
  }

  if (error) {
    return <div className="page page-grid"><section className="sheet error-state"><h2>Chưa tải được danh sách bộ thẻ</h2><p>{error.message}</p><div className="row"><Button variant="secondary" onClick={refetch}>Thử lại</Button><Link className="btn btn-quiet" href="/hom-nay">Hôm nay</Link></div></section></div>;
  }

  return (
    <div className="page page-grid with-side study-picker">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Phiên học</span><span>Chọn bộ, chiều và thời gian</span></div>
          <Link className="btn btn-quiet back-link" href="/hom-nay"><Icon name="arrow-left" />Hôm nay</Link>
          <h1 id="page-title">Chọn phiên học</h1>
          <p>Hệ thống xếp thẻ theo thứ tự: bước học lại đến hạn, thẻ ôn quá hạn và đến hạn, rồi mới đến từ mới trong hạn mức.</p>
        </div>

        {decks.length === 0 ? (
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true"><span data-n="1"><i></i><i></i><i></i><i></i></span><span data-n="2"><i></i><i></i><i></i><i></i></span></div>
            <h2>Chưa có bộ thẻ nào để học</h2>
            <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ thẻ trước.</p>
            <div className="row"><Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link><Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link></div>
          </div>
        ) : (
          <form className="stack-lg" onSubmit={handleSubmit} noValidate>
            <fieldset className="fieldset">
              <legend>Bộ thẻ</legend>
              <div className="choice-grid">
                <Choice name="boTheId" value="" checked={boTheId === ''} onChange={() => setBoTheId('')} title="Tất cả bộ của tôi" description={`${totals.soCanOn} thẻ cần ôn · ${totals.soMoi} từ chưa học`} />
                {decks.map(deck => <Choice key={deck.boTheId} name="boTheId" value={deck.boTheId} checked={boTheId === String(deck.boTheId)} onChange={() => setBoTheId(String(deck.boTheId))} title={deck.ten} description={`${deck.soCanOn} thẻ cần ôn · ${deck.soMoi} từ chưa học`} />)}
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Chiều học</legend>
              <div className="choice-grid cols-2">
                <Choice name="chieuHoc" value="EN_VI" checked={chieuHoc === 'EN_VI'} onChange={() => setChieuHoc('EN_VI')} title={`Anh → Việt${!isCheckingProgress && progressByDeck ? ` (${directionAvailability.EN_VI})` : ''}`} description="Mặt trước là từ tiếng Anh, bạn nhớ lại nghĩa" />
                <Choice name="chieuHoc" value="VI_EN" checked={chieuHoc === 'VI_EN'} onChange={() => setChieuHoc('VI_EN')} title={`Việt → Anh${!isCheckingProgress && progressByDeck ? ` (${directionAvailability.VI_EN})` : ''}`} description="Mặt trước là nghĩa tiếng Việt, bạn nhớ lại từ" />
              </div>
              <p className="field-hint">Mỗi chiều có lịch ôn riêng. Học chiều này không làm thay đổi lịch của chiều kia.</p>
              {!isCheckingProgress && progressByDeck && selectedDirectionCount === 0 && (
                <div className="notice notice-warning" role="status">
                  <Icon name="info" />
                  <span>Chiều đang chọn chưa có thẻ khả dụng. Hãy đổi sang chiều còn thẻ hoặc chọn tất cả bộ thẻ.</span>
                </div>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend>Thời gian</legend>
              <div className="choice-grid cols-3">
                {[['5', '20'], ['10', '40'], ['20', '80']].map(([value, rounds]) => (
                  <Choice key={value} name="quyThoiGian" value={value} checked={quyThoiGian === value} onChange={() => setQuyThoiGian(value)} title={`${value} phút`} description={`khoảng ${rounds} lượt`} />
                ))}
              </div>
              <p className="field-hint">Số lượt là ước tính theo 15 giây mỗi lượt. Khi hết giờ, bạn chấm nốt thẻ đang mở rồi phiên kết thúc.</p>
            </fieldset>

            <div className="form-foot">
              {submitError && (
                <div className="notice notice-warning form-error" role="alert">
                  <Icon name="info" />
                  <span>
                    {submitError}
                    {submitError.includes('Chưa có thẻ nào') && ' Hãy thử đổi chiều học hoặc chọn tất cả bộ thẻ.'}
                  </span>
                </div>
              )}
              <Button type="submit" variant="accent" loading={isSubmitting || isCheckingProgress} disabled={!canStart || isSubmitting}>{isSubmitting ? 'Đang tải...' : isCheckingProgress ? 'Đang kiểm tra thẻ...' : 'Bắt đầu học'}</Button>
              <Link className="btn btn-quiet" href="/hom-nay" aria-disabled={isSubmitting}>Hủy</Link>
            </div>
          </form>
        )}
      </section>

      <aside className="side-col">
        <section className="panel">
          <h2 className="panel-title">Bốn mức tự đánh giá</h2>
          <table className="rate-table"><thead><tr><th>Mức</th><th>Khi nào chọn</th></tr></thead><tbody>
            {ratings.map(([label, key, description]) => <tr key={label}><th>{label} <span className="kbd">{key}</span></th><td>{description}</td></tr>)}
          </tbody></table>
          <p className="small muted">Chọn theo trí nhớ thật của bạn. Đây không phải điểm số, chỉ dùng để xếp lịch ôn.</p>
        </section>
        <section className="panel">
          <h2 className="panel-title">Phím tắt khi học</h2>
          <ul className="queue-order">
            <li><span className="kbd">Space</span> Lật thẻ</li>
            <li><span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span> <span className="kbd">4</span> Quên, Khó, Nhớ, Dễ</li>
            <li><span className="kbd">P</span> Nghe phát âm</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function HocPage() {
  return <Suspense fallback={<div className="flash-note">Đang tải...</div>}><HocContent /></Suspense>;
}
