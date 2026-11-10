(function () {
  if (typeof window === 'undefined' || window.VLFx) return;

  const KEY = 'vl-sound';
  const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let ctx = null;
  let master = null;
  let noiseBuffer = null;

  const readSetting = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
  let soundOn = readSetting();

  function audio() {
    if (!soundOn) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, at, dur, opts = {}) {
    const c = ctx;
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    const peak = opts.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (opts.lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(at, dur, opts = {}) {
    const c = ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const f = c.createBiquadFilter();
    f.type = opts.filter || 'bandpass';
    f.Q.value = opts.q ?? 1.2;
    f.frequency.setValueAtTime(opts.freq || 1500, t);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  const bell = (freq, at, gain = 0.16, dur = 0.5) => {
    tone(freq, at, dur, { gain });
    tone(freq * 2.01, at, dur * 0.6, { gain: gain * 0.25 });
  };

  const SOUNDS = {
    tap() { tone(1200, 0, 0.05, { type: 'triangle', gain: 0.06 }); },
    select() { tone(660, 0, 0.07, { type: 'triangle', gain: 0.09 }); tone(990, 0.04, 0.08, { type: 'triangle', gain: 0.06 }); },
    flip() {
      noise(0, 0.22, { freq: 2400, to: 500, q: 0.9, gain: 0.32 });
      tone(420, 0.02, 0.14, { to: 760, gain: 0.05, type: 'triangle' });
    },
    forget() { tone(262, 0, 0.22, { to: 196, gain: 0.16, type: 'triangle', lowpass: 1200 }); },
    hard() { tone(392, 0, 0.12, { gain: 0.12, type: 'triangle' }); tone(349, 0.1, 0.16, { gain: 0.11, type: 'triangle' }); },
    good() { bell(523.25, 0, 0.14, 0.32); bell(783.99, 0.09, 0.14, 0.42); },
    easy() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.06, 0.12, 0.38)); },
    correct() { bell(880, 0, 0.16, 0.45); bell(1318.5, 0.08, 0.15, 0.6); },
    wrong() {
      tone(196, 0, 0.13, { type: 'square', gain: 0.07, lowpass: 900 });
      tone(185, 0.15, 0.18, { type: 'square', gain: 0.07, lowpass: 900 });
    },
    stamp() {
      noise(0, 0.12, { filter: 'lowpass', freq: 500, gain: 0.55, attack: 0.002 });
      tone(110, 0, 0.26, { to: 45, gain: 0.5, attack: 0.002 });
    },
    sparkle() { for (let i = 0; i < 7; i++) bell(1600 + Math.random() * 1800, i * 0.045, 0.05, 0.25); },
    complete() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => bell(f, i * 0.09, 0.14, 0.4));
      [523.25, 659.25, 783.99].forEach(f => tone(f, 0.4, 1.1, { gain: 0.07, type: 'triangle', attack: 0.04 }));
      tone(1046.5, 0.4, 1.2, { gain: 0.08, attack: 0.04 });
      for (let i = 0; i < 8; i++) bell(2000 + Math.random() * 2000, 0.45 + i * 0.05, 0.035, 0.3);
    },
    streak() { [659.25, 880, 1318.5].forEach((f, i) => bell(f, i * 0.07, 0.12, 0.5)); },
  };

  function play(name) {
    if (!SOUNDS[name] || !audio()) return;
    try { SOUNDS[name](); } catch {}
  }

  const reduced = () => reduceQuery.matches;

  function restart(el, cls) {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  function palette() {
    const s = getComputedStyle(document.documentElement);
    return ['--primary-fill', '--accent', '--secondary', '--favorite', '--media-ink', '--edit']
      .map(v => s.getPropertyValue(v).trim()).filter(Boolean);
  }

  function confetti(opts = {}) {
    if (reduced()) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    const colors = palette();
    const parts = [];
    const origins = [];
    if (opts.from) {
      const r = opts.from.getBoundingClientRect();
      origins.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, spread: Math.PI * 2, up: 0 });
    } else {
      origins.push({ x: 0, y: H * 0.85, angle: -Math.PI / 3, spread: 0.7 });
      origins.push({ x: W, y: H * 0.85, angle: -Math.PI * 2 / 3, spread: 0.7 });
    }
    const count = opts.count || 140;
    for (let i = 0; i < count; i++) {
      const o = origins[i % origins.length];
      const angle = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * o.spread : Math.random() * Math.PI * 2;
      const speed = (opts.from ? 4 : 11) + Math.random() * (opts.from ? 6 : 9);
      parts.push({
        x: o.x, y: o.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (opts.from ? 3 : 0),
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        tilt: Math.random() * Math.PI, vt: 0.05 + Math.random() * 0.1,
        color: colors[Math.floor(Math.random() * colors.length)] || '#3549bb',
        round: Math.random() < 0.3,
      });
    }
    const start = performance.now();
    const life = opts.duration || 2800;
    function frame(now) {
      const t = now - start;
      g.clearRect(0, 0, W, H);
      const fade = t > life - 600 ? Math.max(0, (life - t) / 600) : 1;
      for (const p of parts) {
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.28;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.tilt += p.vt;
        g.save();
        g.globalAlpha = fade;
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.scale(1, Math.cos(p.tilt));
        g.fillStyle = p.color;
        if (p.round) { g.beginPath(); g.arc(0, 0, p.w / 2, 0, Math.PI * 2); g.fill(); }
        else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      }
      if (t < life) requestAnimationFrame(frame); else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function stamp(host, text = 'Hoàn thành', opts = {}) {
    if (!host) return null;
    host.querySelectorAll(':scope > .fx-stamp').forEach(n => n.remove());
    const el = document.createElement('span');
    el.className = 'fx-stamp' + (opts.tone ? ` is-${opts.tone}` : '');
    el.textContent = text;
    el.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(el);
    if (reduced()) { el.classList.add('is-still'); return el; }
    setTimeout(() => play('stamp'), 260);
    return el;
  }

  function countUp(el, to, opts = {}) {
    if (!el) return;
    const end = Number(to) || 0;
    const suffix = opts.suffix || '';
    if (reduced() || end === 0) { el.textContent = end + suffix; return; }
    const dur = opts.duration || 900;
    const start = performance.now();
    const step = now => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function floatText(from, text, toneName) {
    if (!from || reduced()) return;
    const r = from.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'fx-float' + (toneName ? ` is-${toneName}` : '');
    el.textContent = text;
    el.setAttribute('aria-hidden', 'true');
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top}px`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function celebrate(host, opts = {}) {
    play('complete');
    confetti(opts);
    if (host) stamp(host, opts.stamp || 'Hoàn thành', opts);
  }

  function setSound(on) {
    soundOn = !!on;
    try { localStorage.setItem(KEY, soundOn ? 'on' : 'off'); } catch {}
    document.documentElement.dataset.sound = soundOn ? 'on' : 'off';
    window.dispatchEvent(new CustomEvent('vl-sound', { detail: soundOn }));
    if (soundOn) play('select');
  }

  document.documentElement.dataset.sound = soundOn ? 'on' : 'off';

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest('.btn, .rate, .choice-card, .opt');
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true' || reduced()) return;
    const r = target.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'fx-ripple';
    dot.style.left = `${event.clientX - r.left}px`;
    dot.style.top = `${event.clientY - r.top}px`;
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    target.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }, { passive: true });

  document.addEventListener('change', event => {
    if (event.target.matches('.choice-card input, .choice input')) play('select');
  });

  window.VLFx = {
    play, confetti, stamp, countUp, floatText, celebrate,
    pop: el => restart(el, 'fx-pop'),
    shake: el => restart(el, 'fx-shake'),
    turn: el => restart(el, 'fx-turn'),
    setSound, isSoundOn: () => soundOn, reduced,
  };
})();
