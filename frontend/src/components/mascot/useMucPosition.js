'use client';
import { useCallback, useEffect, useRef } from 'react';

const KEY = 'vocab:mascot:position';

export function useMucPosition({ hostRef, toggleRef, panelRef, bubbleRef, ready, onDragStart }) {
  const position = useRef(null);
  const startRef = useRef(onDragStart);

  useEffect(() => { startRef.current = onDragStart; }, [onDragStart]);

  const place = useCallback((x, y) => {
    const host = hostRef.current, toggle = toggleRef.current, panel = panelRef.current, bubble = bubbleRef.current;
    if (!host || !toggle) return;
    const width = toggle.offsetWidth, height = toggle.offsetHeight;
    const maxX = Math.max(8, window.innerWidth - width - 8), maxY = Math.max(8, window.innerHeight - height - 8);
    x = Math.max(8, Math.min(maxX, x));
    y = Math.max(8, Math.min(maxY, y));
    host.dataset.positioned = 'true';
    host.dataset.edge = x < window.innerWidth / 2 ? 'left' : 'right';
    host.style.left = `${x}px`;
    host.style.top = `${y}px`;
    const below = window.innerHeight - y - height - 16, above = y - 16;
    host.dataset.panelSide = below > above ? 'below' : 'above';
    if (panel) panel.style.maxHeight = `${Math.max(120, Math.max(below, above))}px`;
    for (const [element, size] of [[panel, Math.min(336, window.innerWidth - 32)], [bubble, bubble?.offsetWidth || Math.min(260, window.innerWidth - 32)]]) {
      if (!element) continue;
      const ideal = x < window.innerWidth / 2 ? x : x + width - size;
      element.style.left = `${Math.max(16, Math.min(window.innerWidth - size - 16, ideal)) - x}px`;
      element.style.right = 'auto';
    }
    position.current = { x: (x - 8) / Math.max(1, maxX - 8), y: (y - 8) / Math.max(1, maxY - 8) };
  }, [hostRef, toggleRef, panelRef, bubbleRef]);

  const restore = useCallback(() => {
    const toggle = toggleRef.current;
    if (!position.current || !toggle) return;
    place(8 + position.current.x * Math.max(0, window.innerWidth - toggle.offsetWidth - 16), 8 + position.current.y * Math.max(0, window.innerHeight - toggle.offsetHeight - 16));
  }, [place, toggleRef]);

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(position.current)); } catch {} };

  const resetPosition = useCallback(() => {
    const host = hostRef.current;
    position.current = null;
    try { localStorage.removeItem(KEY); } catch {}
    if (!host) return;
    delete host.dataset.positioned; delete host.dataset.edge; delete host.dataset.panelSide;
    host.style.removeProperty('left'); host.style.removeProperty('top');
    for (const element of [panelRef.current, bubbleRef.current]) {
      if (!element) continue;
      element.style.removeProperty('left'); element.style.removeProperty('right'); element.style.removeProperty('max-height');
    }
  }, [hostRef, panelRef, bubbleRef]);

  useEffect(() => {
    if (!ready) return undefined;
    const toggle = toggleRef.current, host = hostRef.current;
    if (!toggle || !host) return undefined;
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) position.current = saved; } catch {}
    restore();
    let drag = null;
    const down = event => {
      if (event.button !== 0 || !event.isPrimary) return;
      const rect = toggle.getBoundingClientRect();
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: rect.left, y: rect.top, moved: false };
      toggle.setPointerCapture(event.pointerId);
    };
    const move = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) startRef.current?.();
      drag.moved = true;
      host.dataset.dragging = 'true';
      place(drag.x + dx, drag.y + dy);
    };
    const end = event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) { save(); toggle.dataset.dragged = 'true'; }
      drag = null;
      delete host.dataset.dragging;
      if (toggle.hasPointerCapture(event.pointerId)) toggle.releasePointerCapture(event.pointerId);
    };
    const key = event => {
      if (!event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const rect = toggle.getBoundingClientRect();
      place(rect.left + (event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0), rect.top + (event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0));
      save();
    };
    const look = event => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r = toggle.getBoundingClientRect();
      host.style.setProperty('--muc-look-x', `${Math.max(-3, Math.min(3, (event.clientX - r.x - r.width / 2) / 12))}px`);
      host.style.setProperty('--muc-look-y', `${Math.max(-2, Math.min(2, (event.clientY - r.y - r.height / 2) / 18))}px`);
    };
    const unlook = () => { host.style.setProperty('--muc-look-x', '0px'); host.style.setProperty('--muc-look-y', '0px'); };
    toggle.addEventListener('pointerdown', down);
    toggle.addEventListener('pointermove', move);
    toggle.addEventListener('pointerup', end);
    toggle.addEventListener('pointercancel', end);
    toggle.addEventListener('lostpointercapture', end);
    toggle.addEventListener('keydown', key);
    host.addEventListener('pointermove', look);
    host.addEventListener('pointerleave', unlook);
    window.addEventListener('resize', restore);
    return () => {
      toggle.removeEventListener('pointerdown', down);
      toggle.removeEventListener('pointermove', move);
      toggle.removeEventListener('pointerup', end);
      toggle.removeEventListener('pointercancel', end);
      toggle.removeEventListener('lostpointercapture', end);
      toggle.removeEventListener('keydown', key);
      host.removeEventListener('pointermove', look);
      host.removeEventListener('pointerleave', unlook);
      window.removeEventListener('resize', restore);
    };
  }, [ready, place, restore, toggleRef, hostRef]);

  return { resetPosition, restore };
}
