'use client';
import { Button, Input, Select, Icon } from '@/components/ui';
import styles from './layout.module.css';

export default function ProfilePage() {
  return (
    <>
      <div className={styles.formHead}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>Tài khoản &gt; Hồ sơ</div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Hồ sơ của bạn</h1>
      </div>

      <form style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <div>
          <span style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Ảnh đại diện</span>
          <div className={styles.avatarRow}>
            <div style={{ width: '80px', height: '80px', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '32px', fontWeight: 'bold' }}>T</div>
            <div className={styles.avatarActions}>
              <Button type="button" variant="secondary"><Icon name="upload" /> Tải ảnh lên</Button>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>JPG, PNG hoặc WEBP, tối đa 2 MB.</p>
            </div>
          </div>
        </div>

        <Input 
          label="Tên hiển thị" 
          defaultValue="Thảo" 
          maxLength={110}
        />
        
        <Input 
          label="Email đăng nhập" 
          defaultValue="thao@gmail.com" 
          readOnly 
        />
        
        <Select 
          label="Múi giờ" 
          defaultValue="Asia/Ho_Chi_Minh" 
          options={[
            { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (GMT+7)' },
            { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
          ]}
        />

        <div className={styles.settingsFoot}>
          <Button variant="primary" size="lg" type="button">Lưu hồ sơ</Button>
        </div>
      </form>
    </>
  );
}
