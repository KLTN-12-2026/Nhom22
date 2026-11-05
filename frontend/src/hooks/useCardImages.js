'use client';
import { useSyncExternalStore } from 'react';

const KEY = 'vocab:show-card-images';
let fallback = true;
function read() { try { return window.localStorage.getItem(KEY) !== 'false'; } catch { return fallback; } }
function subscribe(listener) {
  window.addEventListener('storage', listener);
  window.addEventListener('card-images-change', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('card-images-change', listener); };
}
function set(value) {
  fallback = value;
  try { window.localStorage.setItem(KEY, String(value)); } catch {}
  window.dispatchEvent(new Event('card-images-change'));
}
export function useCardImages() { return [useSyncExternalStore(subscribe, read, () => true), set]; }
