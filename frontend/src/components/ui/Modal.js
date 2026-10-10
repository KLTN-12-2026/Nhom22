'use client';
import { trapDialogTab } from './dialog-focus';
import { useEffect, useId, useRef } from 'react';

export function Modal({ isOpen, onClose, title, children, footer, size = '', className = '', loading = false, role = 'dialog' }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (isOpen && !dialog.current.open) dialog.current.showModal();
    else if (!isOpen && dialog.current.open) dialog.current.close();
  }, [isOpen]);
  return <dialog onKeyDown={trapDialogTab} ref={dialog} role={role} aria-labelledby={titleId} className={['modal', size && `modal--${size}`, className].filter(Boolean).join(' ')} onCancel={event => { event.preventDefault(); if (!loading) onClose?.(); }} onClick={event => { if (event.target === event.currentTarget && !loading) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose?.(); } }}>
    <div className="modal__header"><h2 id={titleId} className="modal__title">{title}</h2><button type="button" className="modal__close" disabled={loading} onClick={onClose} aria-label="Đóng">×</button></div>
    <div className="modal__body">{children}</div>
    {footer && <div className="modal__footer">{footer}</div>}
  </dialog>;
}
