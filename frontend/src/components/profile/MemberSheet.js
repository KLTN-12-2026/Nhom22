'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, logout } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { uploadAvatar } from '@/lib/upload-avatar';
import { useAvatar } from '@/hooks/useAvatar';
import { useCooldown } from '@/hooks/useCooldown';
import { Icon } from '@/components/ui';
import { BadgeArt } from '@/components/engagement/BadgeArt';
import { MembershipCard } from '@/components/tier/MembershipCard';
import { MetalIcon } from '@/components/tier/MetalIcon';
import { TierPlate } from '@/components/tier/TierPlate';
import { useTier } from '@/components/tier/useTier';
import { TimeZonePicker } from '@/components/ui/TimeZonePicker';
import { describeZone } from '@/lib/time-zones.mjs';
import { TIERS, cardDate, rosette } from '@/lib/tier.mjs';
import { ProfileAvatar } from './ProfileParts';
import styles from './MemberSheet.module.css';

const ROSE_A = rosette(130, 48, 82, 2000);
const ROSE_B = rosette(130, 34, 56, 1600);
const WAVES = Array.from({ length: 24 }, (_, row) => {
  const y = 20 + row * 13;
  let d = `M-10 ${y}`;
  for (let x = 0; x <= 1120; x += 10) d += `L${x} ${(y + Math.sin((x + row * 14) / 26) * 6).toFixed(1)}`;
  return d;
});
const MEDALS = 3;

export const monthText = value => (value ? new Date(value).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : '—');
const memberNo = id => (id ? `VL · ${String(id).padStart(4, '0')}` : '—');

function expiryText(tier, plan) {
  if (tier === 'admin') return 'Vĩnh viễn';
  if (!plan?.hetHanAt) return 'Không giới hạn';
  const left = plan.soNgayConLai != null ? ` · còn ${plan.soNgayConLai} ngày` : '';
  return `${cardDate(plan.hetHanAt)}${left}`;
}

function Guilloche() {
  return (
    <svg className={styles.guilloche} viewBox="0 0 1100 330" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
      <g>{WAVES.map((d, i) => <path key={i} d={d} />)}</g>
      <g transform="translate(960 120)"><path d={ROSE_A} /><path d={ROSE_B} /></g>
    </svg>
  );
}

function BadgeStub({ earned, total, href }) {
  const count = total != null ? `${earned.length}/${total}` : earned.length;
  const medals = (
    <span className={styles.medals} aria-hidden="true">
      {earned.slice(0, MEDALS).map(b => <span key={b.id ?? b.ma} className={styles.medal}><BadgeArt badge={b} size={34} number={null} /></span>)}
      {Array.from({ length: Math.max(0, MEDALS - earned.length) }, (_, i) => <span key={i} className={`${styles.medal} ${styles.blank}`} />)}
    </span>
  );
  const text = <span>Huy hiệu <b>{count}</b></span>;
  return href
    ? <Link href={href} className={styles.badges} aria-label={`Huy hiệu: đã nhận ${count}`}>{medals}{text}</Link>
    : <p className={styles.badges} aria-label={`Huy hiệu: đã nhận ${count}`}>{medals}{text}</p>;
}

export function MemberHero({ card, cardHint = true, avatar, name, headingLevel = 'h1', sub, children, stats, statsLoading, statsLabel, badges, footer }) {
  const Heading = headingLevel;
  return (
    <section className={`sheet ${styles.sheet}`} aria-labelledby="profile-name">
      <div className={styles.head} data-card={card ? 'true' : 'false'}>
        <Guilloche />
        {card && (
          <div className={styles.holder}>
            {card}
            {cardHint && <p className={styles.hint}>Bấm vào thẻ để lật xem quyền lợi</p>}
          </div>
        )}
        <div className={styles.who}>
          <div className={styles.top}>
            {avatar}
            <div className={styles.names}>
              <Heading id="profile-name" className={styles.name}>{name}</Heading>
              <p className={styles.sub}>{sub}</p>
            </div>
          </div>
          {children}
        </div>
      </div>

      <div className={styles.perf} aria-hidden="true" />

      <div className={styles.stub}>
        <dl className={styles.stats} aria-label={statsLabel} style={{ '--cols': stats.length }}>
          {stats.map(item => (
            <div key={item.label} className={styles.stat}>
              <dt>{item.label}</dt>
              <dd>{statsLoading ? '—' : Number(item.value || 0).toLocaleString('vi-VN')}</dd>
            </div>
          ))}
        </dl>
        {badges && <BadgeStub {...badges} />}
      </div>
      {footer}
    </section>
  );
}

