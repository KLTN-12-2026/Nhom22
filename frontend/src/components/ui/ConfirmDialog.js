'use client';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Xác nhận', description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', variant = 'danger', loading = false }) {
  return <Modal isOpen={isOpen} onClose={onClose} title={title} role="alertdialog" loading={loading} size="sm" className="confirm-dialog" footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button><Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></>}>
    <p className="confirm-dialog__desc">{description}</p>
  </Modal>;
}
