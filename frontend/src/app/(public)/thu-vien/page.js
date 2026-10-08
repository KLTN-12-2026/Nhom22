'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { libraryPage } from '@/lib/library-query.mjs';
import styles from './page.module.css';
import { useTopics } from '@/hooks/useTopics';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';

export default function LibraryPage() {
  return <Suspense fallback={<p className="page" role="status">Đang tải thư viện…</p>}><LibraryContent /></Suspense>;
}

function LibraryContent() {
  const router = useRouter();
  const search = useSearchParams();
  const topicId = search.get('chuDeId') || '';
  const q = search.get('q') || '';
  const goal = search.get('mucTieu') || '';
  const level = search.get('trinhDo') || '';
  const source = search.get('nguon') || '';
  const sort = search.get('sort') || 'updated';
  const page = libraryPage(search.get('page'));
  const requestedSize = Number(search.get('size') || 20);
  const size = Number.isInteger(requestedSize) && requestedSize >= 1 && requestedSize <= 100 ? requestedSize : 20;
  const change = (key, value) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    window.history.replaceState(null, '', `/thu-vien?${next}`);
  };
  const setTopicId = value => change('chuDeId', value);
  const setQ = value => change('q', value);
  const setGoal = value => change('mucTieu', value);
  const setLevel = value => change('trinhDo', value);
  const setSource = value => change('nguon', value);
  const setSort = value => change('sort', value);
  
  const { data: topics = [], error: topicsError, refetch: reloadTopics } = useTopics();
  const { data: decksData, isLoading, error, refetch } = useLibraryDecks({ chuDeId: topicId, q, mucTieu: goal, trinhDo: level, nguon: source, sort, page, size });
  
  const decks = decksData?.items || [];
  const total = decksData?.totalElements || 0;

  const LEVEL_LABEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Thư viện công khai</span><span>Giao tiếp và TOEIC</span>
          </div>
          <h1 id="page-title">Thư viện bộ thẻ</h1>
          <p>Xem nội dung bộ mẫu và bộ do người học chia sẻ trước khi chọn tài liệu học.</p>
        </div>

        <form className={styles.filters} id="filters" role="search" aria-label="Lọc thư viện" onSubmit={(e) => e.preventDefault()}>
          <div className={`field ${styles.search}`}>
            <label className="field-label" htmlFor="q">Tìm tên hoặc mô tả bộ thẻ</label>
            <div className="input-with-icon">
              <Icon name="search" />
              <input 
                className="input" 
                id="q" 
                name="q" 
                type="search" 
                placeholder="Ví dụ: invoice, sân bay…" 
                autoComplete="off" 
                maxLength={150}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          
          <div className="field">
            <label className="field-label" htmlFor="goal">Mục tiêu</label>
            <select className="select" id="goal" name="goal" value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="GIAO_TIEP">Giao tiếp</option>
              <option value="TOEIC">TOEIC</option>
            </select>
          </div>
          
          <div className="field">
            <label className="field-label" htmlFor="topicId">Chủ đề</label>
            <select className="select" id="topicId" name="topicId" value={topicId} onChange={e => setTopicId(e.target.value)}>
              <option value="">Tất cả</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.ten}</option>
              ))}
            </select>
          </div>
          
          <div className="field">
            <label className="field-label" htmlFor="level">Trình độ</label>
            <select className="select" id="level" name="level" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="MOI_BAT_DAU">Mới bắt đầu</option>
              <option value="CO_BAN">Cơ bản</option>
              <option value="TRUNG_CAP">Trung cấp</option>
              <option value="NANG_CAO">Nâng cao</option>
            </select>
          </div>
          
          <div className="field">
            <label className="field-label" htmlFor="source">Nguồn</label>
            <select className="select" id="source" name="source" value={source} onChange={e => setSource(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="MAU">Bộ mẫu</option>
              <option value="CHIA_SE">Người học chia sẻ</option>
            </select>
          </div>
        </form>

        <div className={styles.resultBar}>
          <p id="result-count" className="muted" aria-live="polite">
            {total} bộ thẻ
          </p>
          <div className={styles.resultControls}>
            <div className={styles.resultControl}>
            <label htmlFor="size" className="caption">Mỗi trang</label>
            <select className="select" id="size" value={size} onChange={e => change('size', e.target.value)}>
              {[5, 10, 20, 50, 100].map(value => <option key={value} value={value}>{value} bộ</option>)}
            </select>
            </div>
            <div className={styles.resultControl}>
            <label htmlFor="sort" className="caption">Sắp xếp</label>
            <select className="select" id="sort" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="updated">Mới cập nhật</option>
              <option value="name">Tên A–Z</option>
              <option value="size">Nhiều thẻ nhất</option>
            </select>
            </div>
          </div>
        </div>

        {error && <ErrorState description={error.message} onRetry={refetch} />}
        {topicsError && <ErrorState title="Không tải được chủ đề" description={topicsError.message} onRetry={reloadTopics} />}
        <div data-view={error ? "error" : isLoading ? "loading" : (decks.length > 0 ? "ready" : "empty")} id="region">
          <div data-when="loading">
            <div className="skeleton" aria-label="Đang tải thư viện">
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>
          
          <div data-when="ready">
            <div className="deck-head" aria-hidden="true">
              <span>Số</span>
              <span>Bộ thẻ</span>
              <span>Mục tiêu</span>
              <span>Trình độ</span>
              <span style={{ textAlign: 'right' }}>Số thẻ</span>
            </div>
            <ol className="answer-list" id="list" role="list">
              {decks.map((deck, i) => (
                <li key={deck.id} className="answer-row deck-row">
                  <span className="answer-no">{page * size + i + 1}</span>
                  <div className="answer-main">
                    <Link className="answer-title" href={`/thu-vien/${deck.id}`}>{deck.ten}</Link>
                    <p className="muted clamp-2">{deck.moTa}</p>
                    <div className="answer-meta">
                      {deck.nguon === 'MAU' ? (
                        <span className="stamp stamp-solid">Bộ mẫu</span>
                      ) : (
                        <span className="stamp stamp-graphite">Người học chia sẻ</span>
                      )}
                      <span>{deck.tenChuDe || 'Chưa phân chủ đề'}</span>
                      <span className="muted">Cập nhật {new Date(deck.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="deck-cols">
                  <span className="deck-goal">{deck.mucTieu === 'GIAO_TIEP' ? 'Giao tiếp' : deck.mucTieu === 'TOEIC' ? 'TOEIC' : 'Chưa đặt mục tiêu'}</span>
                  <span className="deck-level">
                    <span className="level" title="Trình độ tự đánh giá">
                      <span className="bubble-row" aria-hidden="true">
                        {[1, 2, 3, 4].map(n => {
                          const lvlMap = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
                          return <span key={n} className={`bubble${lvlMap[deck.trinhDo] >= n ? ' is-filled' : ''}`}></span>;
                        })}
                      </span>
                      {LEVEL_LABEL[deck.trinhDo]}
                    </span>
                  </span>
                  <span className="deck-size">
                    <span className="col-count">{deck.soThe} thẻ</span>
                  </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          
          <div data-when="empty">
            <div className="empty">
              <div className="empty-sheet" aria-hidden="true">
                <span data-n="1"><i></i><i></i><i></i><i></i></span>
                <span data-n="2"><i></i><i></i><i></i><i></i></span>
                <span data-n="3"><i></i><i></i><i></i><i></i></span>
              </div>
              <h2>Không có bộ thẻ nào khớp bộ lọc</h2>
              <p>Thử từ khóa ngắn hơn hoặc bỏ bớt điều kiện lọc.</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                id="clear"
                onClick={() => router.replace('/thu-vien', { scroll: false })}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
        <Pagination page={page + 1} totalPages={decksData?.totalPages || 0} onPageChange={value => change('page', String(value - 1))} />
      </section>

      <aside className="side-col">
        <section className={`panel ${styles.sideTopics}`} aria-labelledby="t-title">
          <h2 className="panel-title" id="t-title">Chủ đề</h2>
          <ul className={styles.topicLinks} id="topic-links">
            <li>
              <button aria-current={topicId === '' ? 'true' : undefined} onClick={() => setTopicId('')}>
                <span>Tất cả chủ đề</span>
              </button>
            </li>
            {topics.map(t => (
              <li key={t.id}>
                <button aria-current={topicId === t.id ? 'true' : undefined} onClick={() => setTopicId(t.id)}>
                  <span>{t.ten}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="l-title">
          <h2 className="panel-title" id="l-title">Cách đọc nhãn</h2>
          <div className={styles.legend}>
            <div>
              <span><span className="stamp stamp-solid">Bộ mẫu</span></span>
              <p className="muted">Bộ khởi động do dự án cung cấp. Đọc nghĩa và ví dụ trước khi học.</p>
            </div>
            <div>
              <span><span className="stamp stamp-graphite">Người học chia sẻ</span></span>
              <p className="muted">Bộ do người học đăng công khai. Kiểm tra lại trước khi học.</p>
            </div>
            <div>
              <span className="level">
                <span className="bubble-row"><span className="bubble is-filled"></span><span className="bubble is-filled"></span><span className="bubble is-filled"></span><span className="bubble"></span></span>
                Trung cấp
              </span>
              <p className="muted">Trình độ do người soạn tự đánh giá, không phải chứng nhận.</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
