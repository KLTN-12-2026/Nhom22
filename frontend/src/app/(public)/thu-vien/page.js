'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Select, Badge, Card, CardHeader, CardBody } from '@/components/ui';
import styles from './page.module.css';
import { useTopics } from '@/hooks/useTopics';
import { useLibraryDecks } from '@/hooks/useLibraryDecks';

export default function LibraryPage() {
  const [topicId, setTopicId] = useState('');
  
  const { data: topics = [] } = useTopics();
  const { data: decksData, isLoading } = useLibraryDecks({ topicId });
  
  const decks = decksData?.items || [];
  const total = decksData?.totalElements || 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      <div className={styles.pageGrid}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
              <span>Thư viện công khai</span> &gt; <span>Giao tiếp và TOEIC</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>Thư viện bộ thẻ</h1>
            <p style={{ color: 'var(--color-ink-2)' }}>Sao chép một bộ về tài khoản để học. Bộ mẫu do nhóm biên soạn kiểm tra nội dung; bộ chia sẻ do người học đăng công khai.</p>
          </div>

          <form className={styles.filters}>
            <div className={styles.search}>
              <Input id="q" name="q" placeholder="Ví dụ: invoice, sân bay…" label="Tìm bộ thẻ hoặc từ" />
            </div>
            <div>
              <Select id="goal" name="goal" label="Mục tiêu" options={[
                { value: '', label: 'Tất cả' }, { value: 'GIAO_TIEP', label: 'Giao tiếp' }, { value: 'TOEIC', label: 'TOEIC' }
              ]} />
            </div>
            <div>
              <Select id="topicId" name="topicId" label="Chủ đề" value={topicId} onChange={(e) => setTopicId(e.target.value)} options={[
                { value: '', label: 'Tất cả' }, ...topics.map(t => ({ value: t.id, label: t.name }))
              ]} />
            </div>
            <div>
              <Select id="level" name="level" label="Trình độ" options={[
                { value: '', label: 'Tất cả' }, { value: 'MOI_BAT_DAU', label: 'Mới bắt đầu' }, { value: 'CO_BAN', label: 'Cơ bản' }, { value: 'TRUNG_CAP', label: 'Trung cấp' }, { value: 'NANG_CAO', label: 'Nâng cao' }
              ]} />
            </div>
            <div>
              <Select id="source" name="source" label="Nguồn" options={[
                { value: '', label: 'Tất cả' }, { value: 'MAU', label: 'Bộ mẫu' }, { value: 'CHIA_SE', label: 'Người học chia sẻ' }
              ]} />
            </div>
          </form>

          <div className={styles.resultBar}>
            <p className="muted" style={{ color: 'var(--color-ink-2)' }}>{total} bộ thẻ</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label htmlFor="sort" style={{ fontSize: 'var(--font-size-sm)' }}>Sắp xếp</label>
              <Select id="sort" options={[
                { value: 'updated', label: 'Mới cập nhật' }, { value: 'name', label: 'Tên A–Z' }, { value: 'size', label: 'Nhiều thẻ nhất' }
              ]} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {isLoading ? <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Đang tải...</div> : 
             decks.map((deck, i) => (
              <div key={deck.id} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)' }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <Link href={`/thu-vien/${deck.id}`} style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-primary-strong)', textDecoration: 'none' }}>{deck.name}</Link>
                  <p style={{ color: 'var(--color-ink-2)', marginTop: 'var(--space-1)' }}>{deck.description}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', alignItems: 'center' }}>
                    <Badge variant={deck.kind === 'MAU' ? 'primary' : 'default'}>{deck.kind === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</Badge>
                    <span>{deck.topicName}</span>
                    <span style={{ color: 'var(--color-ink-3)' }}>Cập nhật 29/09/2026</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ fontWeight: 'bold' }}>{deck.goal === 'GIAO_TIEP' ? 'Giao tiếp' : 'TOEIC'}</span>
                  <span>{deck.level === 'CO_BAN' ? 'Cơ bản' : 'Trung cấp'}</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{deck.cardCount} thẻ</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <section className={styles.sideTopics}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '2px solid var(--color-primary-tint)' }}>Chủ đề</h2>
            <ul className={styles.topicLinks}>
              <li>
                <button aria-current={topicId === '' ? 'true' : undefined} onClick={() => setTopicId('')}>
                  <span>Tất cả chủ đề</span>
                </button>
              </li>
              {topics.map(t => (
                <li key={t.id}>
                  <button aria-current={topicId === t.id ? 'true' : undefined} onClick={() => setTopicId(t.id)}>
                    <span>{t.name}</span>
                    <span className={styles.num}>{t.deckCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '2px solid var(--color-primary-tint)' }}>Cách đọc nhãn</h2>
            <div className={styles.legend}>
              <div>
                <span><Badge variant="primary">Bộ mẫu</Badge></span>
                <p style={{ color: 'var(--color-ink-3)' }}>Nhóm biên soạn soạn và kiểm tra nghĩa, ví dụ, nguồn.</p>
              </div>
              <div>
                <span><Badge>Người học chia sẻ</Badge></span>
                <p style={{ color: 'var(--color-ink-3)' }}>Bộ do người học đăng công khai. Kiểm tra lại trước khi học.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
