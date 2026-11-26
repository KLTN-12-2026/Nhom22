export function RobotMuc() {
  return (
    <span className="muc-svg muc-robot" aria-hidden="true">
      <svg viewBox="0 0 160 160" fill="none" focusable="false">
        <ellipse cx="80" cy="148" rx="45" ry="5" fill="#152A43" opacity=".24" />
        <g className="muc-body">
          <g stroke="#304A64" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
            <path d="M51 112L45 127L35 138M70 119L66 135L60 144M90 119L94 135L100 144M109 112L115 127L125 138" />
          </g>
          <path d="M51 112L45 127L35 138M70 119L66 135L60 144M90 119L94 135L100 144M109 112L115 127L125 138" stroke="#6885A0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M41 129L47 134M63 135L70 138M97 135L90 138M119 129L113 134" stroke="#A0B6C9" strokeWidth="2" strokeLinecap="round" />

          <rect x="21" y="53" width="23" height="32" rx="9" fill="#395A77" stroke="#243A55" strokeWidth="2" />
          <rect x="116" y="53" width="23" height="32" rx="9" fill="#395A77" stroke="#243A55" strokeWidth="2" />
          <path d="M28 62V76M132 62V76" stroke="#63D9F6" strokeWidth="4" strokeLinecap="round" />
          <path d="M80 14V30" stroke="#6A8AA3" strokeWidth="5" />
          <circle cx="80" cy="11" r="6" fill="#FC676B" stroke="#9A3B53" strokeWidth="1.5" />
          <circle cx="78.5" cy="9.5" r="1.7" fill="#FFE2DD" />
          <path d="M32 58Q35 23 80 22Q125 23 128 58L130 94Q130 125 80 129Q30 125 30 94Z" fill="#A2B9CB" stroke="#314C68" strokeWidth="2.5" />
          <path d="M34 94Q38 116 80 119Q122 116 126 94V105Q118 125 80 127Q42 125 34 105Z" fill="#6986A0" />
          <path d="M44 42Q54 29 76 28" stroke="#E0F0F6" strokeWidth="3" strokeLinecap="round" />
          <path d="M95 29Q112 33 117 43" stroke="#80A0B8" strokeWidth="2" strokeLinecap="round" />

          <rect x="40" y="44" width="80" height="45" rx="17" fill="#142A42" stroke="#577C96" strokeWidth="2" />
          <path d="M47 55Q50 49 58 49H89" stroke="#456782" strokeWidth="1.5" strokeLinecap="round" />
          <g className="muc-face">
            <g className="muc-eyes">
              <g className="muc-pupils" fill="#68E7FF">
                <rect x="53" y="57" width="13" height="17" rx="5" />
                <rect x="94" y="57" width="13" height="17" rx="5" />
                <path d="M57 61H62M98 61H103" stroke="#DBFBFF" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
            <path className="muc-smile" d="M73 77Q80 84 87 77" stroke="#68E7FF" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse className="muc-mouth-open" cx="80" cy="78" rx="6" ry="4" fill="#68E7FF" />
            <path className="muc-mouth-soft" d="M74 80Q80 75 86 80" stroke="#68E7FF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <rect x="60" y="96" width="40" height="19" rx="5" fill="#617F99" stroke="#486781" strokeWidth="1.5" />
          <path d="M66 105H70L73 101L77 110L81 105H88" stroke="#73E4FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="94" cy="105" r="2" fill="#FFD06A" />
          <g fill="#4F6E88">
            <circle cx="44" cy="97" r="2.4" /><circle cx="116" cy="97" r="2.4" />
          </g>

          <g className="muc-arm-left">
            <path d="M42 97L29 102L23 100" stroke="#35546F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 94L18 96L16 102L21 107L27 105" stroke="#A2B9CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="42" cy="97" r="4.5" fill="#73D9EF" stroke="#466B85" strokeWidth="1.5" />
          </g>
          <g className="muc-arm-right">
            <path d="M118 97L131 102L137 100" stroke="#35546F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M137 94L142 96L144 102L139 107L133 105" stroke="#A2B9CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="118" cy="97" r="4.5" fill="#73D9EF" stroke="#466B85" strokeWidth="1.5" />
          </g>
        </g>
        <path className="muc-sparks" d="M22 29v12m-6-6h12m108-9v10m-5-5h10" stroke="#6DDDF6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
