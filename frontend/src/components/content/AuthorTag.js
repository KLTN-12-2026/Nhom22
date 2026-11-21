import Link from 'next/link';
import styles from './AuthorTag.module.css';

const initial = name => (name || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();

export function AuthorTag({ id, name, prefix = 'Tác giả', you = false }) {
  const label = name || 'Người học';
  const body = <>
    <span className={styles.avatar} aria-hidden="true">{initial(label)}</span>
    <span className={styles.text}>
      {prefix && <span className={styles.prefix}>{prefix}:</span>}
      <span className={styles.name}>{label}</span>
      {you && <span className={styles.you}>(bạn)</span>}
    </span>
  </>;
  return id
    ? <Link className={styles.tag} href={`/tac-gia/${encodeURIComponent(id)}`} title={`Xem trang tác giả ${label}`}>{body}</Link>
    : <span className={styles.tag}>{body}</span>;
}
