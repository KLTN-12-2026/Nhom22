export const planKey = ['me-plan'];

export const METALS = {
  silver: ['#5b6270', '#eef1f6', '#9aa1ae', '#ffffff', '#4b5160'],
  steel: ['#162466', '#8fb0ff', '#2b44bf', '#e3ebff', '#13205a'],
  gold: ['#6e4a07', '#f6d779', '#b98410', '#fff3c4', '#7a560c'],
  'gold-dark': ['#4a3204', '#c99a2e', '#7a560c', '#f6d779', '#3a2803'],
  white: ['#d9e2ff', '#ffffff', '#c9d5ff', '#ffffff', '#b8c6ff'],
  bronze: ['#5a2f12', '#f0b27a', '#a0522d', '#ffd9b8', '#6b3a17']
};

export const METAL_PATHS = {
  crown: 'M3 8.5 7.5 12 12 4l4.5 8L21 8.5 19.2 18H4.8ZM4.8 19.5h14.4v2H4.8Z',
  bolt: 'M13.5 2 4.5 13.5h6L9.5 22l10-12.5h-6.2Z',
  leaf: 'M20 4C9 4 4 9.5 4 16.5c0 1.3.2 2.4.6 3.5C6.2 13.8 10 10 15 8 10.5 10.8 7.4 14.5 6.2 20.3 7 20.4 7.8 20.5 8.6 20.5 15.2 20.5 20 15 20 4Z',
  shield: 'M12 2 20 5v6.5c0 5-3.4 9.1-8 10.5-4.6-1.4-8-5.5-8-10.5V5Z',
  lock: 'M7 10V7.5a5 5 0 0 1 10 0V10h1.5A1.5 1.5 0 0 1 20 11.5v9A1.5 1.5 0 0 1 18.5 22h-13A1.5 1.5 0 0 1 4 20.5v-9A1.5 1.5 0 0 1 5.5 10Zm2.5 0h5V7.5a2.5 2.5 0 0 0-5 0Z',
  spark: 'M12 1.5 14.2 9.8 22.5 12l-8.3 2.2L12 22.5l-2.2-8.3L1.5 12l8.3-2.2ZM19 2l.8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8Z',
  mic: 'M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Zm-7 9.5h2A5 5 0 0 0 17 11.5h2a7 7 0 0 1-6 6.9V21h3v1.5H8V21h3v-2.6a7 7 0 0 1-6-6.9Z',
  trophy: 'M6 3h12v2h3v3a5 5 0 0 1-4.6 5A6 6 0 0 1 13 16.9V19h3v2.5H8V19h3v-2.1A6 6 0 0 1 7.6 13 5 5 0 0 1 3 8V5h3Zm0 4H5v1a3 3 0 0 0 1.4 2.5A6 6 0 0 1 6 9Zm12 0v2a6 6 0 0 1-.4 1.5A3 3 0 0 0 19 8V7Z',
  medal: 'M7 2h4l1.5 4.2L14 2h4l-3.3 7.2A6.5 6.5 0 1 1 9.3 9.2ZM12 11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 1.8 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 18.8l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4Z',
  star: 'M12 2.2 14.9 8.6l6.9.7-5.2 4.6 1.5 6.8L12 17.2l-6.1 3.5 1.5-6.8-5.2-4.6 6.9-.7Z'
};

export const TIERS = {
  free: { label: 'Free', icon: 'leaf', metal: 'silver', badgeMetal: 'silver', rank: 0, member: 'Free member' },
  pro: { label: 'Pro', icon: 'bolt', metal: 'steel', badgeMetal: 'white', rank: 1, member: 'Pro member' },
  premium: { label: 'Premium', icon: 'crown', metal: 'gold', badgeMetal: 'gold-dark', rank: 2, member: 'Premium member' },
  admin: { label: 'Admin', icon: 'shield', metal: 'gold', badgeMetal: 'gold-dark', rank: 2, member: 'Admin · Premium' }
};

export function tierOf(plan) {
  if (!plan) return null;
  if (plan.quanTri) return 'admin';
  const code = String(plan.goiMa || '').toUpperCase();
  if (code === 'PREMIUM') return 'premium';
  if (code === 'PRO') return 'pro';
  return 'free';
}

export function cardDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function monthYear(value) {
  if (!value) return null;
  const d = new Date(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function upgradeKey(userId) {
  return `vocab:tier:${userId}`;
}

export function metalSound(tier) {
  return tier === 'premium' || tier === 'admin' ? 'metalGold' : 'metal';
}

export function tierFromCode(code) {
  return tierOf(code ? { goiMa: code } : null);
}

export function rosette(R, r, d, steps = 720) {
  const k = (R - r) / r;
  const turns = r / gcd(Math.round(R), Math.round(r));
  const total = Math.PI * 2 * turns;
  let path = '';
  for (let i = 0; i <= steps; i++) {
    const t = (total * i) / steps;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    path += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return path;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
