'use client';
import { useSyncExternalStore } from 'react';

const subscribe = listener => {
  window.addEventListener('vocab-theme-change', listener);
  return () => window.removeEventListener('vocab-theme-change', listener);
};
const snapshot = () => { try { return localStorage.getItem('vocab:theme') || 'system'; } catch { return 'system'; } };
const serverSnapshot = () => 'system';

export function ThemeToggle({ className = '' }) {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const label = 'Giao diện: '+({light:'Sáng',dark:'Tối',system:'Theo thiết bị'}[mode] || 'Theo thiết bị');
  return <details className={`theme-picker ${className}`}><summary className="theme-toggle" data-theme-toggle aria-label={label} title="Chọn giao diện" suppressHydrationWarning>
    <svg className="icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" /></svg>
    <svg className="icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></svg>
    <span className="theme-track" aria-hidden="true" />
  </summary><div className="theme-options" role="radiogroup" aria-label="Giao diện">{[['light','☀ Sáng'],['dark','☾ Tối'],['system','◐ Theo thiết bị']].map(([value,text])=><button key={value} type="button" role="radio" data-theme-value={value} aria-checked={mode===value}>{text}</button>)}</div></details>;
}
