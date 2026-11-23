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

  const clink = (freq, at, gain = 0.12) => {
    noise(at, 0.03, { freq: 7000, q: 0.7, gain: gain * 1.4, attack: 0.001 });
    [[1, 1, 0.9], [2.756, 0.55, 0.55], [5.404, 0.3, 0.32], [8.933, 0.16, 0.2]].forEach(([ratio, level, dur]) => {
      tone(freq * ratio, at, dur, { gain: gain * level, attack: 0.001 });
    });
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
    notify() { bell(1174.66, 0, 0.15, 0.55); bell(1567.98, 0.13, 0.13, 0.75); tone(587.33, 0, 0.5, { gain: 0.035, attack: 0.02 }); },
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
    metal() { clink(1480, 0, 0.12); clink(2210, 0.055, 0.06); },
    metalGold() { clink(1046.5, 0, 0.13); clink(1568, 0.05, 0.08); clink(2637, 0.11, 0.04); },
    metalFlip() {
      noise(0, 0.2, { freq: 3200, to: 900, q: 0.8, gain: 0.18 });
      clink(1760, 0.14, 0.09);
    },
  };

  const pop = (at, from, to, gain = 0.12) => tone(from, at, 0.09, { to, gain, type: 'sine', attack: 0.004 });
  const square = (notes, step = 0.07, gain = 0.06) => notes.forEach((f, i) => tone(f, i * step, step * 1.1, { type: 'square', gain, lowpass: 3200 }));
  const crackle = (count, gain = 0.3) => { for (let i = 0; i < count; i++) noise(i * 0.05 + Math.random() * 0.04, 0.05, { filter: 'highpass', freq: 1800, gain, attack: 0.001 }); };
  const happy = ['correct', 'good', 'easy'];
  const sad = ['wrong', 'forget'];
  const party = ['complete', 'streak'];
  const SKIN_SOUNDS = {
    'meo-luoi': (n) => { if (happy.includes(n)) tone(720, 0.05, 0.32, { to: 540, type: 'sawtooth', gain: 0.05, lowpass: 1800, attack: 0.03 }); },
    'canh-cut': (n) => { if (party.includes(n)) noise(0.1, 0.6, { freq: 600, to: 3200, q: 0.6, gain: 0.12 }); if (happy.includes(n)) pop(0.04, 500, 900); },
    'nhen-du-to': (n) => { if (happy.includes(n)) { noise(0.02, 0.03, { freq: 5200, gain: 0.25, attack: 0.001 }); tone(260, 0.05, 0.18, { to: 620, type: 'triangle', gain: 0.07 }); } if (party.includes(n)) tone(180, 0.3, 0.5, { to: 900, type: 'triangle', gain: 0.06 }); },
    'rong': (n) => { if (party.includes(n)) { tone(98, 0.05, 2.2, { gain: 0.16, attack: 0.005 }); tone(196.5, 0.05, 1.6, { gain: 0.06 }); tone(311, 0.05, 1.2, { gain: 0.03 }); } if (happy.includes(n)) bell(587.33, 0.06, 0.06, 0.6); },
    'dai-duong': (n) => { if (happy.includes(n)) { pop(0.03, 380, 1150, 0.1); pop(0.13, 520, 1400, 0.07); } if (party.includes(n)) tone(140, 0.2, 1.4, { to: 90, gain: 0.08, lowpass: 600, attack: 0.2 }); },
    'rap-chieu': (n) => { if (n === 'flip') crackle(4, 0.18); if (party.includes(n)) { noise(0.02, 0.06, { filter: 'lowpass', freq: 2400, gain: 0.5, attack: 0.001 }); noise(0.1, 0.05, { filter: 'lowpass', freq: 1800, gain: 0.4, attack: 0.001 }); } },
    'tham-tu': (n) => { if (happy.includes(n)) { noise(0, 0.02, { freq: 3000, gain: 0.25, attack: 0.001 }); clink(2093, 0.08, 0.06); } if (sad.includes(n)) tone(146.8, 0.05, 0.6, { type: 'sawtooth', gain: 0.03, lowpass: 700 }); },
    'pixel': (n) => { if (happy.includes(n)) square([988, 1319], 0.06); if (sad.includes(n)) square([311, 233], 0.09); if (party.includes(n)) square([523, 659, 784, 1047, 784, 1047], 0.08); },
    'muc-ninja': (n) => { if (happy.includes(n)) noise(0.02, 0.16, { freq: 6000, to: 1500, q: 1.4, gain: 0.18 }); if (party.includes(n)) { noise(0, 0.14, { freq: 5000, to: 1200, gain: 0.16 }); noise(0.12, 0.14, { freq: 5500, to: 1300, gain: 0.14 }); } },
    'muc-phi-hanh-gia': (n) => { if (party.includes(n)) noise(0.05, 1.2, { filter: 'lowpass', freq: 200, to: 2400, gain: 0.22, attack: 0.15 }); if (happy.includes(n)) tone(1400, 0.05, 0.25, { to: 2200, gain: 0.04 }); },
    'tet': (n) => { if (party.includes(n)) crackle(10, 0.35); if (happy.includes(n)) bell(783.99, 0.05, 0.07, 0.5); },
    'valentine': (n) => { if (happy.includes(n)) { bell(1046.5, 0.05, 0.06, 0.5); bell(1318.5, 0.14, 0.05, 0.6); } },
    'trung-thu': (n) => { if (happy.includes(n)) [587.33, 659.25, 880].forEach((f, i) => bell(f, 0.05 + i * 0.08, 0.05, 0.5)); if (party.includes(n)) tone(110, 0.1, 1.6, { gain: 0.12 }); },
    'nha-giao': (n) => { if (happy.includes(n)) { clink(1318.5, 0.05, 0.07); clink(1318.5, 0.2, 0.05); } },
    'halloween': (n) => { if (happy.includes(n)) tone(440, 0.05, 0.6, { to: 660, type: 'sine', gain: 0.05, attack: 0.05 }); if (sad.includes(n)) tone(330, 0.05, 0.7, { to: 180, gain: 0.05, attack: 0.05 }); },
    'noel': (n) => { if (happy.includes(n) || party.includes(n)) for (let i = 0; i < 6; i++) clink(2600 + Math.random() * 900, 0.04 + i * 0.05, 0.035); },
  };

  SKIN_SOUNDS['mua-thu'] = (n) => { if (happy.includes(n)) noise(0.02, 0.35, { freq: 3200, q: 0.5, gain: 0.12 }); };
  SKIN_SOUNDS['hoa-anh-dao'] = (n) => { if (happy.includes(n)) [1568, 1760, 2093].forEach((f, i) => bell(f, 0.04 + i * 0.07, 0.035, 0.4)); };
  SKIN_SOUNDS['cho-corgi'] = (n) => { if (happy.includes(n)) { noise(0.03, 0.07, { freq: 700, q: 1.6, gain: 0.3 }); tone(420, 0.03, 0.09, { to: 280, type: 'square', gain: 0.05, lowpass: 1400 }); } };
  SKIN_SOUNDS['gau-truc'] = (n) => { if (happy.includes(n)) for (let i = 0; i < 4; i++) noise(0.03 + i * 0.07, 0.04, { freq: 2200, q: 0.9, gain: 0.2, attack: 0.002 }); };
  SKIN_SOUNDS['khung-long'] = (n) => { if (party.includes(n)) { noise(0.02, 0.9, { filter: 'lowpass', freq: 500, to: 160, gain: 0.35 }); tone(85, 0.02, 0.8, { type: 'sawtooth', gain: 0.06, lowpass: 400 }); } if (happy.includes(n)) tone(70, 0.02, 0.18, { gain: 0.25 }); };
  SKIN_SOUNDS['robot'] = (n) => { if (happy.includes(n)) square([880, 1175], 0.07, 0.05); if (sad.includes(n)) square([440, 330, 220], 0.09, 0.05); if (party.includes(n)) square([523, 784, 659, 1047], 0.07, 0.05); };
  SKIN_SOUNDS['thieu-nhi'] = (n) => { if (happy.includes(n)) { noise(0.02, 0.04, { filter: 'lowpass', freq: 3000, gain: 0.4, attack: 0.001 }); tone(700, 0.02, 0.12, { to: 140, gain: 0.08 }); } if (party.includes(n)) crackle(8, 0.25); };
  SKIN_SOUNDS['phu-nu'] = (n) => { if (happy.includes(n)) { bell(1318.5, 0.05, 0.05, 0.5); bell(1975.5, 0.15, 0.04, 0.6); } };

  const PET = {
    purr() { for (let i = 0; i < 12; i++) noise(i * 0.06, 0.07, { filter: 'lowpass', freq: 160, gain: 0.5, attack: 0.02 }); },
    meow() { tone(560, 0, 0.42, { to: 820, type: 'sawtooth', gain: 0.06, lowpass: 1700, attack: 0.04 }); tone(820, 0.2, 0.3, { to: 520, type: 'sawtooth', gain: 0.05, lowpass: 1500 }); },
    hiss() { noise(0, 0.7, { filter: 'highpass', freq: 3200, gain: 0.25, attack: 0.03 }); },
    eek() { tone(1400, 0, 0.09, { to: 2300, gain: 0.07, type: 'triangle' }); tone(1500, 0.12, 0.09, { to: 2500, gain: 0.07, type: 'triangle' }); },
    honk() { tone(310, 0, 0.14, { type: 'square', gain: 0.06, lowpass: 1200 }); tone(270, 0.17, 0.2, { type: 'square', gain: 0.06, lowpass: 1100 }); },
    slip() { tone(900, 0, 0.35, { to: 180, type: 'triangle', gain: 0.08 }); noise(0.36, 0.12, { filter: 'lowpass', freq: 300, gain: 0.5, attack: 0.002 }); },
    chime() { bell(1318.5, 0, 0.08, 0.7); bell(1760, 0.09, 0.07, 0.8); bell(2093, 0.18, 0.05, 0.9); },
    roar() { noise(0, 1, { filter: 'lowpass', freq: 700, to: 140, gain: 0.45, attack: 0.05 }); tone(95, 0, 0.9, { to: 60, type: 'sawtooth', gain: 0.07, lowpass: 500 }); },
    splash() { noise(0, 0.6, { freq: 1200, to: 300, q: 0.6, gain: 0.35, attack: 0.005 }); pop(0.1, 300, 900, 0.08); },
    clap() { noise(0, 0.05, { filter: 'lowpass', freq: 2600, gain: 0.7, attack: 0.001 }); },
    type() { for (let i = 0; i < 5; i++) noise(i * 0.08, 0.02, { freq: 3500, gain: 0.3, attack: 0.001 }); clink(2093, 0.45, 0.06); },
    coin() { tone(1046.5, 0, 0.06, { type: 'triangle', gain: 0.09 }); tone(1568, 0.06, 0.28, { type: 'triangle', gain: 0.09 }); },
    launch() { noise(0, 1.6, { filter: 'lowpass', freq: 150, to: 3000, gain: 0.3, attack: 0.3 }); },
    crackle() { crackle(14, 0.35); },
    kiss() { noise(0, 0.03, { freq: 2500, gain: 0.3, attack: 0.001 }); tone(1900, 0.01, 0.08, { to: 900, gain: 0.06 }); },
    boo() { tone(260, 0, 0.9, { to: 150, type: 'sawtooth', gain: 0.05, lowpass: 900, attack: 0.05 }); },
    jingle() { for (let i = 0; i < 9; i++) clink(2400 + Math.random() * 1400, i * 0.045, 0.04); },
    chalk() { tone(2900, 0, 0.12, { to: 3300, type: 'sawtooth', gain: 0.02, lowpass: 5000 }); noise(0, 0.25, { filter: 'highpass', freq: 3500, gain: 0.12 }); },
    chirp() { [3000, 3600, 3200].forEach((f, i) => tone(f, i * 0.09, 0.07, { to: f + 900, gain: 0.05 })); },
    snap() { noise(0, 0.025, { freq: 2400, gain: 0.5, attack: 0.001 }); noise(0.14, 0.025, { freq: 2600, gain: 0.5, attack: 0.001 }); },
    bark() { [0, 0.2].forEach(t => { noise(t, 0.08, { freq: 650, q: 1.5, gain: 0.45 }); tone(430, t, 0.1, { to: 260, type: 'square', gain: 0.06, lowpass: 1300 }); }); },
    beep() { square([880, 660, 990, 1320], 0.08, 0.05); },
    pop() { noise(0, 0.04, { filter: 'lowpass', freq: 3500, gain: 0.6, attack: 0.001 }); tone(650, 0, 0.12, { to: 120, gain: 0.1 }); },
    crunch() { for (let i = 0; i < 5; i++) noise(i * 0.09, 0.05, { freq: 1800 + Math.random() * 800, q: 0.8, gain: 0.25, attack: 0.002 }); },
    stomp() { tone(58, 0, 0.3, { gain: 0.35, attack: 0.002 }); noise(0, 0.15, { filter: 'lowpass', freq: 250, gain: 0.5, attack: 0.002 }); },
    rustle() { noise(0, 0.6, { freq: 3800, q: 0.4, gain: 0.16, attack: 0.05 }); },
    whoosh() { noise(0, 0.45, { freq: 600, to: 4000, q: 0.7, gain: 0.2 }); },
    gong() { tone(98, 0, 2.4, { gain: 0.18, attack: 0.004 }); tone(196, 0, 1.6, { gain: 0.06 }); tone(293, 0, 1.2, { gain: 0.03 }); },
    giggle() { [900, 1150, 950, 1200, 1000].forEach((f, i) => tone(f, i * 0.07, 0.06, { type: 'triangle', gain: 0.06 })); },
    boing() { tone(160, 0, 0.45, { to: 520, type: 'triangle', gain: 0.1 }); },
    sniff() { for (let i = 0; i < 3; i++) noise(i * 0.12, 0.06, { freq: 5000, q: 0.6, gain: 0.12 }); },
  };

  function pet(name) {
    if (!PET[name] || !audio()) return;
    try { PET[name](); } catch {}
  }

  function play(name) {
    window.dispatchEvent(new CustomEvent('vl-fx', { detail: name }));
    if (!SOUNDS[name] || !audio()) return;
    try { SOUNDS[name](); } catch {}
    const skin = SKIN_SOUNDS[document.documentElement.dataset.skin];
    if (skin) { try { skin(name); } catch {} }
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
    play, pet, confetti, stamp, countUp, floatText, celebrate,
    pop: el => restart(el, 'fx-pop'),
    shake: el => restart(el, 'fx-shake'),
    turn: el => restart(el, 'fx-turn'),
    setSound, isSoundOn: () => soundOn, reduced,
  };
})();
