'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui';

const ratings = [
  ['QUEN', 'Quên'],
  ['KHO', 'Khó'],
  ['NHO', 'Nhớ'],
  ['DE', 'Dễ']
];

function formatDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} phút ${seconds % 60} giây`;
}

function formatNextReview(date) {
  if (!date) return 'Chưa lên lịch';
  const diff = Date.parse(date) - Date.now();
  if (diff <= 0) return 'Đến hạn';
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `sau ${minutes} phút`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `sau ${hours} giờ`;
  return new Date(date).toLocaleDateString('vi-VN');
}

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [summary, setSummary] = useState(null);
  const { data: today } = useQuery({
    queryKey: ['learning-today-summary'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  useEffect(() => {
    if (!id) return;
    const stored = sessionStorage.getItem(`learning-summary:${id}`);
    if (stored) {
      try {
        setSummary(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(`learning-summary:${id}`);
      }
    }
  }, [id]);

  if (!id) {
    return <main className="page"><section className="sheet error-state"><h1>Không tìm thấy phiên học</h1><Button variant="secondary" onClick={() => router.push('/hom-nay')}>Về Hôm nay</Button></section></main>;
  }

  if (!summary) {
    return (
      <main className="page">
        <section className="sheet summary-missing">
          <div className="form-head">
            <div className="form-code"><span>Tổng kết phiên</span><span>Đang học</span></div>
            <h1>Phiên này chưa kết thúc</h1>
            <p>Học tiếp để chấm các thẻ còn lại, hoặc kết thúc ngay. Các thẻ đã chấm vẫn được lưu.</p>
          </div>
          <div className="row">
            <Button variant="primary" onClick={() => router.push(`/hoc-phien?id=${id}`)}>Học tiếp</Button>
            <Button variant="secondary" onClick={() => router.push(`/hoc-phien?id=${id}`)}>Mở phiên học</Button>
          </div>
        </section>
      </main>
    );
  }

  const counts = summary.theoDanhGia || {};
  const max = Math.max(1, ...ratings.map(([key]) => counts[key] || 0));
  const direction = summary.chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh';

  return (
    <div className="page page-grid with-side summary-page">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Tổng kết phiên</span><span>{direction}</span></div>
          <h1 id="page-title">{summary.soLuot ? `Bạn đã ôn ${summary.soThe} thẻ` : 'Phiên kết thúc khi chưa chấm thẻ nào'}</h1>
          <p>{summary.boTheTen}</p>
        </div>

        <dl className="tally cols-2 summary-tally">
          <div><dt>Lượt chấm</dt><dd><span className="tally-n">{summary.soLuot}</span> lượt</dd></div>
          <div><dt>Thẻ khác nhau</dt><dd><span className="tally-n">{summary.soThe}</span> thẻ</dd></div>
          <div><dt>Từ mới</dt><dd><span className="tally-n">{summary.soTheMoi}</span> từ</dd></div>
          <div><dt>Thời gian<small>quỹ {summary.quyThoiGian} phút</small></dt><dd>{formatDuration(Math.round((summary.thoiGian || 0) / 1000))}</dd></div>
        </dl>

        <section className="summary-block" aria-labelledby="dist-title">
          <h2 id="dist-title">Mức bạn đã chọn</h2>
          <dl className="summary-dist">
            {ratings.map(([key, label]) => {
              const count = counts[key] || 0;
              return <div key={key}><dt>{label}</dt><dd><div className="meter" role="img" aria-label={`${count} lượt ${label}`}><span style={{ '--v': count / max }} /></div></dd><dd className="num">{count}</dd></div>;
            })}
          </dl>
          <p className="small muted">Đây là tự đánh giá khi ôn, dùng để xếp lịch, không phải điểm số.</p>
        </section>

        {summary.tuCanLuyen?.length > 0 && (
          <section className="summary-block" aria-labelledby="hard-title">
            <h2 id="hard-title">Từ cần luyện thêm</h2>
            <ol className="answer-list">
              {summary.tuCanLuyen.map((word, index) => (
                <li className="answer-row plain-row" key={word.theId}>
                  <span className="answer-no">{index + 1}</span>
                  <div className="entry"><div className="entry-head"><span className="entry-word" lang="en">{word.tu}</span><span className="pos">{word.tuLoai || ''}</span></div><p className="entry-mean">{word.nghiaVi}</p></div>
                  <div className="word-ratings">{word.danhGia?.map(rate => <span key={`${word.theId}-${rate}`} className="badge">{rate === 'QUEN' ? 'Quên' : 'Khó'}</span>)}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="summary-block" aria-labelledby="next-title">
          <h2 id="next-title">Lần ôn tiếp theo</h2>
          {summary.lichTiepTheo?.length ? (
            <ol className="answer-list">
              {summary.lichTiepTheo.map((word, index) => (
                <li className="answer-row plain-row" key={word.theId}>
                  <span className="answer-no">{index + 1}</span>
                  <div className="entry"><span className="entry-word" lang="en">{word.tu}</span><span className="pos">{word.trangThai}</span></div>
                  <span className="when">{formatNextReview(word.hanOnAt)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="muted">Chưa có thẻ nào được chấm.</p>}
        </section>

        <div className="summary-foot">
          <Button variant="primary" onClick={() => router.push('/hoc')}>Học phiên khác</Button>
          <Button variant="secondary" onClick={() => router.push('/hom-nay')}>Về trang Hôm nay</Button>
        </div>
      </section>

      <aside className="side-col">
        <section className="panel">
          <h2 className="panel-title">Chuỗi ngày học</h2>
          <p><span className="tally-n">{today?.chuoiNgay || 0}</span> ngày liên tiếp</p>
          <p className="small muted">{today?.daHocHomNay ? 'Hôm nay đã được tính vào chuỗi.' : 'Hôm nay chưa được tính.'}</p>
        </section>
        <section className="panel">
          <h2 className="panel-title">Gợi ý tiếp theo</h2>
          <p className="small">{summary.tuCanLuyen?.length ? `Bạn chọn Quên hoặc Khó với ${summary.tuCanLuyen.length} từ. Gõ lại từ theo nghĩa giúp nhớ chắc hơn.` : 'Tiếp tục học đều để duy trì chuỗi ngày của bạn.'}</p>
          {summary.tuCanLuyen?.length > 0 && <Button variant="accent" onClick={() => router.push('/luyen-tap')} style={{ marginTop: 'var(--sp-3)' }}>Luyện {summary.tuCanLuyen.length} từ này</Button>}
        </section>
      </aside>
    </div>
  );
}

export default function SummaryPage() {
  return <Suspense fallback={<div className="flash-note">Đang tải tổng kết...</div>}><SummaryContent /></Suspense>;
}
