'use client';
import { trapDialogTab } from './dialog-focus';
import { useEffect, useId, useRef } from 'react';
export function Drawer({ isOpen, onClose, title, children, footer, side = 'right' }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => { if (isOpen && !dialog.current.open) dialog.current.showModal(); else if (!isOpen && dialog.current.open) dialog.current.close(); }, [isOpen]);
  return <dialog onKeyDown={trapDialogTab} ref={dialog} className={`drawer${side === 'left' ? ' drawer--left' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose?.(); }}>
    <div className="drawer__header"><h2 id={titleId}>{title}</h2><button type="button" className="modal__close" onClick={onClose} aria-label="Đóng">×</button></div>
    <div className="drawer__body">{children}</div>{footer && <div className="drawer__footer">{footer}</div>}
  </dialog>;
}
