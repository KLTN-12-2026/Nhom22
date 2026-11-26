export function PixelMuc({ tier }) {
  const crowned = tier === 'premium' || tier === 'admin';
  return (
    <span className="muc-svg muc-pixel" aria-hidden="true">
      <svg viewBox="0 0 160 160" fill="none" shapeRendering="crispEdges" focusable="false">
        <path d="M45 145H115V150H45Z" fill="#273461" opacity=".16" />
        <g className="muc-body">
          <g fill="#3549BB">
            <path d="M40 105H60V120H50V130H45V140H35V145H25V130H30V120H35V110H40Z" />
            <path d="M60 115H80V130H75V140H70V150H60V145H55V135H60Z" />
            <path d="M80 115H100V130H105V140H100V150H90V145H85V135H80Z" />
            <path d="M100 105H120V110H125V120H130V130H135V145H125V140H115V130H110V120H100Z" />
          </g>
          <path d="M25 55H35V90H25V85H20V65H25ZM125 55H135V65H140V85H135V90H125Z" fill="#24A5A0" />
          <path d="M60 20H100V25H115V35H125V50H130V95H125V110H115V120H100V125H60V120H45V110H35V95H30V50H35V35H45V25H60Z" fill="#5368DC" />
          <path d="M35 85H40V100H50V110H65V115H95V110H110V100H120V85H125V105H115V115H100V125H60V120H45V110H35Z" fill="#3549BB" />
          {crowned ? (
            <g>
              <path d="M50 20V0H55V5H60V10H65V5H70V0H75V-5H85V0H90V5H95V10H100V5H105V0H110V20Z" fill="#FFD565" />
              <path d="M50 0H55V5H60V10H65V15H55V20H50ZM75-5H85V0H80V10H75Z" fill="#FFF0AD" />
              <path d="M50 20H110V25H50Z" fill="#C38A26" />
              <path d="M55 15H105V20H55Z" fill="#E6AE3E" />
            </g>
          ) : tier === 'pro' ? (
            <path d="M100 0H115V5H110V10H105V15H115V20H110V25H105V30H95V20H100V15H90V10H95V5H100Z" fill="#D5E1EE" />
          ) : (
            <g>
              <path d="M95 5H105V15H100V25H90V15H95Z" fill="#F1B434" />
              <path d="M100 0H105V10H100Z" fill="#FDF6DD" />
            </g>
          )}
          <g className="muc-face">
            <g className="muc-eyes">
              <path d="M50 45H70V50H75V80H70V85H50V80H45V50H50ZM90 45H110V50H115V80H110V85H90V80H85V50H90Z" fill="#FFFCF2" />
              <g className="muc-pupils" fill="#202B50">
                <path d="M60 60H70V80H60ZM90 60H100V80H90Z" />
                <path d="M65 60H70V65H65ZM95 60H100V65H95Z" fill="#FFFFFF" />
              </g>
            </g>
            <path className="muc-brows" d="M45 35H70V40H45ZM90 35H115V40H90Z" fill="#253882" />
            <path d="M35 85H50V90H35ZM110 85H125V90H110Z" fill="#F4AB91" />
            <g className="muc-smile">
              <path d="M65 85H95V95H90V100H70V95H65Z" fill="#202B50" />
              <path d="M70 85H90V90H70Z" fill="#FFFCF2" />
            </g>
            <path className="muc-mouth-open" d="M70 85H90V105H70Z" fill="#202B50" />
            <path className="muc-mouth-soft" d="M65 95V90H70V85H90V90H95V95H85V90H75V95Z" fill="#202B50" />
          </g>
          <path d="M65 105H90V110H95V115H100V130H65Z" fill="#FFF9E8" />
          <path d="M90 105V115H100V110H95V105Z" fill="#F1B434" />
          <path d="M70 115H85V120H70ZM70 125H95V130H70Z" fill="#7D89BD" />
          <g className="muc-arm-left">
            <path d="M20 95H45V115H20V110H15V100H20Z" fill="#5368DC" />
            <path d="M20 100H35V105H20Z" fill="#3549BB" />
          </g>
          <g className="muc-arm-right">
            <path d="M115 95H140V100H145V110H140V115H115Z" fill="#5368DC" />
            <path d="M125 100H140V105H125Z" fill="#3549BB" />
          </g>
        </g>
        <path className="muc-sparks" d="M20 25H25V30H30V35H25V40H20V35H15V30H20ZM135 15H140V20H145V25H140V30H135V25H130V20H135Z" fill="#F1B434" />
      </svg>
    </span>
  );
}
