'use client';
import { useSyncExternalStore } from 'react';
import { Icon } from './Icon';
import { fx } from '@/lib/fx';

const subscribe = listener => {
  window.addEventListener('vl-sound', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('vl-sound', listener);
    window.removeEventListener('storage', listener);
  };
};
const snapshot = () => { try { return localStorage.getItem('vl-sound') !== 'off'; } catch { return true; } };
const serverSnapshot = () => true;

export function SoundToggle({ className = '' }) {
  const on = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const label = on ? 'Tắt âm thanh' : 'Bật âm thanh';
  return (
    <button
      type="button"
      className={`btn btn-quiet btn-icon sound-toggle ${className}`}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => fx.setSound(!on)}
      suppressHydrationWarning
    >
      <Icon name={on ? 'volume' : 'volume-off'} />
    </button>
  );
}