export function MemberFields({ items }) {
  return (
    <dl className={styles.fields}>
      {items.filter(Boolean).map(item => (
        <div key={item.label}><dt>{item.label}</dt><dd className={item.tone === 'ok' ? styles.ok : item.mono ? styles.mono : undefined}>{item.value}</dd></div>
      ))}
    </dl>
  );
}

export function MemberActions({ children }) {
  return <div className={styles.actions}>{children}</div>;
}

function TierActions({ tier }) {
  if (!tier || tier === 'admin') return null;
  if (tier === 'free') return <Link className="tier-cta tier-cta-buy" href="/thanh-toan-goi"><MetalIcon name="spark" metal="gold-dark" size={18} />Mua gói</Link>;
  return (
    <>
      <Link className="btn btn-quiet" href="/thanh-toan-goi">Gia hạn gói</Link>
      {tier === 'pro'
        ? <Link className="tier-cta tier-cta-up" href="/thanh-toan-goi"><MetalIcon name="crown" metal="gold" size={18} />Lên Premium</Link>
        : <Link className="btn btn-quiet" href="/thanh-toan-lich-su">Lịch sử thanh toán</Link>}
    </>
  );
}

export function MemberSheet({ me }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState({ ok: '', error: '' });
  const { data: avatar } = useAvatar(me);
  const { tier, plan } = useTier(Boolean(me));
  const { data: decks = [], isLoading: decksLoading } = useQuery({ queryKey: ['all-my-decks'], queryFn: () => fetchAllPages('/api/v1/decks') });
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });

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
      setMessage({ ok: `Đã lưu hồ sơ lúc ${new Date().toLocaleTimeString('vi-VN')}`, error: '' });
    },
    onError: error => setMessage({ ok: '', error: error.message || 'Có lỗi xảy ra' }),
  });

  const form = draft ?? { tenHienThi: me?.tenHienThi || '', muiGio: me?.muiGio || 'Asia/Ho_Chi_Minh' };
  const isAdmin = me?.vaiTro?.includes('ADMIN');
  const avatarBusy = avatarMutation.isPending || avatarCooldown > 0;
  const name = me?.tenHienThi || 'Người học';
  const verified = me?.trangThai === 'HOAT_DONG';

  const submit = event => {
    event.preventDefault();
    if (!updateMutation.isPending) updateMutation.mutate(form);
  };
  const cancel = () => { setDraft(null); setEditing(false); setMessage({ ok: '', error: '' }); };

  return (
    <MemberHero
      card={tier ? <MembershipCard tier={tier} plan={plan} name={me?.tenHienThi} since={plan?.batDauAt} /> : <div className="sk tier-card-skeleton" aria-busy="true" />}
      avatar={<ProfileAvatar src={avatar?.downloadUrl} name={name} tier={tier} size="md" />}
      name={name}
      sub={<>{tier && <TierPlate tier={tier} />}<span>{me?.email}</span></>}
      statsLabel="Số liệu hồ sơ"
      statsLoading={decksLoading}
      stats={[
        { label: 'Bộ thẻ', value: decks.length },
        { label: 'Thẻ từ vựng', value: decks.reduce((sum, d) => sum + (d.soThe || 0), 0) },
        { label: 'Bộ công khai', value: decks.filter(d => d.quyenTruyCap === 'CONG_KHAI').length },
      ]}
      badges={{ earned: badges.filter(b => b.daNhan), total: badges.length, href: '/thanh-tich' }}
      footer={(
        <div className={styles.mobileOnly}>
          {isAdmin && <Link className="btn btn-secondary" href="/quan-tri">Vào trang quản trị</Link>}
          <button type="button" className="btn btn-quiet" onClick={() => logout(queryClient).catch(error => setMessage({ ok: '', error: error.message }))}>Đăng xuất</button>
        </div>
      )}
    >
      {editing ? (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.avatarTools}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" />{avatarCooldown > 0 ? `Thử lại sau ${avatarCooldown} giây` : 'Đổi ảnh'}
            </button>
            {avatar?.downloadUrl && <button type="button" className="btn btn-quiet btn-sm" disabled={avatarBusy} onClick={() => avatarMutation.mutate(null)}>Gỡ ảnh</button>}
            <input ref={fileRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh đại diện"
              onChange={event => { const file = event.target.files[0]; if (file) avatarMutation.mutate(file); event.target.value = ''; }} />
          </div>
          <label className="field-label" htmlFor="tenHienThi">Tên hiển thị</label>
          <input className="input" id="tenHienThi" maxLength={100} required autoComplete="nickname" value={form.tenHienThi}
            onChange={e => setDraft({ ...form, tenHienThi: e.target.value })} />
          <TimeZonePicker id="muiGio" value={form.muiGio} onChange={muiGio => setDraft({ ...form, muiGio })} />
          <p className="field-hint">Ảnh JPG, PNG, WEBP tối đa 2 MB. Múi giờ dùng để tính ngày học và giờ nhắc.</p>
          <MemberActions>
            <button type="submit" className="btn btn-primary btn-sm" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={cancel}>Hủy</button>
          </MemberActions>
        </form>
      ) : (
        <>
          <MemberFields items={[
            { label: 'Số thành viên', value: memberNo(me?.id), mono: true },
            { label: 'Tham gia', value: monthText(me?.emailXacThucAt) },
            { label: 'Hạn gói', value: tier ? expiryText(tier, plan) : '—' },
            { label: 'Múi giờ', value: describeZone(me?.muiGio) },
            { label: 'Email', value: verified ? 'Đã xác thực' : 'Chưa xác thực', tone: verified ? 'ok' : undefined },
            { label: 'Vai trò', value: isAdmin ? 'Quản trị viên' : 'Người học' },
          ]} />
          <MemberActions>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}><Icon name="edit" />Chỉnh sửa hồ sơ</button>
            {me?.id && <Link className="btn btn-quiet" href={`/tac-gia/${me.id}`}><Icon name="eye" />Xem hồ sơ công khai</Link>}
            <TierActions tier={tier} />
          </MemberActions>
        </>
      )}

      {me?.anhDaiDienBiAn && <p className="notice notice-warning" role="status"><Icon name="alert" />Ảnh đại diện của bạn đã bị quản trị viên ẩn vì vi phạm quy định cộng đồng. Mọi người đang thấy ảnh mặc định; hãy chọn Chỉnh sửa hồ sơ rồi Đổi ảnh để tải ảnh khác.</p>}
      {message.error && <p className="notice notice-error" role="alert">{message.error}</p>}
      {message.ok && <p className={styles.saved} aria-live="polite">{message.ok}</p>}
    </MemberHero>
  );
}

export function ProfileStrip({ me }) {
  const { data: avatar } = useAvatar(me);
  const { tier } = useTier(Boolean(me));
  const name = me?.tenHienThi || 'Người học';
  const label = TIERS[tier]?.label;
  return (
    <section className={`sheet ${styles.strip}`} aria-labelledby="profile-name">
      <ProfileAvatar src={avatar?.downloadUrl} name={name} tier={tier} size="sm" />
      <div className={styles.names}>
        <p id="profile-name" className={styles.stripName}>{name}</p>
        <p className={styles.sub}>{tier && <TierPlate tier={tier} />}<span>{me?.email}</span></p>
      </div>
      {tier && (
        <Link className={styles.mini} href="/ca-nhan" data-card-tier={tier}>
          <i aria-hidden="true" />
          <span><b>Thẻ {label}</b>Xem thẻ và quyền lợi</span>
        </Link>
      )}
    </section>
  );
}
