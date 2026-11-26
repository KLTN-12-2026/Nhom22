'use client';
import { useId, useRef } from 'react';
import { useSkinPlay } from './useSkinPlay';
import { useDolphinSwim } from './useDolphinSwim';
import { useDragonVisit } from './useDragonVisit';

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
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <path d="M13 56Q36 51 60 53Q84 51 107 56Q113 61 106 64Q86 69 60 67Q34 69 14 64Q7 61 13 56Z" fill="#CE947A" stroke="#98614C" strokeWidth="1.5" />
        <path d="M14 60Q35 64 60 63Q85 64 106 60" fill="none" stroke="#F0BA9B" strokeWidth="1.5" strokeLinecap="round" />
        <g className="sk-cat-body">
          <g className="sk-cat-belly">
            <path d="M37 48Q42 28 69 28Q99 28 103 47Q108 62 81 63H42Q31 61 37 48Z" fill="#ECA453" stroke="#844B35" strokeWidth="2" />
            <path d="M49 49Q59 54 80 54Q93 54 100 50Q102 60 81 61H45Z" fill="#F6C486" />
            <path d="M63 30Q66 34 65 39Q61 38 58 31ZM78 30Q81 35 79 41Q75 39 73 29ZM92 35Q94 39 91 44Q87 42 87 32Z" fill="#BF6B3F" />
          </g>
          <path d="M28 53Q34 49 45 51Q52 49 58 52Q63 57 57 61H29Q21 61 24 56Z" fill="#FFE5BF" stroke="#A36746" strokeWidth="1.5" />
          <path d="M34 57V60M52 57V60" stroke="#CF9875" strokeWidth="1.3" strokeLinecap="round" />
          <g className="sk-cat-tail" fill="none" strokeLinecap="round">
            <path d="M94 42C104 46 101 56 92 59Q80 64 66 57" stroke="#844B35" strokeWidth="11" />
            <path d="M94 42C104 46 101 56 92 59Q80 64 66 57" stroke="#E59A4C" strokeWidth="8" />
            <path d="M70 58L66 57" stroke="#FFE5BF" strokeWidth="7.5" />
            <path d="M94 54L98 55M84 57L84 61" stroke="#BF6B3F" strokeWidth="2.5" />
          </g>
          <g className="sk-cat-head">
            <g className="sk-cat-ears">
              <path d="M16 40L13 23Q13 21 16 22L29 31L35 31L46 21Q48 20 48 23L47 40Z" fill="#ECA453" stroke="#844B35" strokeWidth="2" strokeLinejoin="round" />
              <path d="M17 27L24 32L18 36ZM44 26L44 36L38 32Z" fill="#E9867D" />
            </g>
            <path d="M31 30Q48 30 51 43Q54 57 31 58Q9 59 11 46Q12 31 31 30Z" fill="#ECA453" stroke="#844B35" strokeWidth="2" />
            <path d="M13 48Q18 43 24 47Q31 51 37 47Q45 43 49 48Q48 56 31 56Q16 57 13 48Z" fill="#FFE5BF" />
            <path d="M23 32Q23 37 26 38L28 31ZM33 31Q32 36 35 37L38 32Z" fill="#BF6B3F" />
            <path className="sk-cat-sleep" d="M18 42Q22 46 26 42M35 42Q39 46 43 42" stroke="#56352B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path className="sk-cat-happy" d="M18 43Q22 38 26 43M35 43Q39 38 43 43" stroke="#56352B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <g className="sk-cat-wide" stroke="#56352B" strokeWidth=".8">
              <circle cx="22" cy="42" r="3.5" fill="#FFE27A" />
              <circle cx="39" cy="42" r="3.5" fill="#FFE27A" />
              <ellipse cx="22" cy="42" rx="1" ry="2.6" fill="#56352B" stroke="none" />
              <ellipse cx="39" cy="42" rx="1" ry="2.6" fill="#56352B" stroke="none" />
            </g>
            <path d="M28 47Q31 45 34 47L31 50Z" fill="#BB655F" />
            <path d="M27 51Q29 53 31 50Q33 53 35 51M15 47L9 45M15 50H9M47 47L53 45M47 50H53" stroke="#844B35" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <g className="sk-cat-blush" fill="#EF8A85">
              <ellipse cx="20" cy="49" rx="3" ry="1.7" />
              <ellipse cx="42" cy="49" rx="3" ry="1.7" />
            </g>
          </g>
        </g>
        <text className="sk-cat-z" x="55" y="23" fontSize="12" fontWeight="700" fill="currentColor">z</text>
        <text className="sk-cat-z sk-cat-z2" x="65" y="14" fontSize="9" fontWeight="700" fill="currentColor">z</text>
      </svg>
    </div>
  );
}

