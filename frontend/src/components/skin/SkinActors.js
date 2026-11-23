'use client';

function Spider() {
  return (
    <>
      <svg className="sk-web sk-web-tr" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M200 0 L60 0 M200 0 L80 60 M200 0 L130 110 M200 0 L190 150 M200 0 L200 140" />
          <path d="M175 0 Q178 12 200 18 M150 0 Q155 28 200 40 M122 0 Q130 46 200 66 M95 0 Q104 64 200 94 M70 0 Q80 84 200 122" />
        </g>
      </svg>
      <svg className="sk-web sk-web-bl" viewBox="0 0 140 140">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M0 140 L0 40 M0 140 L60 60 M0 140 L110 100 M0 140 L130 140" />
          <path d="M0 115 Q18 112 22 140 M0 92 Q34 88 44 140 M0 70 Q50 64 66 140 M0 50 Q62 44 88 140" />
        </g>
      </svg>
      <div className="sk-spider">
        <span className="sk-thread" />
        <svg className="sk-spider-body" viewBox="0 0 60 60">
          <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path className="sk-legs-l" d="M24 28 Q12 18 6 24 M24 31 Q10 28 4 36 M24 34 Q12 38 8 48 M25 37 Q18 46 16 56" />
            <path className="sk-legs-r" d="M36 28 Q48 18 54 24 M36 31 Q50 28 56 36 M36 34 Q48 38 52 48 M35 37 Q42 46 44 56" />
          </g>
          <ellipse cx="30" cy="36" rx="9" ry="10" fill="currentColor" />
          <circle cx="30" cy="24" r="6.5" fill="currentColor" />
          <circle cx="27.5" cy="23" r="1.9" fill="#fff" /><circle cx="32.5" cy="23" r="1.9" fill="#fff" />
          <circle cx="27.8" cy="23.4" r=".9" fill="#111" /><circle cx="32.8" cy="23.4" r=".9" fill="#111" />
          <path d="M26 40 Q30 44 34 40" stroke="#e33" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

function Cat() {
  return (
    <div className="sk-cat">
      <svg viewBox="0 0 120 70">
        <g className="sk-cat-tail"><path d="M100 54 Q122 50 116 28 Q113 18 106 22" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></g>
        <ellipse cx="62" cy="52" rx="40" ry="16" fill="currentColor" />
        <g className="sk-cat-head">
          <circle cx="28" cy="44" r="16" fill="currentColor" />
          <path d="M16 34 L14 18 L26 30 Z M32 30 L42 18 L42 36 Z" fill="currentColor" />
          <path className="sk-cat-eye" d="M20 44 Q24 47 28 44 M32 44 Q36 47 40 44" stroke="var(--skin-ink, #fff)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
        <text className="sk-cat-z" x="44" y="18" fontSize="12" fill="currentColor">z</text>
        <text className="sk-cat-z sk-cat-z2" x="52" y="10" fontSize="9" fill="currentColor">z</text>
      </svg>
    </div>
  );
}

function Penguin() {
  return (
    <div className="sk-penguin">
      <svg viewBox="0 0 60 80">
        <ellipse cx="30" cy="46" rx="20" ry="28" fill="#1f2633" />
        <ellipse cx="30" cy="52" rx="13" ry="20" fill="#fff" />
        <circle cx="24" cy="30" r="3" fill="#fff" /><circle cx="36" cy="30" r="3" fill="#fff" />
        <circle cx="24.6" cy="30.4" r="1.5" fill="#111" /><circle cx="36.6" cy="30.4" r="1.5" fill="#111" />
        <path d="M26 36 L34 36 L30 41 Z" fill="#f2a422" />
        <path d="M18 74 L26 72 L24 78 Z M42 74 L34 72 L36 78 Z" fill="#f2a422" />
        <path d="M30 18 Q40 14 44 22" stroke="#e0464a" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Lanterns({ star = false }) {
  return (
    <div className="sk-lanterns">
      {[0, 1, 2].map(i => (
        <span key={i} className="sk-lantern" style={{ '--i': i }}>
          <span className="sk-lantern-cord" />
          {star ? (
            <svg viewBox="0 0 60 60"><path d="M30 4 L37 22 L56 22 L41 34 L47 53 L30 42 L13 53 L19 34 L4 22 L23 22 Z" fill="#ffcd3c" stroke="#d1392b" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="30" cy="30" r="6" fill="#fff6c4" /></svg>
          ) : (
            <svg viewBox="0 0 50 70"><rect x="18" y="2" width="14" height="6" rx="2" fill="#7a3b12" /><ellipse cx="25" cy="34" rx="20" ry="25" fill="#d8392b" /><path d="M10 22 Q25 18 40 22 M7 34 Q25 30 43 34 M10 46 Q25 42 40 46" stroke="#ffcf5a" strokeWidth="1.6" fill="none" /><rect x="18" y="58" width="14" height="6" rx="2" fill="#7a3b12" /><path d="M22 64 L22 70 M25 64 L25 70 M28 64 L28 70" stroke="#ffcf5a" strokeWidth="1.5" /></svg>
          )}
        </span>
      ))}
    </div>
  );
}

function Dragon() {
  return (
    <div className="sk-dragon">
      <svg viewBox="0 0 400 90">
        <path className="sk-dragon-body" d="M10 50 C60 10 100 80 150 45 S240 10 290 45 S350 70 370 40" fill="none" stroke="#e5b43c" strokeWidth="14" strokeLinecap="round" />
        <path d="M10 50 C60 10 100 80 150 45 S240 10 290 45 S350 70 370 40" fill="none" stroke="#c0392b" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="378" cy="36" r="14" fill="#e5b43c" />
        <path d="M384 28 L398 14 M372 26 L366 10" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="382" cy="34" r="2.4" fill="#111" />
        <path d="M388 42 Q400 50 394 58" stroke="#c0392b" strokeWidth="2" fill="none" />
        <circle className="sk-dragon-pearl" cx="395" cy="70" r="7" fill="#fff4c2" />
      </svg>
    </div>
  );
}

function Whale() {
  return (
    <div className="sk-whale">
      <svg viewBox="0 0 160 80">
        <path d="M10 44 Q20 14 70 16 Q120 18 134 40 L152 28 Q150 44 156 56 L134 48 Q118 70 66 68 Q20 66 10 44 Z" fill="#2f6f9e" />
        <path d="M18 50 Q40 64 80 62 Q110 60 124 50" fill="#a8d6ef" opacity=".7" />
        <circle cx="34" cy="38" r="2.6" fill="#0b2233" />
        <path d="M30 14 Q32 2 28 -4 M34 14 Q40 4 44 0" stroke="#bfe6ff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Projector() {
  return (
    <>
      <div className="sk-clap">
        <svg viewBox="0 0 80 64">
          <g className="sk-clap-top"><rect x="4" y="4" width="72" height="12" rx="2" fill="#f4f1e8" /><path d="M10 4 L20 16 M28 4 L38 16 M46 4 L56 16 M64 4 L74 16" stroke="#15161a" strokeWidth="6" /></g>
          <rect x="4" y="18" width="72" height="42" rx="3" fill="#15161a" />
          <text x="12" y="38" fontSize="10" fill="#f4f1e8" fontFamily="monospace">TAKE 1</text>
          <text x="12" y="52" fontSize="8" fill="#c9c4b4" fontFamily="monospace">VOCAB</text>
        </svg>
      </div>
    </>
  );
}

function Lamp() {
  return (
    <div className="sk-lamp">
      <svg viewBox="0 0 60 200"><path d="M30 200 L30 40 Q30 20 46 20" stroke="#4b4e55" strokeWidth="5" fill="none" /><path d="M38 18 L56 18 L52 28 L42 28 Z" fill="#4b4e55" /></svg>
      <span className="sk-lamp-glow" />
    </div>
  );
}

function Magnifier() {
  return (
    <div className="sk-magnifier">
      <svg viewBox="0 0 60 60"><circle cx="24" cy="24" r="15" fill="rgba(255,255,255,.08)" stroke="currentColor" strokeWidth="4" /><path d="M35 35 L54 54" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg>
    </div>
  );
}

function Pixel() {
  return (
    <>
      <div className="sk-block"><span>?</span></div>
      <div className="sk-coin" />
    </>
  );
}

function Shuriken() {
  return (
    <div className="sk-shuriken">
      <svg viewBox="0 0 40 40"><path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill="#c7ccd6" stroke="#4a5160" strokeWidth="1.5" /><circle cx="20" cy="20" r="3.5" fill="#4a5160" /></svg>
    </div>
  );
}

function Rocket() {
  return (
    <div className="sk-rocket">
      <svg viewBox="0 0 40 90"><path d="M20 2 Q34 20 32 56 L8 56 Q6 20 20 2 Z" fill="#eef1f8" stroke="#30405a" strokeWidth="1.5" /><circle cx="20" cy="28" r="6" fill="#4fa3ff" stroke="#30405a" strokeWidth="2" /><path d="M8 44 L0 62 L8 58 Z M32 44 L40 62 L32 58 Z" fill="#e0464a" /><path className="sk-flame" d="M12 58 Q20 90 28 58 Z" fill="#ffb340" /></svg>
    </div>
  );
}

function Blossom({ kind = 'mai' }) {
  const color = kind === 'dao' ? '#f28bb0' : '#f7c531';
  const center = kind === 'dao' ? '#c2185b' : '#d1392b';
  const flowers = [[60, 30], [110, 52], [150, 24], [190, 70], [92, 92], [36, 70]];
  return (
    <svg className={`sk-branch sk-branch-${kind}`} viewBox="0 0 240 140">
      <path d="M0 10 Q80 30 120 60 T236 110 M70 30 Q90 70 84 110 M150 74 Q170 40 196 30" stroke="#5b3a24" strokeWidth="5" fill="none" strokeLinecap="round" />
      {flowers.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-7" rx="5" ry="7" fill={color} transform={`rotate(${a})`} />)}
          <circle r="3" fill={center} />
        </g>
      ))}
    </svg>
  );
}

function Envelope() {
  return (
    <div className="sk-envelope">
      <svg viewBox="0 0 50 70"><rect x="2" y="2" width="46" height="66" rx="4" fill="#d32f2f" /><path d="M2 20 L25 34 L48 20" stroke="#ffca28" strokeWidth="2.5" fill="none" /><circle cx="25" cy="34" r="7" fill="#ffca28" /><text x="25" y="38" fontSize="9" textAnchor="middle" fill="#b71c1c" fontWeight="700">福</text></svg>
    </div>
  );
}

function Moon() {
  return (
    <div className="sk-moon">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#fff3c4" />
        <circle cx="40" cy="44" r="8" fill="#f3e2a2" /><circle cx="76" cy="78" r="11" fill="#f3e2a2" /><circle cx="82" cy="40" r="5" fill="#f3e2a2" />
        <g fill="#e8d18a"><ellipse cx="58" cy="74" rx="12" ry="9" /><circle cx="48" cy="64" r="6" /><path d="M44 58 L40 44 L47 56 Z M50 57 L50 42 L53 56 Z" /></g>
      </svg>
    </div>
  );
}

function Bouquet() {
  return (
    <div className="sk-bouquet">
      <svg viewBox="0 0 110 130">
        <path d="M55 128 L30 70 M55 128 L55 62 M55 128 L82 70" stroke="#2e7d32" strokeWidth="3" />
        {[[30, 60, '#e53950'], [55, 50, '#f48fb1'], [82, 60, '#ffb300'], [42, 38, '#ab47bc'], [70, 36, '#ef5350']].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx="0" cy="-8" rx="5.5" ry="8" fill={c} transform={`rotate(${a})`} />)}<circle r="4" fill="#fff59d" /></g>
        ))}
        <path d="M30 96 L80 96 L66 126 L44 126 Z" fill="#f6efe0" stroke="#c8b99a" />
        <path d="M44 106 Q55 114 66 106" stroke="#e53950" strokeWidth="3" fill="none" />
      </svg>
      <span className="sk-thanks">Tri ân thầy cô</span>
    </div>
  );
}

