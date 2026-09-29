'use client';
import { useEffect } from 'react';
import { Button } from './Button';

/**
 * ConfirmDialog — hộp xác nhận hành động nguy hiểm
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'danger',
  loading = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    warning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="presentation"
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="modal modal--sm confirm-dialog">
        <div className="modal__body">
          <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
            {iconMap[variant]}
          </div>
          <h2 id="confirm-title" className="modal__title">{title}</h2>
          {description && <p className="confirm-dialog__desc">{description}</p>}
        </div>
        <div className="modal__footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
