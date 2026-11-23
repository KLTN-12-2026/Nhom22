'use client';
import { useRef } from 'react';
import { useSkinPlay } from './useSkinPlay';

function Spider() {
  return (
    <>
      <svg className="sk-web sk-web-tr" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M200 0 L60 0 M200 0 L80 60 M200 0 L130 110 M200 0 L190 150 M200 0 L200 140" />
          <path d="M175 0 Q178 12 200 18 M150 0 Q155 28 200 40 M122 0 Q130 46 200 66 M95 0 Q104 64 200 94 M70 0 Q80 84 200 122" />
        </g>
      </svg>
      <div className="sk-spider">
        <span className="sk-thread" />
        <div className="sk-hit sk-spider-hit" data-hit="eek" data-hover="sniff" data-say="Á! Đừng chọc mà!|Tớ chỉ đang giăng tơ thôi…|Học bài đi, đừng nhìn tớ!" data-angry="boing" data-angry-say="Thôi tớ trốn đây!" data-alt="1" data-alt-sound="giggle" data-alt-say="Hihi, nhột quá!">
          <svg className="sk-spider-body" viewBox="0 0 60 60">
            <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
              <path className="sk-legs-l" d="M24 28 Q12 18 6 24 M24 31 Q10 28 4 36 M24 34 Q12 38 8 48 M25 37 Q18 46 16 56" />
              <path className="sk-legs-r" d="M36 28 Q48 18 54 24 M36 31 Q50 28 56 36 M36 34 Q48 38 52 48 M35 37 Q42 46 44 56" />
            </g>
            <ellipse cx="30" cy="36" rx="9" ry="10" fill="currentColor" />
            <circle cx="30" cy="24" r="6.5" fill="currentColor" />
            <g className="sk-eyes-open"><circle cx="27.5" cy="23" r="1.9" fill="#fff" /><circle cx="32.5" cy="23" r="1.9" fill="#fff" /><circle cx="27.8" cy="23.4" r=".9" fill="#111" /><circle cx="32.8" cy="23.4" r=".9" fill="#111" /></g>
            <g className="sk-eyes-shock"><circle cx="27.2" cy="22.6" r="2.6" fill="#fff" /><circle cx="32.8" cy="22.6" r="2.6" fill="#fff" /><circle cx="27.2" cy="22.6" r=".7" fill="#111" /><circle cx="32.8" cy="22.6" r=".7" fill="#111" /></g>
            <path className="sk-mouth-smile" d="M26 40 Q30 44 34 40" stroke="#e33" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <ellipse className="sk-mouth-o" cx="30" cy="41" rx="2" ry="2.6" fill="#e33" />
          </svg>
        </div>
      </div>
    </>
  );
}

