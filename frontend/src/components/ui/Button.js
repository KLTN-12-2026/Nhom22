'use client';

/**
 * Button — F0.2 UI Kit
 * @param {'primary'|'secondary'|'ghost'|'danger'|'link'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'btn',
        `btn-${variant === 'ghost' || variant === 'link' ? 'quiet' : variant}`,
        `btn-${size}`,
        fullWidth && 'btn-block',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
