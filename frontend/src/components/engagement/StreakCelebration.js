'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MILESTONE_LINES, nextMilestone } from '@/lib/streak.mjs';
import { fx } from '@/lib/fx';
import styles from './StreakCelebration.module.css';

function seeded(i) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function StreakCelebration({ value, onClose }) {
  const [count, setCount] = useState(0);
  const button = useRef(null);
  const embers = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    left: `${(seeded(i) * 100).toFixed(2)}%`,
    delay: `${(seeded(i + 100) * 2.4).toFixed(2)}s`,
    duration: `${(2.6 + seeded(i + 200) * 2.4).toFixed(2)}s`,
    size: `${(4 + seeded(i + 300) * 9).toFixed(1)}px`,
    drift: `${((seeded(i + 400) - 0.5) * 160).toFixed(0)}px`
  })), []);
  const next = nextMilestone(value);

  useEffect(() => {
    fx.play('streak');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const total = reduce ? 0 : Math.min(1400, 500 + value * 4);
    let frame;
    const tick = now => {
      const t = total ? Math.min(1, (now - start) / total) : 1;
      setCount(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const focus = setTimeout(() => button.current?.focus(), 300);
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(frame); clearTimeout(focus); document.removeEventListener('keydown', onKey); };
  }, [value, onClose]);

  return createPortal(<div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="streak-cel-title" onClick={onClose}>
    <div className={styles.glow} aria-hidden="true" />
    <div className={styles.embers} aria-hidden="true">
      {embers.map((ember, i) => <span key={i} style={{ left: ember.left, animationDelay: ember.delay, animationDuration: ember.duration, width: ember.size, height: ember.size, '--drift': ember.drift }} />)}
    </div>
    <div className={styles.flames} aria-hidden="true">
      {[62, 78, 70, 92, 100, 88, 74, 82, 64].map((height, i) => <span key={i} style={{ '--i': i, height: `${height}%` }} />)}
    </div>
    <div className={styles.card} onClick={event => event.stopPropagation()}>
      <div className={styles.fire} aria-hidden="true">
        <svg viewBox="0 0 120 150">
          <defs>
            <radialGradient id="sc-outer" cx="50%" cy="75%" r="65%"><stop offset="0" stopColor="#ffe08a" /><stop offset=".45" stopColor="#ff9a2e" /><stop offset="1" stopColor="#e2401c" /></radialGradient>
            <radialGradient id="sc-inner" cx="50%" cy="80%" r="60%"><stop offset="0" stopColor="#fffbe6" /><stop offset=".6" stopColor="#ffd25e" /><stop offset="1" stopColor="#ff9a2e" /></radialGradient>
          </defs>
          <path className={styles.outer} d="M60 6c6 22 30 34 36 62 7 33-12 72-36 76C36 140 17 110 22 80c3-20 15-28 17-46 12 10 14 22 14 22S58 30 60 6Z" fill="url(#sc-outer)" />
          <path className={styles.inner} d="M60 58c4 14 20 24 22 42 2 22-9 38-22 40-13-2-25-15-23-35 1-12 9-17 11-28 6 6 8 13 8 13s2-17 4-32Z" fill="url(#sc-inner)" />
        </svg>
      </div>
      <p className={styles.kicker}>Mốc chuỗi mới</p>
      <h2 id="streak-cel-title" className={styles.number}><span>{count}</span> ngày</h2>
      <p className={styles.line}>{MILESTONE_LINES[value] || 'Chuỗi mới! Giữ lửa tiếp nhé.'}</p>
      {next && <p className={styles.next}>Mốc tiếp theo: <strong>{next} ngày</strong></p>}
      <button ref={button} type="button" className={`btn btn-accent btn-lg ${styles.button}`} onClick={onClose}>Giữ lửa tiếp 🔥</button>
    </div>
  </div>, document.body);
}
