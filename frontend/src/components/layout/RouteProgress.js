'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function RouteProgress() {
  const pathname = usePathname();
  const barRef = useRef(null);
  const timerRef = useRef(0);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const start = () => {
      clearTimeout(timerRef.current);
      bar.getAnimations().forEach(a => a.cancel());
      bar.dataset.state = 'loading';
      timerRef.current = setTimeout(() => { bar.dataset.state = ''; }, 10000);
    };
    const onClick = e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || bar.dataset.state !== 'loading') return;
    clearTimeout(timerRef.current);
    const scale = new DOMMatrixReadOnly(getComputedStyle(bar).transform).a || 0;
    bar.dataset.state = 'done';
    const anim = bar.animate(
      [{ transform: `scaleX(${scale})`, opacity: scale > 0 ? 1 : 0 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.6 }, { transform: 'scaleX(1)', opacity: 0 }],
      { duration: scale > 0 ? 360 : 0, easing: 'ease-out' },
    );
    anim.onfinish = () => { if (bar.dataset.state === 'done') bar.dataset.state = ''; };
  }, [pathname]);

  return <div className="route-progress" aria-hidden="true"><span ref={barRef} /></div>;
}
