'use client';
import { trapDialogTab } from './dialog-focus';
import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon';

function outside(dialog, event) {
  const rect = dialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

export function Modal({ isOpen, onClose, title, children, footer, size = '', className = '', loading = false, role = 'dialog', dismissible = true }) {
  const dialog = useRef(null);
  const pressedOutside = useRef(false);
  const titleId = useId();
  useEffect(() => {
    if (isOpen && !dialog.current.open) dialog.current.showModal();
    else if (!isOpen && dialog.current.open) dialog.current.close();
  }, [isOpen]);
  return <dialog onKeyDown={trapDialogTab} ref={dialog} role={role} aria-labelledby={titleId} className={['modal', size && `modal--${size}`, className].filter(Boolean).join(' ')}
    onCancel={event => { event.preventDefault(); if (dismissible && !loading) onClose?.(); }}
    onPointerDown={event => { pressedOutside.current = event.target === event.currentTarget && outside(dialog.current, event); }}
    onClick={event => {
      const started = pressedOutside.current;
      pressedOutside.current = false;
      if (dismissible && started && !loading && event.target === event.currentTarget && outside(dialog.current, event)) onClose?.();
    }}>
    <div className="modal__header"><h2 id={titleId} className="modal__title">{title}</h2><button type="button" className="modal__close" disabled={loading} onClick={onClose} aria-label="Đóng"><Icon name="x" /></button></div>
    <div className="modal__body">{children}</div>
    {footer && <div className="modal__footer">{footer}</div>}
  </dialog>;
}
