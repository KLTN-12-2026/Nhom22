import styles from './BadgeArt.module.css';

const ROSETTE = (() => {
  const points = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 40 : 36;
    const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(46 + r * Math.sin(a)).toFixed(2)}`);
  }
  return points.join(' ');
})();

const STAR = (() => {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 16 : 7;
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(45 + r * Math.sin(a)).toFixed(2)}`);
  }
  return points.join(' ');
})();

const EMBLEM = {
  seedling: (
    <g>
      <path d="M50 60V45" />
      <path d="M50 49c-9 0-13-7-13-12 8 0 13 4 13 12Z" className={styles.solid} />
      <path d="M50 45c0-9 6-15 15-15 0 9-6 15-15 15Z" className={styles.solid} />
      <path d="M38 61h24" />
    </g>
  ),
  flame: (
    <path d="M50 27c6 9 14 13 14 23 0 9-6 14-14 14s-14-5-14-14c0-6 4-10 8-12 0 5 2 8 5 8 0-8-3-13 1-19Z" className={styles.solid} />
  ),
  calendar: (
    <g>
      <rect x="35" y="32" width="30" height="28" rx="3" />
      <path d="M35 40h30M42 28v7M58 28v7" />
      <path d="M43 50l5 5 9-10" />
    </g>
  ),
  cards: (
    <g>
      <rect x="40" y="30" width="24" height="30" rx="3" transform="rotate(10 52 45)" className={styles.soft} />
      <rect x="35" y="31" width="24" height="30" rx="3" className={styles.solid} />
      <path d="M41 40h12M41 46h8" className={styles.cut} />
    </g>
  ),
  pencil: (
    <g>
      <path d="M37 59l20-20 6 6-20 20-8 2Z" className={styles.solid} />
      <path d="M54 42l6 6" className={styles.cut} />
      <path d="M41 31l4 4 8-8" />
    </g>
  ),
  star: <polygon points={STAR} className={styles.solid} />,
  shield: (
    <g>
      <path d="M50 29l14 6v11c0 9-6 15-14 19-8-4-14-10-14-19V35Z" className={styles.solid} />
      <path d="M44 47l5 5 8-9" className={styles.cut} />
    </g>
  )
};

const BY_CODE = {
  BUOC_DAU: ['seedling', 'secondary'],
  CHUOI_3: ['flame', 'favorite'],
  CHUOI_7: ['calendar', 'favorite'],
  ON_100: ['cards', 'primary'],
  LUYEN_10: ['pencil', 'secondary'],
  DIEM_500: ['star', 'accent']
};

const BY_KIND = {
  TONG_LUOT_ON: ['cards', 'primary'],
  CHUOI_NGAY: ['flame', 'favorite'],
  TONG_BAI_LUYEN: ['pencil', 'secondary'],
  TONG_DIEM: ['star', 'accent']
};

export function badgeLook(badge) {
  return BY_CODE[badge?.ma] || BY_KIND[badge?.loaiDieuKien] || ['shield', 'primary'];
}

export function BadgeArt({ badge, earned = true, size = 88, number }) {
  const [emblem, tone] = badgeLook(badge);
  const label = number ?? (badge?.nguong > 1 ? badge.nguong : null);
  return (
    <svg
      className={`${styles.art} ${styles[tone]}${earned ? '' : ` ${styles.locked}`}`}
      viewBox="0 0 100 112"
      width={size}
      height={size * 1.12}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M36 70 26 106l12-6 8 10 8-34Z" className={styles.ribbon} />
      <path d="M64 70l10 36-12-6-8 10-8-34Z" className={styles.ribbon} />
      <polygon points={ROSETTE} className={styles.rosette} />
      <circle cx="50" cy="46" r="29" className={styles.face} />
      <circle cx="50" cy="46" r="25" className={styles.ring} />
      <g className={styles.emblem}>{EMBLEM[emblem]}</g>
      {label !== null && label !== undefined && (
        <g>
          <rect x="30" y="76" width="40" height="15" rx="2" className={styles.band} />
          <text x="50" y="87.5" textAnchor="middle" className={styles.num}>{label}</text>
        </g>
      )}
      {!earned && (
        <g className={styles.lock}>
          <circle cx="80" cy="16" r="12" />
          <rect x="74" y="15" width="12" height="9" rx="1.5" className={styles.lockBody} />
          <path d="M76.5 15v-3a3.5 3.5 0 0 1 7 0v3" className={styles.lockShackle} />
        </g>
      )}
    </svg>
  );
}
