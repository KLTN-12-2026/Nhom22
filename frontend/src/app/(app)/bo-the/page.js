'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useState } from 'react';
import Link from 'next/link';
import { ErrorState, Pagination, Icon } from '@/components/ui';
import styles from './page.module.css';
import { useDecks } from '@/hooks/useDecks';

export default function DecksPage() {
  const { data: plan } = useQuery({ queryKey: ['learning-settings'], queryFn: () => apiFetch('/api/v1/me/learning-settings') });
  const [activeTab, setActiveTab] = useState('mine');
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useDecks(page);
  const myDecks = (data?.items || []).filter(deck => (activeTab !== 'fav' || deck.yeuThich) && deck.ten.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));

  return (
    <div className={`page page-grid with-side ${styles.withSide}`}>
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Bộ của tôi</span>
            <span id="count-code">{isLoading ? '—' : `${data?.totalElements || 0} bộ`}</span>
          </div>
          <div className={styles.headRow}>
            <h1 id="page-title">Bộ thẻ của bạn</h1>
            <Link className="btn btn-primary" href="/bo-the/tao">
              <Icon name="plus" /> Tạo bộ thẻ
            </Link>
          </div>
        </div>

        <div className={`row-between ${styles.filterRow}`}>
          <div className="tabs" role="tablist" aria-label="Loại bộ thẻ">
            <button className="tab" role="tab" aria-selected={activeTab === 'mine'} onClick={() => setActiveTab('mine')}>Của tôi</button>
            <button className="tab" role="tab" aria-selected={activeTab === 'fav'} onClick={() => setActiveTab('fav')}>Yêu thích</button>
          </div>
          <div className={`input-with-icon ${styles.searchWrap}`}>
            <Icon name="search" />
            <label className="sr-only" htmlFor="q">Tìm trong bộ của tôi</label>
            <input className="input" id="q" type="search" placeholder="Tìm theo tên bộ" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div data-view={isLoading ? 'loading' : error ? 'error' : myDecks.length > 0 ? 'ready' : 'empty'}>
          <div data-when="error"><ErrorState description={error?.message} onRetry={refetch} /></div>
          <div data-when="loading">
            <div className="skeleton">
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>

          <div data-when="ready">
            <div className="deck-head has-actions" aria-hidden="true">
              <span>Số</span><span>Bộ thẻ</span><span>Trình độ</span><span></span>
            </div>
            <ol className="answer-list" role="list">
              {myDecks.map((deck, i) => (
                <li key={deck.id} className="answer-row deck-row has-actions">
                  <span className="answer-no">{i + 1}</span>
                  <div className="answer-main">
                    <Link className="answer-title" href={`/bo-the/${deck.id}`}>{deck.ten}</Link>
                    <div className="answer-meta">
                      {deck.quyenTruyCap === 'CONG_KHAI'
                        ? <span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span>
                        : <span className="stamp stamp-quiet"><Icon name="lock" />Riêng tư</span>
                      }
                      <span>Sửa {deck.updatedAt ? new Date(deck.updatedAt).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                  </div>
                  <div className="deck-cols">

                    <span className="level">
                      <span className="bubble-row" aria-hidden="true">
                        {[1, 2, 3, 4].map(n => {
                          const lvl = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
                          return <span key={n} className={`bubble${(lvl[deck.trinhDo] || 0) >= n ? ' is-filled' : ''}`}></span>;
                        })}
                      </span>
                      {deck.trinhDo === 'CO_BAN' ? 'Cơ bản' : deck.trinhDo === 'TRUNG_CAP' ? 'Trung cấp' : deck.trinhDo === 'NANG_CAO' ? 'Nâng cao' : 'Mới bắt đầu'}
                    </span>

                  </div>
                  <div className="deck-actions">
                    <Link className="btn btn-secondary btn-sm" href={`/bo-the/${deck.id}`}>Mở</Link>
                    <Link className="btn btn-quiet btn-sm" href={`/bo-the/tao?id=${deck.id}`}>Sửa</Link>
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
              <h2>{search ? 'Không tìm thấy bộ phù hợp' : activeTab === 'fav' ? 'Chưa có bộ yêu thích trong trang này' : 'Bạn chưa có bộ thẻ nào'}</h2>
              <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ đầu tiên.</p>
              <div className="row">
                <Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link>
                <Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link>
              </div>
            </div>
          </div>
        </div>
        <Pagination page={page + 1} totalPages={data?.totalPages || 0} onPageChange={n => setPage(n - 1)} />
        <p className="field-hint">Tìm kiếm và yêu thích lọc trong trang hiện tại.</p>
      </section>

      <aside className={styles.sideCol}>
        <section className="panel" aria-labelledby="plan-title">
          <h2 className="panel-title" id="plan-title">Kế hoạch mỗi ngày</h2>
          <div className={styles.plan}>
            <p className={styles.planLine}><span>Thời gian</span><span>{plan?.phutMoiNgay ?? '—'} phút/ngày</span></p>
            <p className={styles.planLine}><span>Mục tiêu</span><span>{plan?.mucTieu === 'TOEIC' ? 'TOEIC' : plan?.mucTieu === 'GIAO_TIEP' ? 'Giao tiếp' : 'Chưa chọn'}</span></p>
          </div>
          <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap" style={{ marginLeft: '-12px' }}>Đổi thiết lập học</Link>
        </section>
        <section className="panel" aria-labelledby="csv-title">
          <h2 className="panel-title" id="csv-title">Có sẵn danh sách từ?</h2>
          <p className="small muted">Nhập CSV sẽ mở khi chức năng quản lý thẻ sẵn sàng.</p>
        </section>
      </aside>
    </div>
  );
}