function Cat() {
  return (
    <div className="sk-cat sk-hit" data-hit="meow" data-hover="purr" data-burst="♥♡" data-say="Meo~ gãi tai nữa đi|Học xong rồi chơi với tớ nha|Grừ grừ… dễ chịu quá|Cho tớ con cá đi" data-angry="hiss" data-angry-say="Hứ! Đủ rồi đó!|Tớ dỗi rồi nhé!" data-angry-burst="💢" data-alt="1" data-alt-sound="giggle" data-alt-say="Đang mơ thấy cá ngừ…">
      <svg viewBox="0 0 120 70">
        <g className="sk-cat-tail"><path d="M100 54 Q122 50 116 28 Q113 18 106 22" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></g>
        <ellipse className="sk-cat-belly" cx="62" cy="52" rx="40" ry="16" fill="currentColor" />
        <g className="sk-cat-head">
          <circle cx="28" cy="44" r="16" fill="currentColor" />
          <path className="sk-cat-ears" d="M16 34 L14 18 L26 30 Z M32 30 L42 18 L42 36 Z" fill="currentColor" />
          <path className="sk-cat-sleep" d="M20 44 Q24 47 28 44 M32 44 Q36 47 40 44" stroke="var(--sk-eye, #fff)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path className="sk-cat-happy" d="M20 46 Q24 41 28 46 M32 46 Q36 41 40 46" stroke="var(--sk-eye, #fff)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <g className="sk-cat-wide"><circle cx="24" cy="44" r="3.6" fill="#ffe27a" /><circle cx="36" cy="44" r="3.6" fill="#ffe27a" /><ellipse cx="24" cy="44" rx="1" ry="3" fill="#111" /><ellipse cx="36" cy="44" rx="1" ry="3" fill="#111" /></g>
          <ellipse className="sk-cat-blush" cx="19" cy="50" rx="3" ry="1.6" fill="#ff8fa3" /><ellipse className="sk-cat-blush" cx="38" cy="50" rx="3" ry="1.6" fill="#ff8fa3" />
        </g>
        <text className="sk-cat-z" x="44" y="18" fontSize="12" fill="currentColor">z</text>
        <text className="sk-cat-z sk-cat-z2" x="52" y="10" fontSize="9" fill="currentColor">z</text>
      </svg>
    </div>
  );
}

function Penguin() {
  return (
    <div className="sk-penguin sk-hit" data-hit="slip" data-say="Ối trơn quá!|Té cái bịch…|Không sao, đứng dậy học tiếp!" data-angry="honk" data-angry-say="Quác! Đừng đẩy tớ nữa!" data-alt="1" data-alt-sound="honk" data-alt-say="Quác quác!" data-dur="1600">
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
        <span key={i} className="sk-lantern sk-hit" style={{ '--i': i }} data-hit="chime" data-say={star ? 'Rước đèn ông sao~|Tùng dinh dinh!|Trăng sáng quá!' : 'Đèn sáng rực rỡ!|Phố cổ đẹp quá|Leng keng~'} data-burst="✦✧" data-angry="gong" data-angry-say="Chóng mặt quá rồi!">
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
    <div className="sk-dragon sk-hit" data-hit="roar" data-say="Grào! (nhỏ thôi kẻo hàng xóm nghe)|Ta là rồng học bá!|Phun lửa nè!" data-burst="🔥✦" data-angry="gong" data-angry-say="Rồng nổi giận rồi!" data-angry-burst="🔥">
      <svg viewBox="0 0 400 90">
        <path className="sk-dragon-body" d="M10 50 C60 10 100 80 150 45 S240 10 290 45 S350 70 370 40" fill="none" stroke="#e5b43c" strokeWidth="14" strokeLinecap="round" />
        <path d="M10 50 C60 10 100 80 150 45 S240 10 290 45 S350 70 370 40" fill="none" stroke="#c0392b" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="378" cy="36" r="14" fill="#e5b43c" />
        <path d="M384 28 L398 14 M372 26 L366 10" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="382" cy="34" r="2.4" fill="#111" />
        <path d="M388 42 Q400 50 394 58" stroke="#c0392b" strokeWidth="2" fill="none" />
        <g className="sk-fire"><path d="M392 44 Q420 30 440 46 Q420 52 430 64 Q410 56 392 50 Z" fill="#ff8a1f" /><path d="M394 46 Q412 40 424 48 Q412 52 416 58 Q404 54 394 49 Z" fill="#ffe066" /></g>
        <circle className="sk-dragon-pearl" cx="395" cy="70" r="7" fill="#fff4c2" />
      </svg>
    </div>
  );
}

function Whale() {
  return (
    <div className="sk-whale">
      <div className="sk-hit sk-whale-hit" data-hit="splash" data-say="Phụt! Mát chưa?|Cá voi chào bạn~|Bơi tiếp đây" data-burst="💧" data-angry="boing" data-angry-say="Tớ lặn xuống đây!">
        <svg viewBox="0 0 160 80">
          <g className="sk-spout"><path d="M30 14 Q26 -6 18 -14 M34 14 Q34 -10 34 -20 M38 14 Q44 -6 52 -12" stroke="#bfe6ff" strokeWidth="3" fill="none" strokeLinecap="round" /></g>
          <path d="M10 44 Q20 14 70 16 Q120 18 134 40 L152 28 Q150 44 156 56 L134 48 Q118 70 66 68 Q20 66 10 44 Z" fill="#2f6f9e" />
          <path d="M18 50 Q40 64 80 62 Q110 60 124 50" fill="#a8d6ef" opacity=".7" />
          <circle cx="34" cy="38" r="2.6" fill="#0b2233" />
          <path d="M26 48 Q32 52 38 48" stroke="#0b2233" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Projector() {
  return (
    <div className="sk-clap sk-hit" data-hit="clap" data-say="Action!|Cắt! Diễn lại nào|Cảnh 1, lần 1… Học!" data-angry="crackle" data-angry-say="Đạo diễn mệt rồi!" data-burst="🍿">
      <svg viewBox="0 0 80 64">
        <g className="sk-clap-top"><rect x="4" y="4" width="72" height="12" rx="2" fill="#f4f1e8" /><path d="M10 4 L20 16 M28 4 L38 16 M46 4 L56 16 M64 4 L74 16" stroke="#15161a" strokeWidth="6" /></g>
        <rect x="4" y="18" width="72" height="42" rx="3" fill="#15161a" />
        <text x="12" y="38" fontSize="10" fill="#f4f1e8" fontFamily="monospace">TAKE 1</text>
        <text x="12" y="52" fontSize="8" fill="#c9c4b4" fontFamily="monospace">VOCAB</text>
      </svg>
    </div>
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
    <div className="sk-magnifier sk-hit" data-hit="type" data-say="Hừm… manh mối: bạn chưa ôn bài!|Thủ phạm là… từ bất quy tắc!|Vụ án đã được phá!" data-angry="boo" data-angry-say="Đừng làm phiền thám tử!">
      <svg viewBox="0 0 60 60"><circle cx="24" cy="24" r="15" fill="rgba(255,255,255,.08)" stroke="currentColor" strokeWidth="4" /><path d="M35 35 L54 54" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg>
    </div>
  );
}

function Pixel() {
  return (
    <>
      <div className="sk-block sk-hit" data-hit="coin" data-say="+1 xu|+1 xu|+1 xu|+10 điểm chăm chỉ!" data-burst="◆" data-angry="beep" data-angry-say="Hết xu rồi, quay lại sau!"><span>?</span></div>
      <div className="sk-coin" />
    </>
  );
}

function Shuriken() {
  return (
    <>
      <div className="sk-target sk-hit" data-hit="whoosh" data-say="Trúng hồng tâm!|Xoẹt! Nhanh như ninja|Phi tiêu từ vựng!" data-angry="gong" data-angry-say="Hết phi tiêu rồi!">
        <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#f4ead2" stroke="#7a4b22" strokeWidth="3" /><circle cx="30" cy="30" r="18" fill="none" stroke="#c0392b" strokeWidth="5" /><circle cx="30" cy="30" r="7" fill="#c0392b" /></svg>
      </div>
      <div className="sk-shuriken">
        <svg viewBox="0 0 40 40"><path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill="#c7ccd6" stroke="#4a5160" strokeWidth="1.5" /><circle cx="20" cy="20" r="3.5" fill="#4a5160" /></svg>
      </div>
    </>
  );
}

function Rocket() {
  return (
    <div className="sk-rocket sk-hit" data-hit="launch" data-say="3… 2… 1… Phóng!|Hẹn gặp trên sao Hỏa!|Houston, tớ học xong rồi!" data-dur="2600" data-angry="beep" data-angry-say="Hết nhiên liệu rồi!">
      <svg viewBox="0 0 40 90"><path d="M20 2 Q34 20 32 56 L8 56 Q6 20 20 2 Z" fill="#eef1f8" stroke="#30405a" strokeWidth="1.5" /><circle cx="20" cy="28" r="6" fill="#4fa3ff" stroke="#30405a" strokeWidth="2" /><path d="M8 44 L0 62 L8 58 Z M32 44 L40 62 L32 58 Z" fill="#e0464a" /><path className="sk-flame" d="M12 58 Q20 90 28 58 Z" fill="#ffb340" /></svg>
    </div>
  );
}

function Blossom({ kind = 'mai', bird = false }) {
  const color = kind === 'dao' || kind === 'sakura' ? (kind === 'sakura' ? '#ffc3d6' : '#f28bb0') : '#f7c531';
  const center = kind === 'mai' ? '#d1392b' : '#c2185b';
  const flowers = [[60, 30], [110, 52], [150, 24], [190, 70], [92, 92], [36, 70]];
  return (
    <div className={`sk-branch sk-branch-${kind}`}>
      <svg viewBox="0 0 240 140">
        <path d="M0 10 Q80 30 120 60 T236 110 M70 30 Q90 70 84 110 M150 74 Q170 40 196 30" stroke="#5b3a24" strokeWidth="5" fill="none" strokeLinecap="round" />
        {flowers.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-7" rx="5" ry="7" fill={color} transform={`rotate(${a})`} />)}
            <circle r="3" fill={center} />
          </g>
        ))}
      </svg>
      {bird && (
        <div className="sk-bird-perch sk-hit" data-hit="chirp" data-say="Chíp chíp!|Hoa nở rồi kìa|Hát cho bạn nghe nè~" data-burst="♪♫" data-angry="whoosh" data-angry-say="Bay đi chỗ khác đây!">
          <svg viewBox="0 0 40 30"><ellipse cx="18" cy="18" rx="12" ry="9" fill="#6aa7c9" /><circle cx="28" cy="12" r="7" fill="#6aa7c9" /><circle cx="30" cy="11" r="1.5" fill="#111" /><path d="M35 12 L40 13 L35 15 Z" fill="#f2a422" /><path d="M8 16 Q2 10 6 22 Z" fill="#4f86a8" /><ellipse cx="18" cy="22" rx="7" ry="4" fill="#f7d9a8" /></svg>
        </div>
      )}
    </div>
  );
}

function Envelope() {
  return (
    <div className="sk-envelope sk-hit" data-hit="crackle" data-say="Lì xì: chăm học 10 từ mỗi ngày!|Lì xì: may mắn cả năm!|Lì xì: điểm cao như ý!|Lì xì: chuỗi học không gãy!" data-burst="✦🧧" data-angry="giggle" data-angry-say="Hết lì xì rồi, mai quay lại nhé!" data-dur="1800">
      <svg viewBox="0 0 50 70"><rect x="2" y="2" width="46" height="66" rx="4" fill="#d32f2f" /><path className="sk-envelope-flap" d="M2 2 L25 22 L48 2 Z" fill="#b71c1c" /><path d="M2 20 L25 34 L48 20" stroke="#ffca28" strokeWidth="2.5" fill="none" /><circle cx="25" cy="34" r="7" fill="#ffca28" /><text x="25" y="38" fontSize="9" textAnchor="middle" fill="#b71c1c" fontWeight="700">福</text></svg>
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

function Bouquet({ text = 'Tri ân thầy cô', lines = 'Cảm ơn thầy cô!|Một bó hoa tặng người lái đò|Thơm quá!' }) {
  return (
    <div className="sk-bouquet sk-hit" data-hit="chime" data-say={lines} data-burst="❀✿" data-angry="giggle" data-angry-say="Hoa rụng hết bây giờ!">
      <svg viewBox="0 0 110 130">
        <path d="M55 128 L30 70 M55 128 L55 62 M55 128 L82 70" stroke="#2e7d32" strokeWidth="3" />
        {[[30, 60, '#e53950'], [55, 50, '#f48fb1'], [82, 60, '#ffb300'], [42, 38, '#ab47bc'], [70, 36, '#ef5350']].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx="0" cy="-8" rx="5.5" ry="8" fill={c} transform={`rotate(${a})`} />)}<circle r="4" fill="#fff59d" /></g>
        ))}
        <path d="M30 96 L80 96 L66 126 L44 126 Z" fill="#f6efe0" stroke="#c8b99a" />
        <path d="M44 106 Q55 114 66 106" stroke="#e53950" strokeWidth="3" fill="none" />
      </svg>
      <span className="sk-thanks">{text}</span>
    </div>
  );
}

