'use client';
import { useEffect } from 'react';

const LAP_LEGS = 4;
const LAP_DURATION = 20 * 1000;
const REAPPEAR_DELAY = 3 * 60 * 1000;

export function useDolphinSwim(ref) {
  useEffect(() => {
    const dolphin = ref.current;
    if (!dolphin) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;
    let lapTimer = null;
    let restTimer = null;
    let resting = false;
    let legsRemaining = LAP_LEGS;
    let lapStart;
    let stopped = false;
    let position;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const bounds = () => {
      const header = document.querySelector('.app-header')?.getBoundingClientRect();
      const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
      const rail = document.querySelector('.app-rail')?.getBoundingClientRect();
      const maxX = Math.max(0, window.innerWidth - dolphin.offsetWidth - 32);
      const bottom = nav?.height ? nav.top : window.innerHeight;
      const maxY = Math.max(0, bottom - dolphin.offsetHeight - 96);
      return {
        minX: Math.min(maxX, (rail?.right || 0) + 32), maxX,
        minY: Math.min(maxY, (header?.bottom || 0) + 32), maxY,
      };
    };
    const contain = (point, box) => ({
      x: clamp(point.x, box.minX, box.maxX),
      y: clamp(point.y, box.minY, box.maxY),
    });
    const transform = point => `translate3d(${point.x}px, ${point.y}px, 0)`;
    const place = point => { dolphin.style.transform = transform(point); };

    const hideAndWait = () => {
      if (stopped || resting) return;
      resting = true;
      window.clearTimeout(lapTimer);
      lapTimer = null;
      animation?.cancel();
      animation = null;
      dolphin.dataset.resting = 'true';
      dolphin.hidden = true;
      restTimer = window.setTimeout(startLap, REAPPEAR_DELAY);
    };

    const finishLeg = target => {
      position = target;
      place(position);
      legsRemaining--;
      if (legsRemaining > 0) swim();
      else hideAndWait();
    };

    const swim = () => {
      if (stopped || resting || motion.matches || document.hidden || animation) return;
      const box = bounds();
      position = contain(position, box);
      place(position);
      let target = contain(lapStart, box);
      let distance = Math.hypot(target.x - position.x, target.y - position.y);
      if (legsRemaining > 1) {
        const minDistance = Math.min(200, Math.hypot(box.maxX - box.minX, box.maxY - box.minY) * .35);
        for (let attempt = 0; attempt < 5; attempt++) {
          target = {
            x: box.minX + Math.random() * (box.maxX - box.minX),
            y: box.minY + Math.random() * (box.maxY - box.minY),
          };
          distance = Math.hypot(target.x - position.x, target.y - position.y);
          if (distance >= minDistance) break;
        }
      }
      if (distance < 1) { finishLeg(target); return; }
      if (Math.abs(target.x - position.x) > 1) {
        dolphin.style.setProperty('--sk-facing', target.x > position.x ? '-1' : '1');
      }
      const leg = dolphin.animate([
        { transform: transform(position) }, { transform: transform(target) },
      ], {
        duration: LAP_DURATION / LAP_LEGS,
        easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'forwards',
      });
      animation = leg;
      leg.onfinish = () => {
        if (stopped || animation !== leg) return;
        animation = null;
        leg.cancel();
        finishLeg(target);
      };
    };

    const startLap = () => {
      if (stopped) return;
      restTimer = null;
      resting = false;
      delete dolphin.dataset.resting;
      dolphin.hidden = false;
      legsRemaining = LAP_LEGS;
      position = contain(position, bounds());
      lapStart = { ...position };
      place(position);
      lapTimer = window.setTimeout(hideAndWait, LAP_DURATION);
      swim();
    };

    const restart = () => {
      if (stopped || resting) return;
      const current = dolphin.getBoundingClientRect();
      animation?.cancel();
      animation = null;
      position = contain({ x: current.left, y: current.top }, bounds());
      place(position);
      swim();
    };
    const onVisibility = () => {
      if (document.hidden) animation?.pause();
      else if (animation) animation.play();
      else swim();
    };

    const box = bounds();
    position = { x: box.maxX, y: box.maxY };
    startLap();
    window.addEventListener('resize', restart);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', restart);
    return () => {
      stopped = true;
      animation?.cancel();
      window.clearTimeout(lapTimer);
      window.clearTimeout(restTimer);
      window.removeEventListener('resize', restart);
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', restart);
    };
  }, [ref]);
}
