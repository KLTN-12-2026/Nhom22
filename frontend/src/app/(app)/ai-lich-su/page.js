'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const REQUESTS = [
  { title: 'Tạo thẻ từ đoạn văn', type: 'draft', state: 'Xong', detail: '3 bản nháp · 2 được chọn', time: 'Hôm nay, 10:24' },
  { title: 'Viết câu với receipt', type: 'sentence', state: 'Xong', detail: 'Phản hồi tiếng Việt', time: 'Hôm qua, 16:40' },
  { title: 'Giải thích ngữ cảnh', type: 'context', state: 'Lỗi', detail: 'Có thể thử lại thủ công', time: 'Hôm qua, 13:15' },
  { title: 'Tạo bài luyện', type: 'exercise', state: 'Chờ', detail: 'Chưa có kết quả', time: 'Hôm qua, 11:05' },
  { title: 'Tạo thẻ từ đoạn văn', type: 'draft', state: 'Chưa xác định', detail: 'Cần kiểm tra trạng thái', time: 'Hôm qua, 09:12' },
  { title: 'Viết câu với appointment', type: 'sentence', state: 'Xong', detail: 'Đã xem phản hồi', time: '31/10/2026, 16:40' },
];

const TYPE_LABELS = {
  all: 'Tất cả',
  draft: 'Tạo thẻ',
  sentence: 'Viết câu',
  context: 'Ngữ cảnh',
  exercise: 'Bài luyện',
};

const STATE_CLASS = {
  Xong: 'stamp-success',
  Lỗi: 'stamp-danger',
  Chờ: 'stamp-warning',
  'Chưa xác định': 'stamp-warning',
};

export default function AiHistoryPage() {
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const filteredRequests = useMemo(
    () => REQUESTS.filter(request => type === 'all' || request.type === type),
    [type],
  );
  const pageSize = 3;
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const visibleRequests = filteredRequests.slice(page * pageSize, page * pageSize + pageSize);

  const changeType = (event) => {
    setType(event.target.value);
    setPage(0);
    setSelectedRequest(null);
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/ai-xuong-the">Xưởng thẻ AI</Link>
      </div>

      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link>
          <span aria-hidden="true">/</span>
          <span>Lịch sử AI và hạn mức</span>
        </nav>

        <div className="form-head">
          <div className="form-code">
            <span>Học và mở rộng</span>
            <span>UI32 · Đợt 3</span>
          </div>
          <h1 id="page-title">Lịch sử AI và hạn mức</h1>
          <p>Theo dõi yêu cầu, kết quả và lượt sử dụng còn lại.</p>
        </div>

        <div className="d3-metrics">
          <div className="d3-metric"><strong>2 / 10</strong><span>Lượt AI mẫu hôm nay</span></div>
          <div className="d3-metric"><strong>8 lượt</strong><span>Còn lại · làm mới lúc 00:00</span></div>
          <div className="d3-metric"><strong>6</strong><span>Yêu cầu trong lịch sử</span></div>
          <div className="d3-metric"><strong>3</strong><span>Yêu cầu đã hoàn tất</span></div>
        </div>

        <section className={styles.historySection} aria-labelledby="history-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="history-title">Lịch sử yêu cầu AI mẫu</h2>
              <p className="small muted">Kết quả AI chỉ là gợi ý; hãy kiểm tra trước khi đưa vào bộ thẻ.</p>
            </div>
            <Link className="btn btn-primary" href="/ai-viet-cau">Viết câu mới</Link>
          </div>

          <form className={styles.filter} onSubmit={event => event.preventDefault()}>
            <div className="field">
              <label className="field-label" htmlFor="history-type">Loại yêu cầu</label>
              <select className="select" id="history-type" value={type} onChange={changeType}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <button className="btn btn-secondary" type="submit"><Icon name="filter" />Lọc</button>
          </form>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">Danh sách các yêu cầu AI</caption>
              <thead>
                <tr><th scope="col">Yêu cầu</th><th scope="col">Trạng thái</th><th scope="col">Kết quả</th><th scope="col">Thời gian</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr>
              </thead>
              <tbody>
                {visibleRequests.map(request => (
                  <tr key={`${request.title}-${request.time}`}>
                    <td data-label="Yêu cầu"><strong>{request.title}</strong><span className="small muted">{TYPE_LABELS[request.type]}</span></td>
                    <td data-label="Trạng thái"><span className={`stamp ${STATE_CLASS[request.state] || 'stamp-quiet'}`}>{request.state}</span></td>
                    <td data-label="Kết quả">{request.detail}</td>
                    <td data-label="Thời gian"><span className="small muted">{request.time}</span></td>
                    <td data-label=""><button className="btn btn-secondary btn-sm" type="button" onClick={() => setSelectedRequest(request)}>Chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRequest && (
            <div className={styles.detail} role="status">
              <div>
                <strong>{selectedRequest.title}</strong>
                <p className="small muted">{selectedRequest.detail} · {selectedRequest.time}</p>
              </div>
              <button className="btn btn-quiet btn-sm" type="button" onClick={() => setSelectedRequest(null)} aria-label="Đóng chi tiết"><Icon name="x" /></button>
            </div>
          )}

          <div className={styles.pager} aria-label="Phân trang lịch sử">
            <button className="btn btn-secondary btn-sm" type="button" disabled={page === 0} onClick={() => setPage(current => current - 1)}><Icon name="chevron-left" />Trước</button>
            <span className="small muted">Trang {page + 1} / {totalPages || 1}</span>
            <button className="btn btn-secondary btn-sm" type="button" disabled={page >= totalPages - 1} onClick={() => setPage(current => current + 1)}>Sau<Icon name="chevron-right" /></button>
          </div>
        </section>

        <footer className={styles.footer}>
          <Link className="btn btn-primary" href="/ai-xuong-the">Tạo bản nháp mới</Link>
          <Link className="btn btn-quiet" href="/bo-the">Về bộ thẻ</Link>
        </footer>
      </article>
    </div>
  );
}
