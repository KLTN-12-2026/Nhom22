'use client';
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import styles from '../layout.module.css';

export default function LearningSettingsPage() {
  const [goal, setGoal] = useState('TOEIC');
  const [level, setLevel] = useState('CO_BAN');
  const [mins, setMins] = useState('10');
  const [cards, setCards] = useState('10');

  return (
    <>
      <div className={styles.formHead}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>Tài khoản &gt; Thiết lập học</div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Thiết lập học</h1>
        <p style={{ color: 'var(--color-ink-2)' }}>Kế hoạch mỗi ngày dùng các con số dưới đây. Thay đổi có hiệu lực từ phiên học tiếp theo.</p>
      </div>

      <form style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Mục tiêu</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: goal === 'GIAO_TIEP' ? 'var(--color-primary-tint)' : 'transparent' }}>
              <input type="radio" name="goal" value="GIAO_TIEP" checked={goal === 'GIAO_TIEP'} onChange={() => setGoal('GIAO_TIEP')} />
              <div>
                <div style={{ fontWeight: 'bold' }}>Giao tiếp</div>
              </div>
            </label>
            <label style={{ display: 'flex', gap: '12px', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: goal === 'TOEIC' ? 'var(--color-primary-tint)' : 'transparent' }}>
              <input type="radio" name="goal" value="TOEIC" checked={goal === 'TOEIC'} onChange={() => setGoal('TOEIC')} />
              <div>
                <div style={{ fontWeight: 'bold' }}>Thi TOEIC</div>
              </div>
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Trình độ tự đánh giá</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {['MOI_BAT_DAU', 'CO_BAN', 'TRUNG_CAP', 'NANG_CAO'].map(lv => (
              <label key={lv} style={{ display: 'flex', gap: '8px', padding: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="radio" name="level" value={lv} checked={level === lv} onChange={() => setLevel(lv)} />
                <span>{{ MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' }[lv]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Thời gian học mỗi ngày (phút)</strong>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Input type="number" value={mins} onChange={(e) => setMins(e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['5', '10', '15', '20', '30'].map(v => (
                <button key={v} type="button" onClick={() => setMins(v)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', background: mins === v ? 'var(--color-primary)' : 'var(--color-field)', color: mins === v ? 'white' : 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Số từ mới mỗi ngày</strong>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Input type="number" value={cards} onChange={(e) => setCards(e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['0', '5', '10', '20'].map(v => (
                <button key={v} type="button" onClick={() => setCards(v)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', background: cards === v ? 'var(--color-primary)' : 'var(--color-field)', color: cards === v ? 'white' : 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.settingsFoot}>
          <Button variant="primary" size="lg" type="button">Lưu thiết lập</Button>
        </div>
      </form>
    </>
  );
}
