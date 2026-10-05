'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Icon, Badge } from '@/components/ui';
import styles from './page.module.css';
import { useDeck } from '@/hooks/useDeck';

export default function DeckDetailPage() {
  const params = useParams();
  const [search, setSearch] = useState('');
  
  const { data: deck, isLoading } = useDeck(params.id);

  if (isLoading) return <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (!deck) return <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>Không tìm thấy bộ thẻ.</div>;

  const cards = deck.cards || [];

  return (
    <div className={`${styles.pageGrid} ${styles.withSide}`}>
      <article className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <Link href="/bo-the" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
          <Icon name="arrow-left" /> <span>Bộ của tôi</span>
        </Link>
        
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Badge variant="default"><Icon name={deck.visibility === 'RIENG_TU' ? "lock" : "globe"} /> {deck.visibility === 'RIENG_TU' ? 'Riêng tư' : 'Công khai'}</Badge>
            <Badge variant="primary">{deck.topicName || deck.goal}</Badge>
          </div>
          <h1 className={styles.deckTitle}>{deck.name}</h1>
          {deck.description && <p style={{ color: 'var(--color-ink-2)' }}>{deck.description}</p>}
          
          <div className={styles.actions}>
            <Link href={`/bo-the/${params.id}/the-tao`} style={{ textDecoration: 'none' }}>
              <Button variant="primary"><Icon name="plus" /> Thêm thẻ</Button>
            </Link>
            <Link href={`/bo-the/${params.id}/tien-do`} style={{ textDecoration: 'none' }}>
              <Button variant="secondary"><Icon name="chart" /> Tiến độ</Button>
            </Link>
            <Button variant="secondary"><Icon name="upload" /> Nhập CSV</Button>
            <Button variant="ghost"><Icon name="download" /> Xuất CSV</Button>
            <Link href={`/bo-the/${params.id}/sua`} style={{ textDecoration: 'none' }}>
              <Button variant="ghost"><Icon name="edit" /> Sửa bộ</Button>
            </Link>
          </div>
        </div>

        <div className={styles.listBar}>
          <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Thẻ trong bộ <span style={{ color: 'var(--color-ink-3)' }}>({cards.length})</span></h2>
          <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Input 
              placeholder="Tìm từ hoặc nghĩa" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          {cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--color-ink-2)' }}>Bộ thẻ này chưa có từ nào.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cards.map((c, i) => (
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
          )}
        </div>
      </article>

      <aside className={styles.sideCol}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Thông tin bộ thẻ</h2>
          <dl className={styles.kv}>
            <dt>Chủ đề</dt><dd>{deck.topicName || '-'}</dd>
            <dt>Trình độ</dt><dd>{deck.level === 'CO_BAN' ? 'Cơ bản' : deck.level === 'TRUNG_CAP' ? 'Trung cấp' : deck.level === 'NANG_CAO' ? 'Nâng cao' : 'Mới bắt đầu'}</dd>
            <dt>Số thẻ</dt><dd>{deck.cardCount || cards.length}</dd>
            <dt>Cập nhật</dt><dd>Hôm nay</dd>
          </dl>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link href={`/hoc?boTheId=${params.id}`} style={{ textDecoration: 'none' }}>
              <Button variant="primary" style={{ width: '100%' }}>Học bộ này</Button>
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