function Pumpkins() {
  return (
    <div className="sk-pumpkins">
      {[0, 1, 2].map(i => (
        <svg key={i} className="sk-pumpkin" style={{ '--i': i }} viewBox="0 0 70 60">
          <path d="M35 10 Q38 2 44 4" stroke="#3e6b2a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="22" cy="36" rx="16" ry="20" fill="#e86f1c" /><ellipse cx="48" cy="36" rx="16" ry="20" fill="#e86f1c" /><ellipse cx="35" cy="36" rx="15" ry="22" fill="#f38a2a" />
          <path className="sk-pumpkin-face" d="M24 30 L30 26 L30 34 Z M46 30 L40 26 L40 34 Z M24 42 Q35 52 46 42 L42 44 L38 41 L35 45 L32 41 L28 44 Z" fill="#ffe066" />
        </svg>
      ))}
    </div>
  );
}

function Lights() {
  return (
    <div className="sk-lights">
      {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
    </div>
  );
}

function Hearts() {
  return <div className="sk-heart-big"><svg viewBox="0 0 60 54"><path d="M30 52 C10 36 2 26 2 15 C2 7 8 2 16 2 C22 2 27 6 30 11 C33 6 38 2 44 2 C52 2 58 7 58 15 C58 26 50 36 30 52 Z" fill="#e94b75" /></svg></div>;
}

function Landscape({ kind }) {
  return (
    <>
      <div className={`sk-hills sk-hills-${kind}`} />
      {kind === 'bien' && <div className="sk-sun" />}
      {kind === 'bien' && <div className="sk-waves" />}
      {kind === 'thong' && <svg className="sk-bird" viewBox="0 0 40 20"><path d="M2 12 Q10 2 20 12 Q30 2 38 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>}
    </>
  );
}

const W = (back, front) => ({ back, front });

function Chalk() {
  return (
    <>
      <div className="sk-chalk-doodles"><span>a + b = ?</span><span>ABC</span><span>✓ Học mỗi ngày</span></div>
      <div className="sk-tray"><i /><i /><i /></div>
    </>
  );
}

function Check() {
  return <svg className="sk-check" viewBox="0 0 80 60"><path d="M8 32 L30 52 L72 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Projection() {
  return <><div className="sk-beam" /><div className="sk-film sk-film-l" /><div className="sk-film sk-film-r" /></>;
}

const ACTORS = {
  'bang-xanh': W(Chalk, Check),
  'rung-thong': W(() => <Landscape kind="thong" />),
  'bien-chieu': W(() => <Landscape kind="bien" />),
  'ruong-bac-thang': W(() => <Landscape kind="ruong" />),
  'pho-hoi': W(null, () => <Lanterns />),
  'meo-luoi': W(null, Cat),
  'canh-cut': W(() => <Landscape kind="bang" />, Penguin),
  'nhen-du-to': W(null, Spider),
  'rong': W(null, Dragon),
  'dai-duong': W(null, Whale),
  'rap-chieu': W(Projection, Projector),
  'tham-tu': W(() => <><div className="sk-blinds" /><Lamp /></>, Magnifier),
  'pixel': W(() => <div className="sk-ground" />, Pixel),
  'muc-ninja': W(() => <><div className="sk-bamboo sk-bamboo-l" /><div className="sk-bamboo sk-bamboo-r" /></>, Shuriken),
  'muc-phi-hanh-gia': W(() => <div className="sk-planet" />, Rocket),
  'tet': W(null, () => <><Blossom kind="mai" /><Blossom kind="dao" /><Envelope /></>),
  'valentine': W(null, Hearts),
  'trung-thu': W(Moon, () => <Lanterns star />),
  'nha-giao': W(null, Bouquet),
  'halloween': W(null, () => <><Pumpkins /><Spider /></>),
  'noel': W(() => <Landscape kind="tuyet" />, Lights),
};

export function SkinBackdrop({ slug }) {
  const Back = ACTORS[slug]?.back;
  return Back ? <div className="skin-backdrop"><Back /></div> : null;
}

export function SkinActors({ slug }) {
  const Front = ACTORS[slug]?.front;
  return Front ? <div className="skin-actors"><Front /></div> : null;
}

export function SkinCostume() {
  return (
    <span className="muc-costume" aria-hidden="true">
      <svg className="costume-ninja" viewBox="0 0 100 40"><path d="M14 22 Q50 8 86 22 L86 30 Q50 16 14 30 Z" fill="#2b2f3a" /><path d="M86 24 Q98 20 100 34 M86 28 Q94 34 90 40" stroke="#2b2f3a" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="50" cy="20" r="4" fill="#c7ccd6" /></svg>
      <svg className="costume-astro" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="rgba(190,225,255,.22)" stroke="#e8eef8" strokeWidth="5" /><path d="M24 30 Q36 16 52 14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".8" /></svg>
      <svg className="costume-santa" viewBox="0 0 100 60"><path d="M16 46 Q40 0 76 8 Q90 12 92 34 L80 30 Q70 18 60 22 Z" fill="#d32f2f" /><rect x="10" y="40" width="72" height="14" rx="7" fill="#fff" /><circle cx="92" cy="38" r="8" fill="#fff" /></svg>
      <svg className="costume-witch" viewBox="0 0 100 70"><path d="M20 56 L56 2 L66 14 L74 56 Z" fill="#3c2a5a" /><ellipse cx="50" cy="58" rx="46" ry="9" fill="#2c1f45" /><rect x="26" y="46" width="48" height="7" fill="#f38a2a" /></svg>
      <svg className="costume-tet" viewBox="0 0 60 60">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="30" cy="20" rx="8" ry="11" fill="#f7c531" transform={`rotate(${a} 30 30)`} />)}<circle cx="30" cy="30" r="5" fill="#d1392b" /></svg>
      <svg className="costume-lantern" viewBox="0 0 60 90"><path d="M30 0 L30 30" stroke="#7a3b12" strokeWidth="3" /><path d="M30 30 L36 46 L54 46 L40 56 L45 74 L30 63 L15 74 L20 56 L6 46 L24 46 Z" fill="#ffcd3c" stroke="#d1392b" strokeWidth="2" strokeLinejoin="round" /></svg>
    </span>
  );
}
