'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Tabs, Badge } from '@/components/ui';
import styles from './page.module.css';

const MOCK_MY_DECKS = [
  { id: '1', name: '3000 từ vựng Oxford', goal: 'GIAO_TIEP', level: 'CO_BAN', cardCount: 3000 },
  { id: '2', name: 'IT Tiếng Anh', goal: 'TOEIC', level: 'TRUNG_CAP', cardCount: 150 },
];

export default function DecksPage() {
  const [activeTab, setActiveTab] = useState('mine');
  const [search, setSearch] = useState('');

  return (
    <div className={`${styles.pageGrid} ${styles.withSide}`}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Bộ của tôi</span>
            <span>{MOCK_MY_DECKS.length} bộ</span>
          </div>
          <div className={styles.headRow}>
            <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Bộ thẻ của bạn</h1>
            <Link href="/bo-the/tao" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Tạo bộ thẻ</Button>
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', border: 'none', background: activeTab === 'mine' ? 'var(--color-ink)' : 'var(--color-border)', color: activeTab === 'mine' ? 'white' : 'var(--color-ink)', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setActiveTab('mine')}
            >
              Của tôi
            </button>
            <button 
              style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', border: 'none', background: activeTab === 'fav' ? 'var(--color-ink)' : 'var(--color-border)', color: activeTab === 'fav' ? 'white' : 'var(--color-ink)', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setActiveTab('fav')}
            >
              Yêu thích
            </button>
          </div>
          <div style={{ flex: '1 1 220px', maxWidth: '320px' }}>
            <Input 
              placeholder="Tìm theo tên bộ" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {MOCK_MY_DECKS.length > 0 ? (
          <div>
            <div className={styles.deckHead} style={{ display: 'none' /* hidden on mobile, handle via CSS later */ }}>
              <span>Số</span><span>Bộ thẻ</span><span>Mục tiêu</span><span>Trình độ</span><span style={{ textAlign: 'right' }}>Số thẻ</span><span></span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {MOCK_MY_DECKS.map((deck, i) => (
                <li key={deck.id} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', width: '2rem' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/bo-the/${deck.id}`} style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-primary-strong)', textDecoration: 'none' }}>
                      {deck.name}
                    </Link>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
                      <span>{deck.goal === 'GIAO_TIEP' ? 'Giao tiếp' : 'TOEIC'}</span>
                      <span>•</span>
                      <span>{deck.level === 'CO_BAN' ? 'Cơ bản' : 'Trung cấp'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {deck.cardCount} thẻ
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-ink-2)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>Bạn chưa có bộ thẻ nào</h2>
            <p style={{ marginBottom: 'var(--space-4)' }}>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ đầu tiên.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <Link href="/thu-vien"><Button variant="primary">Xem thư viện</Button></Link>
              <Link href="/bo-the/tao"><Button variant="secondary">Tạo bộ thẻ</Button></Link>
            </div>
          </div>
        )}
      </section>

      <aside className={styles.sideCol}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Kế hoạch mỗi ngày</h2>
          <div className={styles.plan}>
            <div className={styles.planLine}><span>Mục tiêu</span><span>TOEIC</span></div>
            <div className={styles.planLine}><span>Thời gian</span><span>10 phút</span></div>
          </div>
          <Link href="/ca-nhan/hoc-tap" style={{ display: 'inline-block', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            Đổi thiết lập học
          </Link>
        </section>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Có sẵn danh sách từ?</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            Mở một bộ thẻ rồi chọn <strong>Nhập CSV</strong> để thêm nhiều thẻ một lần. Tệp tối đa 1000 dòng.
          </p>
        </section>
      </aside>
    </div>
  );
}
