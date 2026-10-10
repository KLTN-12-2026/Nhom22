'use client';
import { trapDialogTab } from '@/components/ui/dialog-focus';
import { useEffect, useRef, useState } from 'react';
import { CardEditor } from './CardEditor';
import styles from './CardEditDialog.module.css';

export function CardEditDialog({ card, deckId, onClose }) {
  const dialog = useRef(null);
  const [pending, setPending] = useState(false);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog onKeyDown={trapDialogTab} ref={dialog} className={styles.dialog} aria-labelledby="edit-card-title" onCancel={event => { if (pending) event.preventDefault(); }} onClose={onClose}>
    <h2 id="edit-card-title">Sửa thẻ</h2>
    <CardEditor key={card.id} deckId={deckId} initial={card} modal onSaved={onClose} onCancel={onClose} onPending={setPending} />
  </dialog>;
}

