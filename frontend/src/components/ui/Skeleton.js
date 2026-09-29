/**
 * Skeleton — placeholder animation khi đang tải dữ liệu
 */
export function Skeleton({ width, height, className = '', variant = '', style = {} }) {
  return (
    <div
      className={['skeleton', variant && `skeleton--${variant}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Skeleton variant="card" />
      <SkeletonText lines={2} />
    </div>
  );
}
