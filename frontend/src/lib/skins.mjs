export const DEFAULT_SKIN = 'MAC_DINH';

export const SKIN_GROUPS = [
  { key: 'CO_BAN', label: 'Cơ bản' },
  { key: 'PHONG_CANH', label: 'Phong cảnh' },
  { key: 'DONG_VAT', label: 'Động vật' },
  { key: 'DIEN_ANH', label: 'Điện ảnh' },
  { key: 'NHAN_VAT', label: 'Nhân vật' },
  { key: 'LE_HOI', label: 'Lễ hội' },
];

export const SKIN_FX = {
  MAC_DINH: {},
  BANG_XANH: { particles: 'dust', count: 10 },
  RUNG_THONG: { particles: 'mist', count: 4 },
  BIEN_CHIEU: { particles: 'gull', count: 3 },
  RUONG_BAC_THANG: { particles: 'cloud', count: 4 },
  PHO_HOI: { particles: 'glow', count: 10 },
  MEO_LUOI: { particles: 'paw', count: 6, costume: false },
  CANH_CUT: { particles: 'snow', count: 16 },
  NHEN_DU_TO: { particles: 'dust', count: 8 },
  RONG: { particles: 'cloud', count: 4 },
  DAI_DUONG: { particles: 'bubble', count: 14 },
  RAP_CHIEU: { particles: 'grain', count: 10 },
  THAM_TU: { particles: 'rain', count: 22 },
  PIXEL: { particles: 'pixel', count: 10 },
  MUC_NINJA: { particles: 'leaf', count: 10, costume: 'ninja' },
  MUC_PHI_HANH_GIA: { particles: 'star', count: 22, costume: 'astro' },
  TET: { particles: 'petal', count: 16, costume: 'tet' },
  VALENTINE: { particles: 'heart', count: 12 },
  TRUNG_THU: { particles: 'star', count: 14, costume: 'lantern' },
  NHA_GIAO: { particles: 'petal', count: 10 },
  HALLOWEEN: { particles: 'bat', count: 6, costume: 'witch' },
  NOEL: { particles: 'snow', count: 22, costume: 'santa' },
  MUA_THU: { particles: 'leaf', count: 18 },
  HOA_ANH_DAO: { particles: 'petal', count: 18 },
  CHO_CORGI: { particles: 'paw', count: 6 },
  GAU_TRUC: { particles: 'leaf', count: 8 },
  KHUNG_LONG: { particles: 'cloud', count: 3 },
  ROBOT: { particles: 'grain', count: 12, costume: 'robot' },
  THIEU_NHI: { particles: 'balloon', count: 10, costume: 'party' },
  PHU_NU: { particles: 'petal', count: 14 },
};

export function skinSlug(code) {
  return String(code || DEFAULT_SKIN).toLowerCase().replace(/_/g, '-');
}

export function skinCode(slug) {
  return String(slug || 'mac-dinh').toUpperCase().replace(/-/g, '_');
}

export function skinFx(code) {
  return SKIN_FX[code] || {};
}

function hash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function particleStyles(count, seed = 1) {
  return Array.from({ length: count }, (_, i) => ({
    '--x': `${Math.round(hash(i + seed) * 1000) / 10}%`,
    '--y': `${Math.round(hash(i * 3 + seed) * 1000) / 10}%`,
    '--d': `${-Math.round(hash(i * 7 + seed) * 200) / 10}s`,
    '--t': `${Math.round((9 + hash(i * 11 + seed) * 12) * 10) / 10}s`,
    '--s': `${Math.round((0.6 + hash(i * 13 + seed) * 0.8) * 100) / 100}`,
    '--r': `${Math.round(hash(i * 17 + seed) * 360)}deg`,
  }));
}

export function groupThemes(list = []) {
  return SKIN_GROUPS.map(group => ({ ...group, items: list.filter(item => item.nhom === group.key) })).filter(group => group.items.length);
}

export function formatDay(value) {
  if (!value) return '';
  const [, m, d] = String(value).split('-');
  return `${d}/${m}`;
}
