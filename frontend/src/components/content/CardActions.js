'use client';
import { Icon } from '@/components/ui';
import styles from './CardActions.module.css';

export function CardActions({ word, items }) {
  const groups = [];
  items.filter(Boolean).forEach(item => {
    if (item.split || !groups.length) groups.push([]);
    groups[groups.length - 1].push(item);
  });
  return (
    <div className={styles.bar} role="toolbar" aria-label={`Thao tác với thẻ ${word}`}>
      {groups.map((group, index) => (
        <span key={index} className={styles.group}>
          {group.map(item => (
            <button
              key={item.key}
              type="button"
              className={`${styles.action}${item.tone ? ` ${styles[item.tone]}` : ''}`}
              onClick={item.onClick}
              disabled={item.disabled}
              aria-pressed={item.pressed}
              aria-label={`${item.label} ${word}`}
              data-tip={item.label}
            >
              <Icon name={item.icon} />
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
