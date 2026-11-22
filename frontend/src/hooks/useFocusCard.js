import { useEffect, useRef } from 'react';

export function useFocusCard(cardId, ready) {
  const done = useRef(null);
  useEffect(() => {
    if (!cardId || !ready || done.current === cardId) return;
    const row = document.getElementById(`card-${cardId}`);
    if (!row) return;
    done.current = cardId;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    row.focus({ preventScroll: true });
  }, [cardId, ready]);
}
