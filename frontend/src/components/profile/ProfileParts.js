'use client';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import { BadgeArt } from '@/components/engagement/BadgeArt';
import { TierPlate } from '@/components/tier/TierPlate';
import styles from './ProfileParts.module.css';

const initial = name => (name ? (name.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase() : '');

export function ProfileAvatar({ src, name, tier, size = 'lg' }) {
  return (
    <span className={`${styles.ring} ${styles[size]}`} data-plate={tier || 'none'} aria-hidden="true">
      <span className={styles.avatar}>{src ? <img src={src} alt="" /> : initial(name)}</span>
    </span>
  );
}

export function ProfileIdentity({ avatar, name, subtitle, tier, headingId, headingLevel = 'h2', children }) {
  const Heading = headingLevel;
  return (
    <div className={styles.identity}>
      {avatar}
      <div className={styles.names}>
        <Heading id={headingId} className={styles.name}>{name}</Heading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {tier && <TierPlate tier={tier} className={styles.plate} />}
      </div>
      {children}
    </div>
  );
}

export function ProfileMeta({ items }) {
  return (
    <ul className={styles.meta} role="list">
      {items.filter(Boolean).map(item => <li key={item.icon + item.text}><Icon name={item.icon} /><span>{item.text}</span></li>)}
    </ul>
  );
}

export function ProfileLedger({ items, loading = false, label }) {
  return (
    <dl className={styles.ledger} aria-label={label} style={{ '--cols': items.length }}>
      {items.map(item => (
        <div key={item.label} className={styles.entry} data-tone={item.tone || 'primary'}>
          <dt>{item.label}</dt>
          <dd>{loading ? '—' : Number(item.value || 0).toLocaleString('vi-VN')}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileBadges({ badges, total, href, empty, titleId = 'badges-title' }) {
  return (
    <section className={styles.badges} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.badgesTitle}>
        {href ? <Link href={href}>Huy hiệu</Link> : 'Huy hiệu'}
        <span className={styles.count}>{total != null ? `${badges.length}/${total}` : badges.length}</span>
      </h2>
      {badges.length ? (
        <ul className={styles.badgeList} role="list">
          {badges.map((b, i) => (
            <li key={b.id ?? b.ma} title={`${b.ten} — ${b.moTa}`}>
              <span className={styles.badge} role="img" aria-label={b.ten}><BadgeArt badge={b} size={46} number={null} delay={Math.min(i, 10) * 50} /></span>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>{empty}</p>}
    </section>
  );
}
