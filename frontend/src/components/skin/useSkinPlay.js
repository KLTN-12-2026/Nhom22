'use client';
import { useEffect } from 'react';

const COMBO_WINDOW = 4000;
const COMBO_ANGRY = 5;

function pick(list) {
  const items = (list || '').split('|').filter(Boolean);
  return items.length ? items[Math.floor(Math.random() * items.length)] : '';
}

function sound(name) {
  if (name && typeof window !== 'undefined') window.VLFx?.pet?.(name);
}

function say(layer, target, text, tone) {
  if (!text) return;
  layer.querySelectorAll('.sk-say').forEach(old => old.remove());
  const r = target.getBoundingClientRect();
  const bubble = document.createElement('span');
  const below = r.top < 120;
  bubble.className = 'sk-say' + (tone ? ` is-${tone}` : '') + (below ? ' is-below' : '');
  bubble.textContent = text;
  const x = Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120);
  bubble.style.left = `${x}px`;
  bubble.style.top = `${below ? r.bottom + 10 : r.top - 8}px`;
  layer.appendChild(bubble);
  setTimeout(() => bubble.remove(), 2400);
}

function burst(layer, target, chars) {
  if (!chars) return;
  const r = target.getBoundingClientRect();
  const list = [...chars];
  for (let i = 0; i < 9; i++) {
    const bit = document.createElement('span');
    bit.className = 'sk-bit';
    bit.textContent = list[i % list.length];
    const angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 50;
    bit.style.left = `${r.left + r.width / 2}px`;
    bit.style.top = `${r.top + r.height / 2}px`;
    bit.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
    bit.style.setProperty('--rot', `${Math.round(Math.random() * 120 - 60)}deg`);
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 1100);
  }
}

export function useSkinPlay(ref, slug) {
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const timers = new Map();
    const combos = new WeakMap();
    let lastHover = 0;

    const react = (hit, kind) => {
      clearTimeout(timers.get(hit));
      hit.dataset.react = '';
      void hit.offsetWidth;
      hit.dataset.react = kind;
      timers.set(hit, setTimeout(() => { hit.dataset.react = ''; }, Number(hit.dataset.dur || (kind === 'angry' ? 2200 : 1400))));
    };

    const onClick = event => {
      const hit = event.target.closest('[data-hit]');
      if (!hit || !layer.contains(hit)) return;
      const now = Date.now();
      const state = combos.get(hit) || { n: 0, t: 0 };
      state.n = now - state.t < COMBO_WINDOW ? state.n + 1 : 1;
      state.t = now;
      combos.set(hit, state);
      const angry = state.n >= COMBO_ANGRY && hit.dataset.angry;
      if (angry) state.n = 0;
      const alt = !angry && hit.dataset.alt && Math.random() < 0.3;
      react(hit, angry ? 'angry' : alt ? 'alt' : 'poke');
      sound(angry ? hit.dataset.angry : alt ? hit.dataset.altSound || hit.dataset.hit : hit.dataset.hit);
      say(layer, hit, pick(angry ? hit.dataset.angrySay : alt ? hit.dataset.altSay : hit.dataset.say), angry ? 'angry' : '');
      burst(layer, hit, angry ? hit.dataset.angryBurst : hit.dataset.burst);
      window.dispatchEvent(new CustomEvent('vl-skin-poke', { detail: { slug, hit: hit.dataset.hit, angry: !!angry } }));
    };

    const onOver = event => {
      const hit = event.target.closest('[data-hover]');
      if (!hit || !layer.contains(hit) || hit.contains(event.relatedTarget)) return;
      hit.dataset.petting = 'on';
      const now = Date.now();
      if (now - lastHover > 1600) { lastHover = now; sound(hit.dataset.hover); }
    };
    const onOut = event => {
      const hit = event.target.closest('[data-hover]');
      if (!hit || hit.contains(event.relatedTarget)) return;
      hit.dataset.petting = '';
    };

    layer.addEventListener('click', onClick);
    layer.addEventListener('pointerover', onOver);
    layer.addEventListener('pointerout', onOut);
    return () => {
      layer.removeEventListener('click', onClick);
      layer.removeEventListener('pointerover', onOver);
      layer.removeEventListener('pointerout', onOut);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [ref, slug]);
}