function Pumpkins() {
  return (
    <div className="sk-pumpkins">
      {[0, 1, 2].map(i => (
        <div key={i} className="sk-pumpkin sk-hit" style={{ '--i': i }} data-hit="boo" data-say="Boo!|Ú òa!|Cho kẹo hay bị ghẹo?" data-burst="👻" data-angry="giggle" data-angry-say="Hết kẹo rồi, về đi!">
          <span className="sk-ghost">
            <svg viewBox="0 0 40 48"><path d="M4 22 Q4 2 20 2 Q36 2 36 22 L36 46 L30 40 L24 46 L18 40 L12 46 L4 40 Z" fill="#f4f1fb" /><circle cx="14" cy="20" r="3" fill="#2c1f45" /><circle cx="26" cy="20" r="3" fill="#2c1f45" /><ellipse cx="20" cy="30" rx="4" ry="5" fill="#2c1f45" /></svg>
          </span>
          <svg viewBox="0 0 70 60">
            <path d="M35 10 Q38 2 44 4" stroke="#3e6b2a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="22" cy="36" rx="16" ry="20" fill="#e86f1c" /><ellipse cx="48" cy="36" rx="16" ry="20" fill="#e86f1c" /><ellipse cx="35" cy="36" rx="15" ry="22" fill="#f38a2a" />
            <path className="sk-pumpkin-face" d="M24 30 L30 26 L30 34 Z M46 30 L40 26 L40 34 Z M24 42 Q35 52 46 42 L42 44 L38 41 L35 45 L32 41 L28 44 Z" fill="#ffe066" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function Lights() {
  return (
    <>
      <div className="sk-lights">
        {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
      </div>
      <div className="sk-gift sk-hit" data-hit="jingle" data-say="Quà: 1 ngày học không mỏi!|Quà: trí nhớ siêu cấp!|Quà: thêm 1 ngôi sao chăm chỉ!|Ho ho ho!" data-burst="❄✦" data-angry="giggle" data-angry-say="Ông già Noel hết quà rồi!" data-dur="1800">
        <svg viewBox="0 0 60 60"><g className="sk-gift-lid"><rect x="4" y="14" width="52" height="12" rx="2" fill="#e53935" /><path d="M30 14 Q20 2 14 8 Q12 14 30 14 Q48 14 46 8 Q40 2 30 14 Z" fill="#ffca28" /></g><rect x="8" y="26" width="44" height="30" rx="2" fill="#c62828" /><rect x="26" y="14" width="8" height="42" fill="#ffca28" /></svg>
      </div>
    </>
  );
}

function Hearts() {
  return (
    <div className="sk-heart-big sk-hit" data-hit="kiss" data-say="Chụt!|Thương bạn nhiều~|Học chăm là đáng yêu nhất" data-burst="♥♡" data-angry="giggle" data-angry-say="Ngại quá à!">
      <svg viewBox="0 0 60 54"><path d="M30 52 C10 36 2 26 2 15 C2 7 8 2 16 2 C22 2 27 6 30 11 C33 6 38 2 44 2 C52 2 58 7 58 15 C58 26 50 36 30 52 Z" fill="#e94b75" /></svg>
    </div>
  );
}

function Chalk() {
  return (
    <>
      <div className="sk-chalk-doodles"><span>a + b = ?</span><span>ABC</span><span>✓ Học mỗi ngày</span></div>
      <div className="sk-tray"><i /><i /><i /></div>
    </>
  );
}

function ChalkPlay() {
  return (
    <>
      <svg className="sk-check" viewBox="0 0 80 60"><path d="M8 32 L30 52 L72 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div className="sk-chalk-stick sk-hit" data-hit="chalk" data-say="Ké…ét! (xin lỗi tai bạn)|Cô giáo vẽ hoa 10 điểm|Viết: I love English" data-burst="✎★" data-angry="chalk" data-angry-say="Phấn gãy mất rồi!" />
    </>
  );
}

function Critter({ kind }) {
  const items = {
    soc: { hit: 'crunch', say: 'Rộp rộp… hạt dẻ ngon!|Cất hạt cho mùa đông|Bạn ăn không?', angry: 'eek', angrySay: 'Đừng lấy hạt của tớ!', burst: '🌰', svg: <svg viewBox="0 0 60 50"><path className="sk-soc-tail" d="M44 42 Q62 30 54 10 Q46 0 40 10 Q50 20 40 34 Z" fill="#b5651d" /><ellipse cx="28" cy="34" rx="14" ry="12" fill="#c8762b" /><circle cx="16" cy="22" r="9" fill="#c8762b" /><path d="M12 14 L14 6 L18 14 Z" fill="#c8762b" /><circle cx="13" cy="21" r="1.6" fill="#111" /><ellipse cx="22" cy="34" rx="5" ry="6" fill="#8a4a16" /><circle cx="22" cy="31" r="3" fill="#6b3a10" /></svg> },
    cua: { hit: 'snap', say: 'Kẹp kẹp!|Đi ngang cho nhanh|Biển chiều đẹp ghê', angry: 'snap', angrySay: 'Kẹp cho một cái giờ!', burst: '🫧', svg: <svg viewBox="0 0 70 44"><ellipse cx="35" cy="28" rx="20" ry="12" fill="#e2553a" /><path className="sk-claw-l" d="M16 22 Q2 18 4 6 Q10 12 14 8 Q12 16 18 20" fill="#e2553a" /><path className="sk-claw-r" d="M54 22 Q68 18 66 6 Q60 12 56 8 Q58 16 52 20" fill="#e2553a" /><path d="M18 34 L8 42 M24 38 L18 44 M52 34 L62 42 M46 38 L52 44" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" /><circle cx="29" cy="16" r="4" fill="#fff" /><circle cx="41" cy="16" r="4" fill="#fff" /><circle cx="29" cy="16" r="2" fill="#111" /><circle cx="41" cy="16" r="2" fill="#111" /></svg> },
    co: { hit: 'whoosh', say: 'Cò bay lả bay la~|Đồng lúa chín vàng rồi|Tìm cá đây', angry: 'honk', angrySay: 'Cò đi mách mẹ đây!', burst: '✦', svg: <svg viewBox="0 0 50 70"><path className="sk-co-wing" d="M18 30 Q2 22 6 38 Q14 40 22 36 Z" fill="#e9eef2" /><ellipse cx="22" cy="34" rx="13" ry="9" fill="#fff" /><path d="M30 30 Q36 14 32 6" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="32" cy="6" r="5" fill="#fff" /><path d="M36 6 L50 9 L36 9 Z" fill="#f2a422" /><circle cx="33" cy="5" r="1.2" fill="#111" /><path d="M20 42 L18 68 M26 42 L28 68" stroke="#f2a422" strokeWidth="2" /></svg> },
    la: { hit: 'rustle', say: 'Xào xạc!|Nhảy vào đống lá nào|Mùa thu đến rồi', angry: 'rustle', angrySay: 'Lá bay tung tóe rồi!', burst: '🍂🍁', svg: <svg viewBox="0 0 90 40"><ellipse cx="45" cy="32" rx="44" ry="10" fill="#c8641e" />{[[14, 26, '#e07b24'], [30, 20, '#d1402b'], [48, 18, '#f2a23a'], [64, 22, '#b5651d'], [76, 28, '#e07b24'], [40, 28, '#f2c14a']].map(([x, y, c], i) => <ellipse key={i} cx={x} cy={y} rx="10" ry="6" fill={c} transform={`rotate(${i * 25 - 40} ${x} ${y})`} />)}</svg> },
  }[kind];
  return (
    <div className={`sk-critter sk-critter-${kind} sk-hit`} data-hit={items.hit} data-say={items.say} data-burst={items.burst} data-angry={items.angry} data-angry-say={items.angrySay}>
      {items.svg}
    </div>
  );
}

function Corgi() {
  return (
    <div className="sk-corgi">
      <div className="sk-hit sk-corgi-hit" data-hit="bark" data-hover="sniff" data-say="Gâu gâu!|Ném bóng đi mà~|Bạn học giỏi quá, gâu!" data-burst="♥🦴" data-angry="giggle" data-angry-say="Xoa bụng tớ đi!" data-alt="1" data-alt-sound="sniff" data-alt-say="Hít hít… mùi bánh quy!" data-dur="1800">
        <svg viewBox="0 0 90 60">
          <path className="sk-corgi-tail" d="M74 30 Q88 22 84 34" stroke="#e8913a" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="34" rx="28" ry="14" fill="#e8913a" />
          <ellipse cx="44" cy="40" rx="18" ry="8" fill="#fff4e6" />
          <path d="M28 46 L28 56 M38 46 L38 56 M62 46 L62 56 M70 44 L70 54" stroke="#e8913a" strokeWidth="6" strokeLinecap="round" />
          <circle cx="22" cy="24" r="13" fill="#e8913a" />
          <path d="M12 16 L10 2 L20 12 Z M26 12 L32 0 L34 14 Z" fill="#e8913a" />
          <ellipse cx="14" cy="30" rx="8" ry="6" fill="#fff4e6" />
          <circle cx="8" cy="28" r="2.4" fill="#111" />
          <circle cx="20" cy="21" r="2" fill="#111" />
          <path className="sk-corgi-tongue" d="M10 34 Q12 40 16 34" fill="#ff7a8a" />
        </svg>
      </div>
      <span className="sk-ball" />
    </div>
  );
}

function Panda() {
  return (
    <div className="sk-panda sk-hit" data-hit="giggle" data-hover="crunch" data-say="Măm măm tre non|Lăn một vòng nè!|Ngủ trưa xíu đã…" data-burst="🎋" data-angry="boing" data-angry-say="Gấu trúc dỗi, không chơi nữa!" data-dur="1600">
      <svg viewBox="0 0 80 80">
        <path className="sk-bamboo-snack" d="M64 20 L54 60" stroke="#6bbf3a" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="40" cy="56" rx="24" ry="20" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
        <ellipse cx="22" cy="64" rx="8" ry="10" fill="#2b2b2b" /><ellipse cx="58" cy="64" rx="8" ry="10" fill="#2b2b2b" />
        <circle cx="40" cy="30" r="20" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
        <circle cx="24" cy="14" r="7" fill="#2b2b2b" /><circle cx="56" cy="14" r="7" fill="#2b2b2b" />
        <ellipse cx="32" cy="30" rx="6" ry="7" fill="#2b2b2b" transform="rotate(-20 32 30)" /><ellipse cx="48" cy="30" rx="6" ry="7" fill="#2b2b2b" transform="rotate(20 48 30)" />
        <circle cx="33" cy="30" r="2" fill="#fff" /><circle cx="47" cy="30" r="2" fill="#fff" />
        <ellipse cx="40" cy="38" rx="3" ry="2" fill="#2b2b2b" />
        <ellipse className="sk-panda-blush" cx="28" cy="40" rx="4" ry="2" fill="#ff9fb0" /><ellipse className="sk-panda-blush" cx="52" cy="40" rx="4" ry="2" fill="#ff9fb0" />
      </svg>
    </div>
  );
}

function Dino() {
  return (
    <div className="sk-dino">
      <div className="sk-hit sk-dino-hit" data-hit="roar" data-say="RAWRRR! (thật ra tớ hiền lắm)|Tay ngắn nhưng học giỏi!|Khủng long cũng phải học từ vựng" data-burst="💥" data-angry="stomp" data-angry-say="Dậm chân cho đất rung nè!" data-alt="1" data-alt-sound="giggle" data-alt-say="Tớ không với tới bàn phím…" data-dur="1500">
        <svg viewBox="0 0 90 70">
          <path d="M70 40 Q90 44 88 60 Q80 50 66 50 Z" fill="#5fae5a" />
          <ellipse cx="50" cy="44" rx="24" ry="16" fill="#6bbf3a" />
          <path d="M36 30 L40 20 L44 30 M46 28 L50 18 L54 28 M56 30 L60 22 L64 32" fill="#f2a422" />
          <path d="M30 40 Q22 20 30 10 Q44 4 50 14 Q52 24 40 26 L34 36 Z" fill="#6bbf3a" />
          <circle cx="40" cy="14" r="3" fill="#fff" /><circle cx="41" cy="14" r="1.5" fill="#111" />
          <path className="sk-dino-mouth" d="M46 20 Q50 22 48 26" stroke="#2f5d1e" strokeWidth="2" fill="none" />
          <path d="M34 42 L30 46 M38 44 L34 48" stroke="#2f5d1e" strokeWidth="3" strokeLinecap="round" />
          <path className="sk-dino-leg-a" d="M42 56 L40 68" stroke="#4f9e2a" strokeWidth="7" strokeLinecap="round" />
          <path className="sk-dino-leg-b" d="M58 56 L60 68" stroke="#4f9e2a" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Robot() {
  return (
    <div className="sk-robot sk-hit" data-hit="beep" data-say="Bíp bốp! Đã lưu 1 từ mới|Đang tải kiến thức… 99%|Xin chào, con người chăm học!" data-burst="⚡✦" data-angry="crackle" data-angry-say="LỖI 404: kiên nhẫn không tìm thấy!" data-alt="1" data-alt-sound="giggle" data-alt-say="Robot nhảy nè: bíp-bíp-bóp!" data-dur="1600">
      <svg viewBox="0 0 60 90">
        <path d="M30 4 L30 14" stroke="#6b7a90" strokeWidth="3" /><circle className="sk-robot-led" cx="30" cy="4" r="4" fill="#ff5a5a" />
        <rect x="10" y="14" width="40" height="28" rx="8" fill="#c9d3e2" stroke="#6b7a90" strokeWidth="2" />
        <rect className="sk-robot-eyes" x="16" y="22" width="28" height="10" rx="5" fill="#16202e" />
        <circle cx="23" cy="27" r="3" fill="#4fd1ff" /><circle cx="37" cy="27" r="3" fill="#4fd1ff" />
        <rect x="14" y="46" width="32" height="26" rx="6" fill="#aebdd2" stroke="#6b7a90" strokeWidth="2" />
        <rect x="22" y="52" width="16" height="8" rx="2" fill="#ffcd3c" />
        <path className="sk-robot-arm-l" d="M14 52 L4 62" stroke="#6b7a90" strokeWidth="4" strokeLinecap="round" />
        <path className="sk-robot-arm-r" d="M46 52 L56 62" stroke="#6b7a90" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 72 L22 86 M38 72 L38 86" stroke="#6b7a90" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Balloons() {
  const colors = ['#ff5a7a', '#ffcd3c', '#4fb3ff', '#6bd58a', '#b77dff'];
  return (
    <div className="sk-balloons">
      {colors.map((c, i) => (
        <div key={c} className="sk-balloon sk-hit" style={{ '--i': i, '--c': c }} data-hit="pop" data-say="Bụp!|Pằng!|Vui quá đi!" data-burst="✦●" data-dur="3200" data-angry="giggle" data-angry-say="Nổ hết bóng rồi kìa!">
          <svg viewBox="0 0 40 70"><ellipse cx="20" cy="20" rx="16" ry="19" fill="var(--c)" /><ellipse cx="14" cy="12" rx="4" ry="6" fill="#fff" opacity=".45" /><path d="M18 38 L22 38 L20 42 Z" fill="var(--c)" /><path d="M20 42 Q16 52 22 60 Q26 66 20 70" stroke="#8a8a8a" strokeWidth="1" fill="none" /></svg>
        </div>
      ))}
    </div>
  );
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

const ACTORS = {
  'bang-xanh': W(Chalk, ChalkPlay),
  'rung-thong': W(() => <Landscape kind="thong" />, () => <Critter kind="soc" />),
  'bien-chieu': W(() => <Landscape kind="bien" />, () => <Critter kind="cua" />),
  'ruong-bac-thang': W(() => <Landscape kind="ruong" />, () => <Critter kind="co" />),
  'pho-hoi': W(null, () => <Lanterns />),
  'meo-luoi': W(null, Cat),
  'canh-cut': W(() => <Landscape kind="bang" />, Penguin),
  'nhen-du-to': W(null, Spider),
  'rong': W(null, Dragon),
  'dai-duong': W(null, Whale),
  'rap-chieu': W(() => <><div className="sk-beam" /><div className="sk-film sk-film-l" /><div className="sk-film sk-film-r" /></>, Projector),
  'tham-tu': W(() => <><div className="sk-blinds" /><Lamp /></>, Magnifier),
  'pixel': W(() => <div className="sk-ground" />, Pixel),
  'muc-ninja': W(() => <><div className="sk-bamboo sk-bamboo-l" /><div className="sk-bamboo sk-bamboo-r" /></>, Shuriken),
  'muc-phi-hanh-gia': W(() => <div className="sk-planet" />, Rocket),
  'tet': W(null, () => <><Blossom kind="mai" /><Blossom kind="dao" /><Envelope /></>),
  'valentine': W(null, Hearts),
  'trung-thu': W(Moon, () => <Lanterns star />),
  'nha-giao': W(null, () => <Bouquet />),
  'halloween': W(null, () => <><Pumpkins /><Spider /></>),
  'noel': W(() => <Landscape kind="tuyet" />, Lights),
  'mua-thu': W(() => <Landscape kind="thu" />, () => <Critter kind="la" />),
  'hoa-anh-dao': W(() => <Landscape kind="nui" />, () => <Blossom kind="sakura" bird />),
  'cho-corgi': W(() => <Landscape kind="co" />, Corgi),
  'gau-truc': W(() => <div className="sk-bamboo sk-bamboo-r" />, Panda),
  'khung-long': W(() => <Landscape kind="nui" />, Dino),
  'robot': W(() => <div className="sk-grid" />, Robot),
  'thieu-nhi': W(null, Balloons),
  'phu-nu': W(null, () => <Bouquet text="Chúc mừng phái đẹp" lines="Tặng bạn bó hoa xinh!|Luôn rạng rỡ nhé!|Hôm nay bạn thật tuyệt" />),
};

export function SkinBackdrop({ slug }) {
  const Back = ACTORS[slug]?.back;
  return Back ? <div className="skin-backdrop"><Back /></div> : null;
}

export function SkinActors({ slug }) {
  const ref = useRef(null);
  useSkinPlay(ref, slug);
  const Front = ACTORS[slug]?.front;
  return <div ref={ref} className="skin-actors">{Front && <Front />}</div>;
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
      <svg className="costume-robot" viewBox="0 0 100 50"><path d="M50 6 L50 22" stroke="#6b7a90" strokeWidth="4" /><circle cx="50" cy="6" r="6" fill="#ff5a5a" /><rect x="14" y="22" width="72" height="12" rx="6" fill="#aebdd2" stroke="#6b7a90" strokeWidth="2" /></svg>
      <svg className="costume-party" viewBox="0 0 60 60"><path d="M30 2 L46 52 L14 52 Z" fill="#ff5a7a" /><path d="M22 28 L38 28 M18 40 L42 40" stroke="#ffcd3c" strokeWidth="4" /><circle cx="30" cy="4" r="5" fill="#4fb3ff" /></svg>
    </span>
  );
}
