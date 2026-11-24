'use client';
import styles from './ProfileParts.module.css';

const initial = name => (name ? (name.trim().split(/\s+/).pop()?.[0] || '?').toUpperCase() : '');

export function ProfileAvatar({ src, name, tier, size = 'lg' }) {
  return (
    <span className={`${styles.ring} ${styles[size]}`} data-plate={tier || 'none'} aria-hidden="true">
      <span className={styles.avatar}>{src ? <img src={src} alt="" /> : initial(name)}</span>
    </span>
  );
}
