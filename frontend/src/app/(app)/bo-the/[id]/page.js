'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Icon, Badge } from '@/components/ui';
import styles from './page.module.css';

const MOCK_CARDS = [
  { id: 'c1', word: 'receipt', ipa: '/rɪˈsiːt/', pos: 'n.', meaningVi: 'biên lai, giấy biên nhận', exampleEn: 'Can I have a receipt, please?' },
  { id: 'c2', word: 'postpone', ipa: '/pəʊstˈpəʊn/', pos: 'v.', meaningVi: 'hoãn lại', exampleEn: 'The meeting has been postponed until Friday.' },
];

export default function DeckDetailPage({ params }) {
  const [search, setSearch] = useState('');

  return (
    <div className={`${styles.pageGrid} ${styles.withSide}`}>
      <article className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <Link href="/bo-the" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
          <Icon name="arrow-left" /> <span>Bộ của tôi</span>
        </Link>
        
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Badge variant="default"><Icon name="lock" /> Riêng tư</Badge>
            <Badge variant="primary">Giao tiếp</Badge>
          </div>
          <h1 className={styles.deckTitle}>Bộ thẻ demo ({params.id})</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Mô tả ngắn gọn về bộ thẻ này.</p>
          
          <div className={styles.actions}>
            <Link href={`/bo-the/${params.id}/the-tao`} style={{ textDecoration: 'none' }}>
              <Button variant="primary"><Icon name="plus" /> Thêm thẻ</Button>
            </Link>
            <Button variant="secondary"><Icon name="upload" /> Nhập CSV</Button>
            <Button variant="ghost"><Icon name="download" /> Xuất CSV</Button>
            <Link href={`/bo-the/${params.id}/sua`} style={{ textDecoration: 'none' }}>
              <Button variant="ghost"><Icon name="edit" /> Sửa bộ</Button>
            </Link>
          </div>
        </div>

        <div className={styles.listBar}>
          <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Thẻ trong bộ <span style={{ color: 'var(--color-ink-3)' }}>({MOCK_CARDS.length})</span></h2>
          <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Input 
              placeholder="Tìm từ hoặc nghĩa" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {MOCK_CARDS.map((c, i) => (
              <li key={c.id} className={styles.cardRow}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', paddingTop: '4px' }}>{i + 1}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-word)' }}>{c.word}</span>
                    {c.ipa && <span style={{ color: 'var(--color-ink-2)', fontFamily: 'var(--font-word)' }}>{c.ipa}</span>}
                    {c.pos && <span style={{ color: 'var(--color-primary)', fontStyle: 'italic', fontSize: 'var(--font-size-sm)' }}>{c.pos}</span>}
                  </div>
                  <p style={{ fontWeight: '500' }}>{c.meaningVi}</p>
                  {c.exampleEn && <p style={{ color: 'var(--color-ink-2)', fontStyle: 'italic', marginTop: '4px' }}>{c.exampleEn}</p>}
                </div>
                <div className={styles.cardTools}>
                  <Button variant="ghost" size="sm" style={{ padding: '0 8px' }}><Icon name="volume" /> Nghe</Button>
                  <Button variant="ghost" size="sm" style={{ padding: '0 8px' }}><Icon name="edit" /> Sửa</Button>
                  <Button variant="ghost" size="sm" style={{ padding: '0 8px', color: 'var(--color-danger)' }}><Icon name="trash" /> Xóa</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <aside className={styles.sideCol}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Thông tin bộ thẻ</h2>
          <dl className={styles.kv}>
            <dt>Chủ đề</dt><dd>Giao tiếp</dd>
            <dt>Trình độ</dt><dd>Cơ bản</dd>
            <dt>Số thẻ</dt><dd>2</dd>
            <dt>Cập nhật</dt><dd>Hôm nay</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
