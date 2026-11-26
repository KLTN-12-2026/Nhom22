'use client';
import { useId, useRef } from 'react';
import { useSantaDelivery } from './useSantaDelivery';

export function SantaDelivery() {
  const ref = useRef(null);
  const noteId = useId();
  useSantaDelivery(ref);
  return (
    <div ref={ref} className="sk-christmas-delivery">
      <div className="sk-santa-rider" hidden aria-hidden="true">
        <svg viewBox="0 0 480 210" fill="none">
          <g className="sk-santa-bob">
            <path d="M48 146V173M158 144V173M24 175H174Q202 175 210 156" stroke="#E4C36B" strokeWidth="7" strokeLinecap="round" />
            <path d="M24 114V98Q31 91 41 98L54 123H158V145H42Z" fill="#A8293C" />
            <g transform="translate(180 20)">
              <path d="M95 100Q75 84 75 101Q80 111 102 112" fill="#A66A3E" />
              <g className="sk-santa-leg sk-santa-leg-back" stroke="#84502F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M119 120L108 143L94 153" /><path d="M185 119L201 139L218 147" />
                <path d="M92 154H103M214 149H225" stroke="#3E3030" strokeWidth="7" />
              </g>
              <path d="M101 104C104 86 132 81 162 88L195 96L213 74L228 84L209 116Q199 130 166 128L122 127Q99 124 101 104Z" fill="#B77B4D" />
              <path d="M119 112Q158 127 195 111Q189 129 159 129H128Z" fill="#D9AB78" />
              <g className="sk-santa-leg sk-santa-leg-front" stroke="#A66A3E" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
                <path d="M126 121L141 141L131 157" /><path d="M192 118L181 141L188 157" />
                <path d="M126 159H138M183 159H195" stroke="#3E3030" strokeWidth="7" />
              </g>
              <path d="M210 77L207 57Q219 57 226 70M235 68L249 52Q256 65 246 78" fill="#B77B4D" />
              <path d="M220 67L213 40L202 30M216 50L202 48M213 40L222 29M242 67L249 35L262 23M250 41L264 40M249 35L241 25" stroke="#E1BD8E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M218 67Q230 56 244 68L257 79L275 82Q282 86 274 94L248 98Q233 101 220 88Z" fill="#C28A59" />
              <path d="M252 83Q266 77 276 84Q283 89 274 96H257Z" fill="#E5BA8B" />
              <circle cx="278" cy="86" r="7" fill="#E74755" />
              <circle cx="242" cy="75" r="3" fill="#302B31" /><circle cx="243" cy="74" r="1" fill="#FFF9EE" />
              <path d="M258 93Q265 98 270 92" stroke="#84502F" strokeWidth="2" strokeLinecap="round" />
              <path d="M214 91L224 101" stroke="#D53A42" strokeWidth="7" /><circle cx="220" cy="99" r="4" fill="#FFD366" />
            </g>
            <path d="M188 136L394 117" stroke="#DDBB72" strokeWidth="3" strokeLinecap="round" />
            <path d="M147 80Q280 137 437 107" stroke="#DDBB72" strokeWidth="2" strokeLinecap="round" />
            <g>
              <path d="M61 60C46 68 34 82 38 99Q42 115 65 113Q85 112 84 94Q83 74 70 60L76 52Q68 48 61 52Z" fill="#B76F38" />
              <path d="M53 76Q40 90 48 101" stroke="#D8914D" strokeWidth="4" strokeLinecap="round" />
              <path d="M59 61Q66 63 72 59" stroke="#FFD366" strokeWidth="4" strokeLinecap="round" />
              <path d="M79 104H115V112H79Z" fill="#6D2833" />
              <path d="M96 98L125 98L139 113" stroke="#BD303E" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M138 108L151 113Q157 114 157 120H138L133 114Z" fill="#30313D" />
              <path d="M86 62Q99 55 112 62Q125 73 119 95Q116 105 95 105Q77 105 78 93Q75 75 86 62Z" fill="#E44750" />
              <path d="M80 95Q97 102 118 94" stroke="#FFF5E7" strokeWidth="6" strokeLinecap="round" />
              <path d="M80 88Q100 94 119 87" stroke="#34313B" strokeWidth="6" strokeLinecap="round" />
              <rect x="98" y="86" width="9" height="8" rx="1" stroke="#FFD366" strokeWidth="3" />
              <path d="M110 68L126 81L141 79" stroke="#BF2E3B" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M110 66L127 79L140 77" stroke="#F16162" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M138 74L139 83" stroke="#FFF5E7" strokeWidth="5" strokeLinecap="round" />
              <path d="M142 76Q152 73 154 80Q154 86 145 85L140 82Z" fill="#2F4240" />
              <ellipse cx="101" cy="43" rx="22" ry="21" fill="#F5C4A3" />
              <ellipse cx="84" cy="51" rx="5" ry="6" fill="#EEA687" />
              <path d="M81 45Q86 54 95 54Q111 54 123 46Q125 62 114 71Q101 79 90 70Q80 63 81 45Z" fill="#FFFAF0" />
              <path d="M92 62Q99 72 110 67" stroke="#E9DBCD" strokeWidth="2" strokeLinecap="round" />
              <path d="M104 51Q110 56 117 51" stroke="#9A5147" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M111 46Q104 44 98 52Q106 55 112 50Q118 54 124 50Q120 44 111 46Z" fill="#FFFDF6" />
              <ellipse cx="119" cy="45" rx="5" ry="4" fill="#EFA88E" />
              <ellipse cx="100" cy="45" rx="4.5" ry="2.5" fill="#EC9E88" />
              <circle cx="111" cy="38" r="2.3" fill="#34313B" />
              <path d="M107 34Q111 32 115 34" stroke="#FFF9EE" strokeWidth="2" strokeLinecap="round" />
              <path d="M81 31Q78 11 94 7Q107 4 119 15Q109 12 98 23L120 27L121 32Z" fill="#E44750" />
              <path d="M81 30Q100 24 120 29" stroke="#FFF9EE" strokeWidth="8" strokeLinecap="round" />
              <circle cx="120" cy="15" r="6" fill="#FFF9EE" />
            </g>
            <path d="M22 112H152Q169 112 169 90H192Q198 149 157 153H48Q26 150 22 112Z" fill="#D53B4B" />
            <path d="M23 112H152Q169 112 169 90H192" stroke="#FFD366" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M45 140H151Q171 140 179 122" stroke="#F17875" strokeWidth="3" strokeLinecap="round" />
            <path d="M80 122L83 129L91 130L85 135L87 143L80 139L73 143L75 135L69 130L77 129Z" fill="#FFD366" />
          </g>
        </svg>
      </div>
      <div className="sk-santa-parcel" hidden>
        <button className="sk-santa-open" type="button" aria-label="Mở quà Giáng sinh" aria-expanded="false" aria-controls={noteId}>
          <svg viewBox="0 0 64 72" fill="none" aria-hidden="true">
            <rect x="10" y="31" width="44" height="35" rx="3" fill="#C92E3F" />
            <path d="M12 33H52V40H12Z" fill="#A72336" opacity=".4" />
            <rect x="28" y="31" width="8" height="35" fill="#FFD366" />
            <g className="sk-santa-lid">
              <path d="M32 22Q11 24 12 13Q18 5 32 22Q47 5 53 13Q54 24 32 22Z" fill="#FFD366" />
              <rect x="6" y="22" width="52" height="13" rx="3" fill="#ED4853" />
              <path d="M28 22H36V35H28Z" fill="#FFE28C" />
            </g>
          </svg>
        </button>
        <div id={noteId} className="sk-santa-note" hidden role="status" aria-live="polite">
          <button className="sk-santa-dismiss" type="button" aria-label="Đóng lời chúc Giáng sinh">×</button>
          <span className="sk-santa-note-title">Một món quà từ ông già Noel</span>
          <p className="sk-santa-message" />
        </div>
      </div>
    </div>
  );
}
