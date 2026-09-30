'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea, Icon } from '@/components/ui';
import styles from './page.module.css';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useTopics } from '@/hooks/useTopics';

export default function CreateDeckPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: topics = [] } = useTopics();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [goal, setGoal] = useState('GIAO_TIEP');
  const [topicId, setTopicId] = useState('');
  const [level, setLevel] = useState('MOI_BAT_DAU');
  const [visibility, setVisibility] = useState('RIENG_TU');

  const createMutation = useMutation({
    mutationFn: (data) => apiFetch('/api/v1/decks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-decks'] });
      router.push(`/bo-the/${res.id}`);
    },
    onError: (err) => {
      alert(err.message || 'Lỗi khi tạo bộ thẻ');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      name, description: desc, goal, topicId, level, visibility
    });
  };

  return (
    <div className="page-grid with-side" style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Phiếu tạo bộ thẻ</span>
          </div>
          <Link href="/bo-the" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
            <Icon name="arrow-left" /> <span>Bộ của tôi</span>
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Tạo bộ thẻ</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <Input 
              label="Tên bộ thẻ" 
              placeholder="Ví dụ: TOEIC Part 5 — từ hay sai" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              maxLength={160}
            />
            <p style={{ textAlign: 'right', fontSize: 'var(--font-size-xs)', color: name.length > 150 ? 'var(--color-danger)' : 'var(--color-ink-3)' }}>
              {name.length}/150
            </p>
          </div>

          <Textarea 
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mô tả</span><span style={{ color: 'var(--color-ink-3)', fontWeight: 'normal' }}>Không bắt buộc</span>
              </div>
            }
            placeholder="Bộ này dùng để làm gì, lấy từ đâu" 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            maxLength={1000}
          />

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Mục tiêu</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: goal === 'GIAO_TIEP' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="goal" value="GIAO_TIEP" checked={goal === 'GIAO_TIEP'} onChange={() => setGoal('GIAO_TIEP')} /> 
                <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>A</span>
                <span style={{ fontWeight: 'bold' }}>Giao tiếp</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: goal === 'TOEIC' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="goal" value="TOEIC" checked={goal === 'TOEIC'} onChange={() => setGoal('TOEIC')} /> 
                <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>B</span>
                <span style={{ fontWeight: 'bold' }}>TOEIC</span>
              </label>
            </div>
          </fieldset>

          <Select 
            label="Chủ đề" 
            value={topicId} 
            onChange={(e) => setTopicId(e.target.value)} 
            options={[{ value: '', label: 'Chọn chủ đề' }, ...topics.map(t => ({ value: t.id, label: t.name }))]}
            required
          />

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Trình độ</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {['MOI_BAT_DAU', 'CO_BAN', 'TRUNG_CAP', 'NANG_CAO'].map((lv, i) => (
                <label key={lv} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-2)', cursor: 'pointer' }}>
                  <input type="radio" name="level" value={lv} checked={level === lv} onChange={() => setLevel(lv)} /> 
                  <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '10px' }}>{['A','B','C','D'][i]}</span>
                  <span>{{ MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' }[lv]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Ai xem được bộ này?</legend>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: visibility === 'RIENG_TU' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="visibility" value="RIENG_TU" checked={visibility === 'RIENG_TU'} onChange={() => setVisibility('RIENG_TU')} /> 
                <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px', flexShrink: 0 }}>A</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Riêng tư</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Chỉ bạn thấy. Không xuất hiện trong thư viện.</div>
                </div>
              </label>
              <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: visibility === 'CONG_KHAI' ? 'var(--color-primary-tint)' : 'transparent' }}>
                <input type="radio" name="visibility" value="CONG_KHAI" checked={visibility === 'CONG_KHAI'} onChange={() => setVisibility('CONG_KHAI')} /> 
                <span style={{ background: 'var(--color-ink-3)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px', flexShrink: 0 }}>B</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Công khai</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Hiện trong thư viện. Người khác có thể sao chép.</div>
                </div>
              </label>
            </div>
          </fieldset>

          <div className={styles.formFoot}>
            <div className={styles.row}>
              <Link href="/bo-the"><Button variant="ghost" type="button">Hủy</Button></Link>
              <Button variant="primary" size="lg" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo bộ thẻ'}
              </Button>
            </div>
          </div>
        </form>
      </section>

      <aside style={{ display: 'none' /* hidden on mobile, will grid on desktop */ }}>
        {/* Xem trước */}
      </aside>
    </div>
  );
}
