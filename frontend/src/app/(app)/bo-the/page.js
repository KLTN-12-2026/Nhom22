'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import styles from './page.module.css';
import { useDecks } from '@/hooks/useDecks';

export default function DecksPage() {
  const [activeTab, setActiveTab] = useState('mine');
  const [search, setSearch] = useState('');

  const { data: myDecks = [], isLoading } = useDecks();

  return (
    <div className={`page page-grid with-side ${styles.withSide}`}>
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Bộ của tôi</span>
            <span id="count-code">{isLoading ? '—' : `${myDecks.length} bộ`}</span>
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

        <div data-view={isLoading ? 'loading' : myDecks.length > 0 ? 'ready' : 'empty'}>
          <div data-when="loading">
            <div className="skeleton">
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>

          <div data-when="ready">
            <div className="deck-head has-actions" aria-hidden="true">
              <span>Số</span><span>Bộ thẻ</span><span>Mục tiêu</span><span>Trình độ</span><span>Số thẻ</span><span></span>
            </div>
            <ol className="answer-list" role="list">
              {myDecks.map((deck, i) => (
                <li key={deck.id} className="answer-row deck-row has-actions">
                  <span className="answer-no">{i + 1}</span>
                  <div className="answer-main">
                    <Link className="answer-title" href={`/bo-the/${deck.id}`}>{deck.name}</Link>
                    <div className="answer-meta">
                      {deck.visibility === 'CONG_KHAI'
                        ? <span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span>
                        : <span className="stamp stamp-quiet"><Icon name="lock" />Riêng tư</span>
                      }
                      <span>Sửa {deck.updatedAt ? new Date(deck.updatedAt).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                  </div>
                  <div className="deck-cols">
                    <span>{deck.goal === 'GIAO_TIEP' ? 'Giao tiếp' : 'TOEIC'}</span>
                    <span className="level">
                      <span className="bubble-row" aria-hidden="true">
                        {[1, 2, 3, 4].map(n => {
                          const lvl = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
                          return <span key={n} className={`bubble${(lvl[deck.level] || 0) >= n ? ' is-filled' : ''}`}></span>;
                        })}
                      </span>
                      {deck.level === 'CO_BAN' ? 'Cơ bản' : deck.level === 'TRUNG_CAP' ? 'Trung cấp' : deck.level === 'NANG_CAO' ? 'Nâng cao' : 'Mới bắt đầu'}
                    </span>
                    <span className="col-count">{deck.cardCount} thẻ</span>
                  </div>
                  <div className="deck-actions">
                    <Link className="btn btn-secondary btn-sm" href={`/bo-the/${deck.id}`}>Mở</Link>
                    <Link className="btn btn-quiet btn-sm" href={`/bo-the/${deck.id}/sua`}>Sửa</Link>
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
              <h2>Bạn chưa có bộ thẻ nào</h2>
              <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ đầu tiên.</p>
              <div className="row">
                <Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link>
                <Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className={styles.sideCol}>
        <section className="panel" aria-labelledby="plan-title">
          <h2 className="panel-title" id="plan-title">Kế hoạch mỗi ngày</h2>
          <div className={styles.plan}>
            <p className={styles.planLine}><span>Mục tiêu</span><span>Chưa chọn</span></p>
          </div>
          <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap" style={{ marginLeft: '-12px' }}>Đổi thiết lập học</Link>
        </section>
        <section className="panel" aria-labelledby="csv-title">
          <h2 className="panel-title" id="csv-title">Có sẵn danh sách từ?</h2>
          <p className="small muted">Mở một bộ thẻ rồi chọn <strong>Nhập CSV</strong> để thêm nhiều thẻ một lần. Tệp tối đa 1000 dòng.</p>
        </section>
      </aside>
    </div>
  );
}
