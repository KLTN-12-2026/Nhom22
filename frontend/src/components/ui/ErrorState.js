import { Button } from './Button';

const defaultIcon = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/**
 * ErrorState — hiển thị khi API lỗi, có nút thử lại
 */
export function ErrorState({ icon = defaultIcon, title = 'Đã xảy ra lỗi', description, onRetry, retryLabel = 'Thử lại' }) {
  return (
    <div className="error-state">
      <div className="error-state__icon" aria-hidden="true">{icon}</div>
      <h3 className="error-state__title">{title}</h3>
      {description && <p className="error-state__desc">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>
      )}
    </div>
  );
}
