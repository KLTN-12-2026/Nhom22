'use client';
import { useEffect } from 'react';
import { mucTip } from '@/lib/mascot.mjs';

export function useMucTip(text) {
  useEffect(() => {
    if (!text) return undefined;
    const timer = setTimeout(() => mucTip(text), 900);
    return () => clearTimeout(timer);
  }, [text]);
}