function Penguin() {
  return (
    <div className="sk-penguin-route">
      <div className="sk-penguin-glider">
        <button type="button" className="sk-penguin sk-hit" aria-label="Chơi với chim cánh cụt trượt băng"
          data-hit="slip" data-say="Ối trơn quá!|Té cái bịch…|Không sao, đứng dậy học tiếp!" data-angry="honk" data-angry-say="Quác! Đừng đẩy tớ nữa!" data-alt="1" data-alt-sound="honk" data-alt-say="Quác quác!" data-dur="1600">
          <svg viewBox="0 0 100 84" aria-hidden="true">
            <ellipse cx="53" cy="79" rx="34" ry="3.5" fill="#5D9BBB" opacity=".42" />
            <path className="sk-penguin-ice" d="M6 71H19M2 77H12M12 65L17 67" fill="none" stroke="#75B7D8" strokeWidth="2" strokeLinecap="round" />
            <g className="sk-penguin-balance">
              <path d="M32 66L29 72H46Q51 72 54 67M55 72L52 78H72Q79 77 81 72" fill="none" stroke="#58829A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M34 72H46M56 78H71" fill="none" stroke="#DCF2FC" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M38 58Q51 58 51 65Q50 69 29 67Q27 61 38 58Z" fill="#D99537" stroke="#864E29" strokeWidth="1.5" />
              <path d="M60 63Q74 62 77 69Q78 74 52 73Q49 69 60 63Z" fill="#FCB84E" stroke="#864E29" strokeWidth="1.5" />
              <path d="M53 30Q42 27 27 30Q23 24 17 27L19 38Q30 39 40 36Z" fill="#D74C62" stroke="#963849" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M66 11Q81 11 84 25Q86 37 77 43Q80 59 66 68Q57 75 42 68Q25 61 31 47Q34 38 42 33Q41 23 48 16Q55 10 66 11Z" fill="#283C52" stroke="#172938" strokeWidth="2" />
              <path d="M55 39Q64 39 70 31Q79 35 77 48Q74 68 57 68Q45 66 46 55Q47 44 55 39Z" fill="#FFF5DD" />
              <path d="M64 22Q76 17 81 27L80 35Q71 40 61 34Q57 27 64 22Z" fill="#FFF5DD" />
              <path d="M81 29L94 33L81 37Q77 34 81 29Z" fill="#FFB64C" stroke="#A26332" strokeWidth="1.5" strokeLinejoin="round" />
              <ellipse cx="74" cy="28" rx="2.5" ry="3.5" fill="#172938" />
              <circle cx="75" cy="27" r=".9" fill="#FFF5DD" />
              <path d="M71 38Q75 38 79 36L78 43Q63 50 47 41L42 36Q42 32 47 31Q58 41 71 38Z" fill="#EC6578" stroke="#963849" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M24 29L25 36M51 36L50 41" stroke="#FFACB5" strokeWidth="2" strokeLinecap="round" />
              <path d="M50 45Q43 45 36 51Q27 57 22 54Q22 61 30 62Q44 64 54 53" fill="#405A74" stroke="#172938" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </button>
      </div>
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
  const ref = useRef(null);
  const paintId = useId();
  const spine = 'M53 82C74 72 80 42 108 41C139 40 141 92 173 94C204 96 211 51 235 48C244 47 251 50 256 58';
  useDragonVisit(ref);
  return (
    <div ref={ref} hidden className="sk-dragon sk-hit" data-hit="roar" data-say="Grào! (nhỏ thôi kẻo hàng xóm nghe)|Ta là rồng học bá!|Phun lửa nè!" data-burst="🔥✦" data-angry="gong" data-angry-say="Rồng nổi giận rồi!" data-angry-burst="🔥">
      <div className="sk-dragon-facing">
        <svg viewBox="0 0 356 132" aria-hidden="true">
          <ellipse className="sk-dragon-perch-shadow" cx="163" cy="97" rx="71" ry="3.5" fill="#173B33" opacity="0" />
          <defs>
            <linearGradient id={`${paintId}-jade`} x2="0%" y2="100%">
              <stop stopColor="#70C0A1" />
              <stop offset=".55" stopColor="#2F876F" />
              <stop offset="1" stopColor="#1C5B4E" />
            </linearGradient>
            <linearGradient id={`${paintId}-gold`} x2="0%" y2="100%">
              <stop stopColor="#FFF1B8" />
              <stop offset="1" stopColor="#D49A46" />
            </linearGradient>
            <g id={`${paintId}-far-leg`}>
              <path d="M0 1Q1 11 -5 14Q-5 18 -9 20" stroke="#173C37" strokeWidth="7" />
              <path d="M0 1Q1 11 -5 14Q-5 18 -9 20" stroke="#286B5B" strokeWidth="4.5" />
              <path d="M-9 19L-13 20M-7 21L-10 23" stroke="#D1AC6E" strokeWidth="1.8" />
            </g>
            <g id={`${paintId}-near-leg`}>
              <path d="M0 0Q6 7 -1 11Q1 17 -6 18" stroke="#163E36" strokeWidth="8.5" />
              <path d="M0 0Q6 7 -1 11Q1 17 -6 18" stroke="#4C9D82" strokeWidth="5.6" />
              <path d="M-6 17L-10 19M-4 18L-7 21M-2 17L-4 20" stroke="#F2D899" strokeWidth="2" />
            </g>
          </defs>
          <g data-wave-joint="53 82">
            <path d="M60 72C46 78 40 91 26 91Q17 91 9 85Q14 99 28 101C45 103 57 91 64 84Z" fill={`url(#${paintId}-jade)`} stroke="#163E36" strokeWidth="2" strokeLinejoin="round" />
            <path d="M30 94C16 100 8 89 5 78Q15 84 20 81Q23 89 36 91Q29 93 27 96Z" fill={`url(#${paintId}-gold)`} stroke="#765837" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M16 87Q22 94 34 95Q43 94 53 86" fill="none" stroke="#E5C783" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g data-wave-joint="108 41" data-landing-leg="rear" data-landing-toe="98 64 93">
              <use href={`#${paintId}-far-leg`} x="108" y="41" />
            </g>
            <g data-wave-joint="235 48" data-landing-leg="front" data-landing-toe="225 71 93">
              <use href={`#${paintId}-far-leg`} x="235" y="48" />
            </g>
          </g>
          <path data-wave-path="" d="M65 68Q70 58 70 51Q76 52 78 46Q81 40 80 34Q86 36 89 33Q93 29 93 23Q99 29 103 28Q110 26 113 22Q116 29 121 30Q127 34 128 42M188 80Q194 70 193 64Q198 66 201 61Q206 53 204 47Q210 49 213 45Q217 40 217 34Q221 39 225 37Q231 35 236 29Q236 39 248 42" fill={`url(#${paintId}-gold)`} stroke="#765837" strokeWidth="1.5" strokeLinejoin="round" />
          <g fill="none" strokeLinecap="round">
            <path data-wave-path="spine" d={spine} stroke="#163E36" strokeWidth="23.5" />
            <path data-wave-path="spine" d={spine} stroke={`url(#${paintId}-jade)`} strokeWidth="20" />
            <path data-wave-path="spine" d="M59 85C77 78 86 47 109 47C135 46 142 97 172 100C205 103 215 56 236 54C244 53 250 55 254 62" stroke={`url(#${paintId}-gold)`} strokeWidth="5" />
            <path data-wave-path="" d="M63 68Q60 76 68 72M69 61Q66 69 74 65M75 54Q72 62 80 58M82 47Q78 54 86 51M90 41Q84 48 93 46M100 37Q93 42 101 43M110 36Q102 39 110 42M121 39Q112 38 118 44M129 44Q122 41 125 49M136 52Q129 47 132 56M142 60Q135 55 137 63M147 68Q140 63 142 71M152 75Q145 70 147 79M157 81Q149 78 153 85M164 86Q155 85 161 91M171 89Q163 90 170 95M178 89Q171 93 179 95M185 87Q180 93 188 92M192 82Q188 89 196 86M198 76Q195 84 203 80M204 69Q201 77 208 72M209 61Q207 69 214 65M216 53Q213 61 220 57M224 47Q219 54 227 52M234 43Q227 48 235 49" stroke="#D5C689" strokeWidth="1.4" opacity=".84" />
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g data-wave-joint="127 54" data-landing-leg="rear" data-landing-toe="120 75 96">
              <use href={`#${paintId}-near-leg`} x="127" y="54" />
            </g>
            <g data-wave-joint="204 75" data-landing-leg="front" data-landing-toe="197 96 96">
              <use href={`#${paintId}-near-leg`} x="204" y="75" />
            </g>
          </g>
          <g data-wave-joint="256 58">
            <path d="M267 36C252 23 244 31 227 25Q229 35 241 39Q224 38 216 34Q220 50 237 52Q227 57 217 55Q228 69 247 64Q242 72 234 78Q252 81 264 68Q275 56 267 36Z" fill="#1D5F52" stroke="#163E36" strokeWidth="2" strokeLinejoin="round" />
            <path d="M247 43Q234 45 223 41M248 50Q237 58 227 57M251 62Q248 70 240 76" fill="none" stroke="#6DB89D" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M253 40Q248 27 240 20Q237 14 238 8M243 24Q235 23 230 17M263 36Q259 26 262 17Q263 12 269 9M262 20Q270 20 274 15" fill="none" stroke="#785D3E" strokeWidth="6.2" strokeLinecap="round" />
            <path d="M253 40Q248 27 240 20Q237 14 238 8M243 24Q235 23 230 17M263 36Q259 26 262 17Q263 12 269 9M262 20Q270 20 274 15" fill="none" stroke="#F6D899" strokeWidth="3.9" strokeLinecap="round" />
            <path d="M252 45Q240 40 240 32Q250 32 257 39" fill={`url(#${paintId}-jade)`} stroke="#163E36" strokeWidth="2" strokeLinejoin="round" />
            <path d="M246 51Q247 40 260 35Q274 31 282 43Q287 48 297 47Q305 45 308 51Q309 59 298 60L283 60Q287 65 299 63Q299 71 287 73Q273 77 260 71Q248 65 246 51Z" fill={`url(#${paintId}-jade)`} stroke="#163E36" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M252 55Q260 63 277 63Q282 67 295 66Q289 73 275 73Q259 73 252 63Z" fill={`url(#${paintId}-gold)`} />
            <path d="M279 57Q289 59 303 56L298 60L283 60Q286 64 298 64Q291 69 282 65Z" fill="#422B31" />
            <path d="M287 60L290 60L288 63Z" fill="#FFF1CE" />
            <path d="M259 47Q265 41 275 44Q272 51 266 52Q262 52 259 47Z" fill="#FFF1BC" stroke="#183C37" strokeWidth="1.2" />
            <ellipse cx="270" cy="47" rx="1.7" ry="3" fill="#193A38" />
            <circle cx="271" cy="46" r=".6" fill="#FFF9DD" />
            <path d="M258 43Q264 38 272 40M287 51Q293 48 299 50" fill="none" stroke="#C8E2B5" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="300" cy="52" rx="2.2" ry="1.3" fill="#1D443B" />
            <path d="M293 56C312 55 315 34 331 32M292 57C310 61 320 44 337 46" fill="none" stroke="#705637" strokeWidth="2.7" strokeLinecap="round" />
            <path d="M293 56C312 55 315 34 331 32M292 57C310 61 320 44 337 46" fill="none" stroke="#F8DEA1" strokeWidth="1.45" strokeLinecap="round" />
            <path d="M261 68Q260 79 248 85Q252 77 246 70Q253 72 251 65Z" fill="#E4BB70" stroke="#765837" strokeWidth="1.5" strokeLinejoin="round" />
            <g className="sk-dragon-fire">
              <path d="M298 61C312 51 320 57 327 54Q337 49 349 54Q337 58 334 63Q340 66 348 64Q343 75 326 73Q311 76 298 64Z" fill="#EC782E" />
              <path d="M300 62Q312 57 321 61Q333 56 340 57Q330 61 330 65Q335 69 340 68Q321 74 300 64Z" fill="#FFC34D" />
              <path d="M300 63Q317 60 325 64Q315 68 300 64Z" fill="#FFF2AD" />
              <path d="M331 50L335 47M341 75L349 73" stroke="#F8AD48" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Dolphin() {
  const ref = useRef(null);
  useDolphinSwim(ref);
  return (
    <div ref={ref} className="sk-dolphin">
      <div className="sk-dolphin-facing">
        <div className="sk-hit sk-dolphin-hit" data-hit="splash" data-say="Cá heo chào bạn~|Cùng bơi khám phá đại dương nhé!|Bơi tiếp đây" data-burst="💧" data-angry="boing" data-angry-say="Tớ lặn xuống đây!">
          <svg viewBox="0 0 180 100" role="img" aria-label="Cá heo xanh đang bơi">
            <g className="sk-dolphin-bubbles" fill="none" stroke="#bfe6ff" strokeWidth="1.5">
              <circle cx="15" cy="30" r="3.5" /><circle cx="25" cy="18" r="2.5" /><circle cx="33" cy="8" r="1.8" />
            </g>
            <path d="M78 31 Q90 9 108 10 Q96 22 104 38Z" fill="#417b9c" />
            <path d="M137 55 Q151 44 173 43 Q168 56 155 61 Q167 69 171 82 Q151 79 139 65Z" fill="#4386a6" />
            <path d="M12 49 L30 44 C32 29 48 22 68 26 C98 29 119 44 144 55 L153 59 L149 65 C131 65 116 63 102 62 C79 71 49 68 34 57 L14 57 Q5 55 12 49Z" fill="#5f9eba" />
            <path d="M14 54 L33 51 Q55 65 83 61 Q112 57 145 63 Q122 67 102 64 Q75 73 48 64 Q39 61 33 57 L14 57Z" fill="#c8e8f1" />
            <path d="M70 56 Q77 75 98 82 Q89 65 88 56 Q79 52 70 56Z" fill="#3c799d" />
            <path d="M43 33 Q58 27 74 32" stroke="#b7dce9" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".55" />
            <circle cx="46" cy="42" r="2.8" fill="#0b2233" />
            <circle cx="45.3" cy="41.2" r=".8" fill="#fff" />
            <path d="M15 53 Q31 58 40 51" stroke="#0b2233" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
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

function Books() {
  return (
    <div className="sk-books sk-hit" data-hit="chime" data-say="Cảm ơn thầy cô!|Từng trang sách, ngàn tri thức|Tri ân người lái đò" data-burst="✦✧" data-angry="giggle" data-angry-say="Nhẹ tay thôi, sách rơi bây giờ!">
      <svg viewBox="0 0 110 130" role="img" aria-label="Chồng sách tri ân thầy cô">
        <ellipse cx="55" cy="124" rx="47" ry="4" fill="#263b30" opacity=".15" />
        <g transform="rotate(-4 55 111)">
          <rect x="9" y="99" width="91" height="24" rx="5" fill="#357553" />
          <path d="M18 103 H97 V118 H18 Q12 111 18 103Z" fill="#fff4dc" />
          <path d="M22 108 H94 M22 113 H94" stroke="#dccca9" strokeWidth="1.2" />
          <path d="M15 101 V120" stroke="#24563b" strokeWidth="2" />
        </g>
        <g transform="rotate(4 56 91)">
          <rect x="17" y="77" width="85" height="23" rx="4" fill="#d95568" />
          <path d="M22 81 H92 Q88 88 92 96 H22Z" fill="#fff8e9" />
          <path d="M25 86 H87 M25 91 H87" stroke="#e4d4b4" strokeWidth="1.2" />
          <path d="M38 79 V96 L43 92 L48 96 V79" fill="#e6b84f" />
        </g>
        <g transform="rotate(-5 53 69)">
          <rect x="8" y="57" width="88" height="23" rx="4" fill="#557b9e" />
          <path d="M17 61 H93 V76 H17 Q12 69 17 61Z" fill="#fff4dc" />
          <path d="M21 66 H89 M21 71 H89" stroke="#dccca9" strokeWidth="1.2" />
          <path d="M14 60 V77" stroke="#3b5e7e" strokeWidth="2" />
        </g>
        <path d="M9 27 Q32 20 55 33 Q78 20 101 27 L98 59 Q77 54 55 66 Q33 54 12 59Z" fill="#d5a44a" stroke="#a47c35" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13 22 Q34 18 55 31 Q76 18 97 22 L95 54 Q76 51 55 62 Q34 51 15 54Z" fill="#fff8e9" />
        <path d="M55 31 V62" stroke="#d8c49b" strokeWidth="1.5" />
        <path d="M21 31 Q35 30 47 37 M21 38 Q35 37 47 44 M22 45 Q35 44 47 51 M63 37 Q76 30 89 31 M63 44 Q76 37 89 38 M63 51 Q76 44 88 45" fill="none" stroke="#d8c49b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="sk-thanks">Tri ân thầy cô</span>
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
    </>
  );
}

function Hearts() {
  return (
    <div className="sk-heart-big sk-hit" data-hit="kiss" data-say="Chụt!|Thương bạn nhiều~|Học chăm là đáng yêu nhất" data-burst="♥♡" data-explode-at="10" data-combo-window="1500" data-explode-say="Bùm! Mưa trái tim dành cho bạn!">
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

function Squirrel() {
  return (
    <div className="sk-critter sk-critter-soc sk-hit" data-hit="crunch" data-say="Rộp rộp… hạt sồi ngon!|Cất hạt cho mùa đông|Bạn ăn không?" data-angry="eek" data-angry-say="Đừng lấy hạt của tớ!" data-burst="🌰">
      <svg viewBox="0 0 92 83" aria-hidden="true">
        <ellipse cx="44" cy="77" rx="30" ry="4" fill="#263B2E" opacity=".22" />
        <g className="sk-soc-tail">
          <path d="M49 67C60 69 68 57 71 46C74 36 70 26 64 25C69 32 62 40 54 37C44 34 41 24 46 16C52 6 65 5 75 13C89 23 90 47 82 63C75 77 62 79 51 73Z" fill="#AA573A" stroke="#683D34" strokeWidth="2" strokeLinejoin="round" />
          <path d="M48 20C52 11 63 8 73 16C83 24 86 38 82 50C83 36 74 20 65 19C58 17 54 19 51 25Z" fill="#D58962" />
          <path d="M54 34Q62 35 64 28M72 64Q82 50 79 38M65 71Q73 66 75 60" fill="none" stroke="#864330" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <path d="M29 62Q19 69 24 75Q31 78 40 75L42 67Z" fill="#A55A40" stroke="#683D34" strokeWidth="1.8" />
        <path d="M27 44Q34 39 42 42C52 46 60 55 58 66Q55 76 39 76Q22 77 23 61Q23 51 27 44Z" fill="#D58556" stroke="#683D34" strokeWidth="2" />
        <path d="M28 47Q35 46 38 53Q32 63 39 72Q28 75 25 66Q24 56 28 47Z" fill="#FFE4C2" />
        <path d="M50 63Q46 67 39 68Q34 69 32 73Q33 77 45 77Q55 77 57 70" fill="#D58A60" stroke="#683D34" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M37 73L36 76M42 73L41 76" stroke="#A86348" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M30 21Q27 12 35 8Q39 7 39 12Q40 17 36 22Z" fill="#AB6049" stroke="#683D34" strokeWidth="1.7" />
        <path d="M20 23Q13 19 14 9Q15 6 19 8Q26 12 27 20Z" fill="#D58556" stroke="#683D34" strokeWidth="1.8" />
        <path d="M18 12Q23 14 23 19L20 21Q17 18 18 12Z" fill="#E8A192" />
        <path d="M19 21Q31 16 40 24Q47 30 41 40Q36 47 23 46Q12 46 8 39Q7 35 12 33Q12 25 19 21Z" fill="#D58556" stroke="#683D34" strokeWidth="2" />
        <path d="M10 37Q20 38 25 32Q31 30 35 35Q39 42 31 45Q16 47 10 40Z" fill="#FFE4C2" />
        <path d="M17 25Q22 21 29 22" fill="none" stroke="#F1B98C" strokeWidth="1.7" strokeLinecap="round" />
        <g className="sk-soc-eye">
          <ellipse cx="24" cy="30" rx="4" ry="4.7" fill="#342824" />
          <circle cx="23" cy="28.7" r="1.25" fill="#FFF8EB" />
        </g>
        <path d="M8 36Q10 34 14 35Q14 38 11 39Q9 38 8 36Z" fill="#412C28" />
        <ellipse cx="28" cy="37" rx="3.4" ry="1.9" fill="#E99580" />
        <path d="M13 40Q17 43 20 40" fill="none" stroke="#763F34" strokeWidth="1.35" strokeLinecap="round" />
        <g className="sk-soc-snack">
          <path d="M15 47Q22 43 29 48Q31 57 24 62Q18 60 15 55Z" fill="#A95E34" stroke="#62382C" strokeWidth="1.5" />
          <path d="M18 50Q18 56 22 58" fill="none" stroke="#D59354" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 50Q13 44 20 43Q28 42 31 48Q24 52 14 50Z" fill="#794C37" stroke="#59342C" strokeWidth="1.5" />
          <path d="M21 43Q20 40 23 39M17 47L18 45M21 48L23 45M26 48L27 46" fill="none" stroke="#B08060" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M32 49Q29 52 24 53Q21 54 23 57Q26 60 32 56Q37 53 36 50" fill="#DA9168" stroke="#8A4E3A" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function Stork() {
  return (
    <div className="sk-critter sk-critter-co sk-hit" data-hit="whoosh" data-say="Cò bay lả bay la~|Đồng lúa chín vàng rồi|Tìm cá đây" data-angry="honk" data-angry-say="Cò đi mách mẹ đây!" data-burst="✦" data-dur="1700">
      <svg viewBox="0 0 124 114" aria-hidden="true">
        <ellipse className="sk-co-shadow" cx="63" cy="109" rx="23" ry="3" fill="#44564B" opacity=".24" />
        <g className="sk-co-body">
          <g className="sk-co-wings sk-co-wing-far">
            <path d="M56 59C60 43 68 29 78 17Q87 9 96 6L92 16L102 12Q99 22 91 28L97 26Q91 39 76 47L66 61Z" fill="#CBD9D2" stroke="#61746D" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M63 52Q72 34 91 24M71 51Q80 42 85 36" fill="none" stroke="#9BAD9F" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g className="sk-co-leg sk-co-leg-far">
              <path d="M54 68L51 86L56 105M56 105L65 106M56 105L51 108" stroke="#9C7049" strokeWidth="1.9" />
            </g>
            <g className="sk-co-leg sk-co-leg-near">
              <path d="M65 69L65 88L70 106M70 106L81 108M70 106L66 110" stroke="#B07942" strokeWidth="2.3" />
            </g>
          </g>
          <path d="M30 58Q43 48 62 49Q76 49 82 59Q85 69 73 74Q52 83 32 70L17 69L23 65L13 61Q24 61 30 58Z" fill="#FFFCF2" stroke="#61746D" strokeWidth="2" strokeLinejoin="round" />
          <path d="M24 65Q43 68 55 71Q68 73 78 69Q74 76 61 77Q41 79 29 69Z" fill="#D9E3D9" />
          <g className="sk-co-neck">
            <path d="M68 59Q80 52 79 43Q78 37 74 33Q68 26 73 20Q78 14 87 16Q96 17 98 24Q98 30 91 32L83 31Q80 32 84 38Q93 50 83 65Q77 72 68 68Z" fill="#FFFCF2" stroke="#61746D" strokeWidth="2" strokeLinejoin="round" />
            <path d="M80 29Q77 33 81 40Q87 51 78 62Q75 65 70 66Q79 69 83 61Q89 50 84 42Q81 36 83 32Z" fill="#D9E3D9" />
            <path d="M92 23L121 26L92 31Q90 27 92 23Z" fill="#D79A4E" stroke="#9C7049" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M94 27L115 26" stroke="#A66B3B" strokeWidth=".9" strokeLinecap="round" />
            <path d="M79 19Q84 18 88 20" fill="none" stroke="#CEDAD1" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="88" cy="23" r="2.5" fill="#374544" />
            <circle cx="88.6" cy="22.4" r=".7" fill="#FFFDF7" />
          </g>
          <g className="sk-co-folded-wing">
            <path d="M67 56Q57 51 46 55Q38 59 31 64Q41 65 45 64L40 68Q55 73 67 64Q71 60 67 56Z" fill="#ECF1E9" stroke="#82958A" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M45 65Q56 66 63 61M51 59Q56 57 61 58" fill="none" stroke="#B5C6BC" strokeWidth="1.45" strokeLinecap="round" />
          </g>
          <g className="sk-co-wings sk-co-wing-near">
            <path d="M66 62C55 61 44 52 35 43Q21 30 8 29Q13 24 22 25L11 18Q20 15 30 21L21 12Q36 13 46 24Q60 37 68 55Z" fill="#FFFCF2" stroke="#61746D" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M16 28Q31 28 43 42Q52 53 63 56Q54 55 45 49Q30 35 16 28Z" fill="#D5DFD8" />
            <path d="M23 22Q35 25 44 35M32 20Q46 28 54 41M35 39Q43 48 53 52" fill="none" stroke="#9FB2A7" strokeWidth="1.45" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Critter({ kind }) {
  const items = {
    cua: { hit: 'snap', say: 'Kẹp kẹp!|Đi ngang cho nhanh|Biển chiều đẹp ghê', angry: 'snap', angrySay: 'Kẹp cho một cái giờ!', burst: '🫧', svg: <svg viewBox="0 0 70 44"><ellipse cx="35" cy="28" rx="20" ry="12" fill="#e2553a" /><path className="sk-claw-l" d="M16 22 Q2 18 4 6 Q10 12 14 8 Q12 16 18 20" fill="#e2553a" /><path className="sk-claw-r" d="M54 22 Q68 18 66 6 Q60 12 56 8 Q58 16 52 20" fill="#e2553a" /><path d="M18 34 L8 42 M24 38 L18 44 M52 34 L62 42 M46 38 L52 44" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" /><circle cx="29" cy="16" r="4" fill="#fff" /><circle cx="41" cy="16" r="4" fill="#fff" /><circle cx="29" cy="16" r="2" fill="#111" /><circle cx="41" cy="16" r="2" fill="#111" /></svg> },
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
      <div className="sk-corgi-runner">
        <span className="sk-ball" aria-hidden="true" />
        <div className="sk-hit sk-corgi-hit" data-hit="bark" data-hover="sniff" data-say="Gâu gâu!|Ném bóng đi mà~|Bạn học giỏi quá, gâu!" data-burst="♥🦴" data-angry="giggle" data-angry-say="Xoa bụng tớ đi!" data-alt="1" data-alt-sound="sniff" data-alt-say="Hít hít… mùi bánh quy!" data-dur="1800">
          <svg viewBox="0 0 108 66" aria-hidden="true">
            <g className="sk-corgi-tail">
              <path d="M85 38Q95 28 104 28Q106 39 91 45Z" fill="#E69C52" stroke="#8B5033" strokeWidth="2" strokeLinejoin="round" />
              <path d="M98 30L103 29Q104 34 100 38Q97 36 98 30Z" fill="#FFEBD0" />
            </g>
            <g fill="#E9BE95" stroke="#8B5033" strokeWidth="1.7" strokeLinejoin="round">
              <path className="sk-corgi-leg sk-corgi-leg-offset" d="M31 46H39L39 57Q38 61 30 59Q27 59 29 55Z" />
              <path className="sk-corgi-leg" d="M71 45H80L78 57Q77 61 69 59Q66 59 68 55Z" />
            </g>
            <path d="M34 34Q45 27 57 31Q68 33 78 31Q91 29 94 40Q97 51 85 55H38Q23 53 24 43Z" fill="#E69C52" stroke="#8B5033" strokeWidth="2" />
            <path d="M34 47Q49 53 65 51Q81 51 91 46Q89 54 82 54H39Z" fill="#FFEBD0" />
            <g fill="#FFEBD0" stroke="#8B5033" strokeWidth="1.7" strokeLinejoin="round">
              <path className="sk-corgi-leg" d="M42 49H50L50 61Q49 64 40 63Q37 63 39 59Z" />
              <path className="sk-corgi-leg sk-corgi-leg-offset" d="M81 49L89 47L88 60Q87 64 79 63Q75 63 77 59Z" />
            </g>
            <path d="M29 35Q43 38 46 49L39 55Q26 52 24 44Z" fill="#FFF5E4" />
            <path d="M29 39L43 44" stroke="#368482" strokeWidth="4" strokeLinecap="round" />
            <circle cx="36" cy="44" r="2.3" fill="#F6C456" stroke="#997439" />
            <path d="M15 26Q10 17 11 7Q11 4 14 5L27 16L32 16L42 4Q45 2 46 6Q49 17 42 28Z" fill="#E69C52" stroke="#8B5033" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 10L22 18L16 21ZM43 8Q45 15 40 21L35 17Z" fill="#E98B82" />
            <path d="M12 26Q17 16 30 16Q41 16 45 28Q49 39 34 43Q23 46 13 41Q7 39 6 34Q5 30 12 26Z" fill="#E69C52" stroke="#8B5033" strokeWidth="2" />
            <path d="M26 17Q28 25 23 29Q19 32 21 34Q29 36 36 32Q39 37 35 41Q23 45 13 40Q7 38 7 34Q8 30 15 30Q21 29 21 21Z" fill="#FFF5E4" />
            <ellipse cx="32" cy="27" rx="2.5" ry="3" fill="#33241E" />
            <circle cx="31.5" cy="26" r=".8" fill="#FFF5E4" />
            <path d="M6 32Q9 29 13 31Q14 34 10 35Q6 35 6 32Z" fill="#33241E" />
            <path d="M14 36Q20 40 28 35Q29 42 22 43Q17 42 14 36Z" fill="#664134" />
            <path d="M19 40Q21 38 26 39Q27 44 23 45Q20 45 19 40Z" fill="#F58B8D" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Panda() {
  return (
    <div className="sk-panda sk-hit" data-hit="giggle" data-hover="crunch" data-say="Măm măm tre non|Lăn một vòng nè!|Ngủ trưa xíu đã…" data-burst="🎋" data-angry="boing" data-angry-say="Gấu trúc dỗi, không chơi nữa!" data-dur="1600">
      <svg viewBox="0 0 88 86" aria-hidden="true">
        <path d="M24 46Q39 40 54 46Q65 51 65 66Q65 79 40 79Q15 79 15 66Q15 54 24 46Z" fill="#FFFCF5" stroke="#262C32" strokeWidth="2" />
        <path d="M22 63Q24 74 40 74Q55 74 60 64V70Q57 77 40 78Q22 78 20 70Z" fill="#E1E5E1" />
        <path d="M20 49Q11 49 10 58Q10 65 16 66Q22 66 26 56Z" fill="#262C32" />
        <ellipse cx="22" cy="72" rx="9" ry="10" transform="rotate(-26 22 72)" fill="#262C32" />
        <ellipse cx="57" cy="72" rx="9" ry="10" transform="rotate(26 57 72)" fill="#262C32" />
        <ellipse cx="22" cy="73" rx="4.5" ry="3.5" fill="#626A70" />
        <ellipse cx="57" cy="73" rx="4.5" ry="3.5" fill="#626A70" />
        <circle cx="19" cy="16" r="10" fill="#262C32" />
        <circle cx="61" cy="16" r="10" fill="#262C32" />
        <circle cx="18" cy="15" r="5.5" fill="#626A70" />
        <circle cx="62" cy="15" r="5.5" fill="#626A70" />
        <path d="M40 13C56 13 67 23 67 35S55 51 40 51S13 46 13 35S24 13 40 13Z" fill="#FFFCF5" stroke="#262C32" strokeWidth="2" />
        <ellipse cx="29" cy="32" rx="7.5" ry="10" transform="rotate(30 29 32)" fill="#262C32" />
        <ellipse cx="51" cy="32" rx="7.5" ry="10" transform="rotate(-30 51 32)" fill="#262C32" />
        <circle cx="30" cy="31" r="3.5" fill="#FFFCF5" />
        <circle cx="50" cy="31" r="3.5" fill="#FFFCF5" />
        <circle cx="31" cy="32" r="1.8" fill="#262C32" />
        <circle cx="51" cy="32" r="1.8" fill="#262C32" />
        <g className="sk-panda-blush" fill="#F4A5B1">
          <ellipse cx="22" cy="42" rx="4.2" ry="2.4" />
          <ellipse cx="58" cy="42" rx="4.2" ry="2.4" />
        </g>
        <ellipse cx="40" cy="37" rx="4" ry="2.5" fill="#262C32" />
        <ellipse className="sk-panda-mouth" cx="40" cy="43" rx="4.5" ry="2.5" fill="#262C32" />
        <g className="sk-bamboo-snack">
          <path d="M61 56Q61 45 74 41Q75 52 61 56ZM65 62Q70 53 83 55Q77 64 65 62Z" fill="#5BA44D" />
          <path d="M48 47L72 70" stroke="#438348" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 47L72 70" stroke="#95C75F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M54 55L57 52M65 65L68 62" stroke="#438348" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50 54Q53 49 59 52Q64 56 61 60Q58 65 52 62Q48 59 50 54Z" fill="#262C32" />
          <path d="M53 55L55 53M56 57L58 55" stroke="#626A70" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function Dino() {
  return (
    <div className="sk-dino">
      <div className="sk-hit sk-dino-hit" data-hit="roar" data-say="RAWRRR! (thật ra tớ hiền lắm)|Tay ngắn nhưng học giỏi!|Khủng long cũng phải học từ vựng" data-burst="💥" data-angry="stomp" data-angry-say="Dậm chân cho đất rung nè!" data-alt="1" data-alt-sound="giggle" data-alt-say="Tớ không với tới bàn phím…" data-dur="1500">
        <svg viewBox="0 0 96 72" aria-hidden="true">
          <path className="sk-dino-leg sk-dino-leg-far" d="M55 46Q64 45 64 53L61 60L65 64Q67 67 64 67H54Q51 67 52 64L55 57Z" fill="#437e38" />
          <path d="M34 35Q41 24 50 31Q55 33 62 41Q72 50 94 37Q88 48 77 52Q68 56 60 54Q55 61 45 60Q34 59 31 50Q29 43 34 35Z" fill="#6bbf3a" />
          <path d="M34 39Q35 50 45 52Q52 55 59 54Q54 61 45 60Q34 59 31 50Q29 44 34 39Z" fill="#b8dc6c" />
          <path className="sk-dino-leg" d="M46 47Q55 44 57 51Q59 56 52 60L51 65Q51 69 47 69H37Q34 69 35 66Q36 63 42 63L44 57Q40 53 46 47Z" fill="#529d35" />
          <path d="M8 22Q6 17 10 14Q15 10 25 10Q34 6 43 11Q51 15 49 26Q48 34 39 38Q30 42 17 40Q11 40 10 35Z" fill="#6bbf3a" />
          <path d="M10 33Q20 39 38 31Q34 41 18 40Q12 40 10 35Z" fill="#9dd65b" />
          <path d="M9 26Q23 30 39 24Q36 33 20 34Q12 34 10 31Z" fill="#2f5d1e" />
          <path d="M13 27L17 28L15 31Z M20 28H24L22 32Z M28 28L32 27L30 31Z" fill="#fff4d4" />
          <circle cx="32" cy="18" r="4" fill="#fff" />
          <circle cx="31" cy="18" r="2" fill="#182816" />
          <circle cx="14" cy="20" r="1.3" fill="#2f5d1e" />
          <path d="M34 40L30 44L26 42M41 42L37 46L32 45M33 45L31 48" fill="none" stroke="#437e38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 36L48 41M56 40L54 44M62 44L61 47" fill="none" stroke="#529d35" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function WalkingRobot() {
  return (
    <div className="sk-robot-route">
      <div className="sk-robot-walker">
        <button type="button" className="sk-robot sk-hit" aria-label="Tương tác với robot tuần tra"
          data-hit="beep" data-say="Bíp bíp! Chào bạn!|Cùng ôn thêm 5 từ nhé!|Tớ đang tuần tra kho từ vựng!"
          data-burst="⚡✦" data-alt="1" data-alt-sound="giggle" data-alt-say="Xem tớ nhảy nè! Bíp, bốp!" data-dur="2400">
          <svg viewBox="0 0 86 89" fill="none" aria-hidden="true">
            <ellipse cx="43" cy="85" rx="26" ry="4" fill="#273142" opacity=".28" />
            <g className="sk-robot-foot sk-robot-foot-back">
              <path d="M32 66L29 78" stroke="#42627C" strokeWidth="7" strokeLinecap="round" />
              <path d="M24 78H34L38 84H21V81Z" fill="#365976" stroke="#263F57" strokeWidth="2" strokeLinejoin="round" />
            </g>
            <g className="sk-robot-foot">
              <path d="M53 67L55 79" stroke="#527891" strokeWidth="7" strokeLinecap="round" />
              <path d="M51 78H61L66 84H48V81Z" fill="#49758D" stroke="#263F57" strokeWidth="2" strokeLinejoin="round" />
            </g>
            <path d="M24 42L12 48L15 56" stroke="#43647D" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="21" y="35" width="43" height="37" rx="12" fill="#F3B84F" stroke="#794F2C" strokeWidth="2.4" />
            <path d="M27 62C29 71 55 71 59 61" fill="#D58A37" />
            <path d="M29 54H41V64H29Z" fill="#415876" />
            <path d="M32 57H38M32 60H38" stroke="#B3D9E3" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="51" cy="58" r="3" fill="#BFEFF2" stroke="#597F83" />
            <g className="sk-robot-wave">
              <path d="M62 44L72 49L77 42" stroke="#43647D" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M74 39L76 35M79 41L82 38" stroke="#5995A8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="62" cy="44" r="4" fill="#75CED4" stroke="#43647D" strokeWidth="1.6" />
            </g>
            <path d="M54 18L62 10" stroke="#42627C" strokeWidth="3" />
            <circle cx="63" cy="9" r="4" fill="#FA6D66" stroke="#8A414C" strokeWidth="1.3" />
            <rect x="16" y="17" width="57" height="31" rx="12" fill="#73C9CC" stroke="#2E626E" strokeWidth="2.5" />
            <path d="M24 25Q29 21 39 21" stroke="#BCF3EE" strokeWidth="2" strokeLinecap="round" />
            <rect x="24" y="24" width="42" height="17" rx="8" fill="#243B55" />
            <path d="M35 29V35M53 29V35" stroke="#C6FFF7" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M42 34Q44 37 47 34" stroke="#8FEAE4" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Balloons() {
  const colors = ['#ff5a7a', '#ffcd3c', '#4fb3ff', '#6bd58a', '#b77dff'];
  return (
    <div className="sk-balloons">
      {colors.map((c, i) => (
        <div key={c} className="sk-balloon sk-hit" style={{ '--i': i, '--c': c }} data-hit="pop" data-say="Bụp!|Pằng!|Vui quá đi!" data-burst="✦●" data-dur="3200">
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
  'rung-thong': W(() => <Landscape kind="thong" />, Squirrel),
  'bien-chieu': W(() => <Landscape kind="bien" />, () => <Critter kind="cua" />),
  'ruong-bac-thang': W(() => <Landscape kind="ruong" />, Stork),
  'pho-hoi': W(null, () => <Lanterns />),
  'meo-luoi': W(null, Cat),
  'canh-cut': W(() => <Landscape kind="bang" />, Penguin),
  'nhen-du-to': W(null, Spider),
  'rong': W(null, Dragon),
  'dai-duong': W(null, Dolphin),
  'rap-chieu': W(() => <><div className="sk-beam" /><div className="sk-film sk-film-l" /><div className="sk-film sk-film-r" /></>, Projector),
  'tham-tu': W(() => <><div className="sk-blinds" /><Lamp /></>, Magnifier),
  'pixel': W(() => <div className="sk-ground" />, Pixel),
  'muc-ninja': W(() => <><div className="sk-bamboo sk-bamboo-l" /><div className="sk-bamboo sk-bamboo-r" /></>, Shuriken),
  'muc-phi-hanh-gia': W(() => <div className="sk-planet" />, Rocket),
  'tet': W(null, () => <><Blossom kind="mai" /><Blossom kind="dao" /></>),
  'valentine': W(null, Hearts),
  'trung-thu': W(Moon, () => <Lanterns star />),
  'nha-giao': W(null, Books),
  'halloween': W(null, () => <><Pumpkins /><Spider /></>),
  'noel': W(() => <Landscape kind="tuyet" />, Lights),
  'mua-thu': W(() => <Landscape kind="thu" />, () => <Critter kind="la" />),
  'hoa-anh-dao': W(() => <Landscape kind="nui" />, () => <Blossom kind="sakura" bird />),
  'cho-corgi': W(() => <Landscape kind="co" />, Corgi),
  'gau-truc': W(() => <div className="sk-bamboo sk-bamboo-r" />, Panda),
  'khung-long': W(() => <Landscape kind="nui" />, Dino),
  'robot': W(() => <div className="sk-grid" />, WalkingRobot),
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
      <svg className="costume-witch" viewBox="0 0 100 70"><path d="M20 56 L56 2 L66 14 L74 56 Z" fill="#3c2a5a" /><ellipse cx="50" cy="58" rx="46" ry="9" fill="#2c1f45" /><rect x="26" y="46" width="48" height="7" fill="#f38a2a" /></svg>
      <svg className="costume-tet" viewBox="0 0 60 60">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="30" cy="20" rx="8" ry="11" fill="#f7c531" transform={`rotate(${a} 30 30)`} />)}<circle cx="30" cy="30" r="5" fill="#d1392b" /></svg>
      <svg className="costume-lantern" viewBox="0 0 60 90"><path d="M30 0 L30 30" stroke="#7a3b12" strokeWidth="3" /><path d="M30 30 L36 46 L54 46 L40 56 L45 74 L30 63 L15 74 L20 56 L6 46 L24 46 Z" fill="#ffcd3c" stroke="#d1392b" strokeWidth="2" strokeLinejoin="round" /></svg>
    </span>
  );
}
