'use client';
import { useEffect } from 'react';

const COMBO_WINDOW = 4000;
const COMBO_ANGRY = 5;
const HEART_EXPLOSION_MS = 8000;

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
  bubble.setAttribute('role', 'status');
  bubble.textContent = text;
  const x = Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120);
  bubble.style.left = `${x}px`;
  bubble.style.top = `${below ? r.bottom + 10 : r.top - 8}px`;
  layer.appendChild(bubble);
  setTimeout(() => bubble.remove(), 2400);
}

function burst(layer, target, chars, count = 9, spread = 1) {
  if (!chars) return;
  const r = target.getBoundingClientRect();
  const list = [...chars];
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('span');
    bit.className = 'sk-bit';
    bit.textContent = list[i % list.length];
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = (40 + Math.random() * 50) * spread;
    bit.style.left = `${r.left + r.width / 2}px`;
    bit.style.top = `${r.top + r.height / 2}px`;
    bit.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
    bit.style.setProperty('--rot', `${Math.round(Math.random() * 120 - 60)}deg`);
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 1100);
  }
}

function heartRain(layer) {
  const rain = document.createElement('div');
  rain.className = 'sk-heart-rain';
  const count = window.innerWidth < 640 ? 56 : 96;
  const colors = ['#e94b75', '#ff7799', '#f7a6c2', '#cf315f', '#fff0f5'];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('i');
    heart.textContent = i % 4 === 0 ? '♡' : '♥';
    heart.style.left = `${(i + Math.random()) / count * 100}%`;
    heart.style.color = colors[i % colors.length];
    heart.style.fontSize = `${18 + Math.random() * 30}px`;
    heart.style.setProperty('--heart-delay', `${.25 + Math.random() * 2.1}s`);
    heart.style.setProperty('--heart-duration', `${3 + Math.random() * 2}s`);
    heart.style.setProperty('--heart-drift', `${Math.random() * 16 - 8}vw`);
    heart.style.setProperty('--heart-turn', `${Math.random() * 360 - 180}deg`);
    heart.style.setProperty('--heart-y', `${8 + Math.random() * 80}%`);
    rain.appendChild(heart);
  }
  layer.appendChild(rain);
  return rain;
}

export function useSkinPlay(ref, slug) {
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const timers = new Map();
    const rainTimers = new Set();
    const combos = new WeakMap();
    let lastHover = 0;

    const react = (hit, kind) => {
      clearTimeout(timers.get(hit));
      hit.removeAttribute('data-react');
      void hit.offsetWidth;
      hit.dataset.react = kind;
      const duration = kind === 'explode' ? HEART_EXPLOSION_MS : Number(hit.dataset.dur || (kind === 'angry' ? 2200 : 1400));
      timers.set(hit, setTimeout(() => {
        hit.removeAttribute('data-react');
        timers.delete(hit);
      }, duration));
    };

    const onClick = event => {
      const hit = event.target.closest('[data-hit]');
      if (!hit || !layer.contains(hit)) return;
      if (hit.dataset.react === 'explode') return;
      const now = Date.now();
      const state = combos.get(hit) || { n: 0, t: 0 };
      state.n = now - state.t < Number(hit.dataset.comboWindow || COMBO_WINDOW) ? state.n + 1 : 1;
      state.t = now;
      combos.set(hit, state);
      const explodeAt = Number(hit.dataset.explodeAt || 0);
      const exploded = explodeAt > 0 && state.n >= explodeAt;
      const angry = !explodeAt && state.n >= COMBO_ANGRY && hit.dataset.angry;
      if (exploded || angry) state.n = 0;
      const alt = !exploded && !angry && hit.dataset.alt && Math.random() < 0.3;
      react(hit, exploded ? 'explode' : angry ? 'angry' : alt ? 'alt' : 'poke');
      sound(exploded ? 'pop' : angry ? hit.dataset.angry : alt ? hit.dataset.altSound || hit.dataset.hit : hit.dataset.hit);
      say(layer, hit, pick(exploded ? hit.dataset.explodeSay : angry ? hit.dataset.angrySay : alt ? hit.dataset.altSay : hit.dataset.say), angry ? 'angry' : '');
      burst(layer, hit, angry ? hit.dataset.angryBurst : hit.dataset.burst, exploded ? 32 : 9, exploded ? 3 : 1);
      if (exploded) {
        const rain = heartRain(layer);
        const timer = setTimeout(() => { rain.remove(); rainTimers.delete(timer); }, HEART_EXPLOSION_MS);
        rainTimers.add(timer);
      }
      window.dispatchEvent(new CustomEvent('vl-skin-poke', { detail: { slug, hit: hit.dataset.hit, angry: !!angry, exploded } }));
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
      timers.forEach((timer, hit) => {
        clearTimeout(timer);
        hit.removeAttribute('data-react');
      });
      rainTimers.forEach(timer => clearTimeout(timer));
      layer.querySelectorAll('.sk-heart-rain, .sk-bit, .sk-say').forEach(node => node.remove());
    };
  }, [ref, slug]);
}
