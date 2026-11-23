'use client';
import { useEffect } from 'react';
import { useThemes } from '@/hooks/useThemes';
import { SkinLayer } from './SkinLayer';

export function SkinSync({ enabled = true }) {
  useThemes({ enabled });
  return <SkinLayer />;
}

export function SkinOff() {
  useEffect(() => {
    const root = document.documentElement;
    const saved = root.dataset.skin;
    delete root.dataset.skin;
    window.dispatchEvent(new Event('vocab-skin-change'));
    return () => {
      let value = saved;
      try { value = localStorage.getItem('vocab:skin') || saved; } catch {}
      if (window.VocabSkin) window.VocabSkin.set(value);
    };
  }, []);
  return null;
}
