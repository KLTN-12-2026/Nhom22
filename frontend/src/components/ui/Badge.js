/**
 * Badge — nhãn trạng thái ngắn
 * @param {'default'|'primary'|'success'|'warning'|'error'} variant
 * @param {boolean} dot - hiển thị dấu chấm màu trước text
 */
export function Badge({ children, variant = 'default', dot = false, className = '', ...props }) {
  return (
    <span
      className={[
        'badge',
        `badge--${variant}`,
        dot && 'badge--dot',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
