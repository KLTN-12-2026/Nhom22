'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, logout } from '@/lib/api-client';
import { uploadAvatar } from '@/lib/upload-avatar';
import { useAvatar } from '@/hooks/useAvatar';
import { useCooldown } from '@/hooks/useCooldown';
import { Icon } from '@/components/ui';
import { BadgeArt } from '@/components/engagement/BadgeArt';
import { TimeZonePicker } from '@/components/ui/TimeZonePicker';
import { describeZone } from '@/lib/time-zones.mjs';
import styles from './ProfileCard.module.css';

const zoneLabel = zone => describeZone(zone);
const initial = name => (name ? name.trim().split(/\s+/).pop()[0].toUpperCase() : 'U');
const joined = value => (value ? new Date(value).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : null);

export function ProfileCard({ me }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState({ ok: '', error: '' });
  const { data: avatar } = useAvatar(me);
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });
  const earned = badges.filter(b => b.daNhan);

  const avatarMutation = useMutation({
    mutationFn: file => (file ? uploadAvatar(file) : apiFetch('/api/v1/me/avatar', { method: 'DELETE' })),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); setMessage({ ok: 'Đã lưu ảnh đại diện', error: '' }); },
    onError: error => setMessage({ ok: '', error: error.message }),
  });
  const avatarCooldown = useCooldown(avatarMutation.error);

  const updateMutation = useMutation({
    mutationFn: body => apiFetch('/api/v1/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: data => {
      queryClient.setQueryData(['me'], data);
      setDraft(null);
      setEditing(false);
      setMessage({ ok: `Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`, error: '' });
    },
    onError: error => setMessage({ ok: '', error: error.message || 'Có lỗi xảy ra' }),
  });

  const form = draft ?? { tenHienThi: me?.tenHienThi || '', muiGio: me?.muiGio || 'Asia/Ho_Chi_Minh' };
  const isAdmin = me?.vaiTro?.includes('ADMIN');
  const avatarBusy = avatarMutation.isPending || avatarCooldown > 0;

  const submit = event => {
    event.preventDefault();
    if (!updateMutation.isPending) updateMutation.mutate(form);
  };
  const cancel = () => { setDraft(null); setEditing(false); setMessage({ ok: '', error: '' }); };

  return (
    <div className={styles.card}>
      <div className={styles.avatarWrap}>
        <span className={styles.avatar}>
          {avatar?.downloadUrl ? <img src={avatar.downloadUrl} alt="" /> : initial(me?.tenHienThi)}
        </span>
        {editing && (
          <div className={styles.avatarTools}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" />{avatarCooldown > 0 ? `Thử lại sau ${avatarCooldown} giây` : 'Đổi ảnh'}
            </button>
            {avatar?.downloadUrl && <button type="button" className="btn btn-quiet btn-sm" disabled={avatarBusy} onClick={() => avatarMutation.mutate(null)}>Gỡ ảnh</button>}
            <input ref={fileRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh đại diện"
              onChange={event => { const file = event.target.files[0]; if (file) avatarMutation.mutate(file); event.target.value = ''; }} />
          </div>
        )}
      </div>

      {editing ? (
        <form className={styles.form} onSubmit={submit}>
          <label className="field-label" htmlFor="tenHienThi">Tên hiển thị</label>
          <input className="input" id="tenHienThi" maxLength={100} required autoComplete="nickname" value={form.tenHienThi}
            onChange={e => setDraft({ ...form, tenHienThi: e.target.value })} />
          <TimeZonePicker id="muiGio" value={form.muiGio} onChange={muiGio => setDraft({ ...form, muiGio })} />
          <p className="field-hint">Ảnh JPG, PNG, WEBP tối đa 2 MB. Múi giờ dùng để tính ngày học và giờ nhắc.</p>
          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={cancel}>Hủy</button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.names}>
            <h2 className={styles.name} id="profile-name">{me?.tenHienThi || 'Người học'}</h2>
            <p className={styles.handle}>{me?.email}</p>
          </div>
          <button type="button" className={`btn btn-secondary btn-block ${styles.edit}`} onClick={() => setEditing(true)}>Chỉnh sửa hồ sơ</button>
        </>
      )}

      {message.error && <p className="notice notice-error" role="alert">{message.error}</p>}
      {message.ok && <p className={styles.saved} aria-live="polite">{message.ok}</p>}

      <ul className={styles.meta} role="list">
        <li><Icon name="globe" /><span>{zoneLabel(me?.muiGio)}</span></li>
        <li><Icon name="mail" /><span>{me?.trangThai === 'HOAT_DONG' ? 'Đã xác thực email' : 'Chưa xác thực email'}</span></li>
        {joined(me?.emailXacThucAt) && <li><Icon name="calendar" /><span>Tham gia {joined(me.emailXacThucAt)}</span></li>}
        <li><Icon name="shield" /><span>{isAdmin ? 'Quản trị viên' : 'Người học'}</span></li>
      </ul>

      <section className={styles.badges} aria-labelledby="badges-title">
        <h2 id="badges-title" className={styles.sectionTitle}>
          <Link href="/thanh-tich">Huy hiệu</Link><span className={styles.count}>{earned.length}/{badges.length}</span>
        </h2>
        {earned.length ? (
          <ul className={styles.badgeList} role="list">
            {earned.slice(0, 12).map(b => (
              <li key={b.id} title={`${b.ten} — ${b.moTa}`}><span className={styles.badge} role="img" aria-label={b.ten}><BadgeArt badge={b} size={44} number={null} /></span></li>
            ))}
          </ul>
        ) : <p className={styles.empty}>Chưa có huy hiệu. Học đều mỗi ngày để mở khóa.</p>}
      </section>

      <div className={styles.mobileOnly}>
        {isAdmin && <Link className="btn btn-secondary" href="/quan-tri">Vào trang quản trị</Link>}
        <button type="button" className="btn btn-quiet" onClick={() => logout(queryClient).catch(error => setMessage({ ok: '', error: error.message }))}>Đăng xuất</button>
      </div>
    </div>
  );
}
