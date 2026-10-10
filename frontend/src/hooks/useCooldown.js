'use client';
import { useEffect, useState } from 'react';

export function useCooldown(error) {
  const [now, setNow] = useState(0);
  const [until, setUntil] = useState(0);
  useEffect(() => {
    if (error?.status !== 429) return;
    const start = Date.now();
    const update = setTimeout(() => { setNow(start); setUntil(start + 60000); }, 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(update); clearInterval(timer); };
  }, [error]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}
