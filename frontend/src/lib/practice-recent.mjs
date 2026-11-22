export const RECENT_SOURCE = 'VUA_HOC';
export const RECENT_DAYS = 7;
export const RATINGS = [
  { id: 'QUEN', label: 'Quên' },
  { id: 'KHO', label: 'Khó' },
  { id: 'NHO', label: 'Nhớ' },
  { id: 'DE', label: 'Dễ' }
];
export const DEFAULT_RATINGS = ['QUEN', 'KHO', 'DE'];

export function orderRatings(list) {
  const set = new Set(list || []);
  return RATINGS.map(r => r.id).filter(id => set.has(id));
}

export function toggleRating(list, id) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id); else set.add(id);
  return orderRatings([...set]);
}

export function recentPath(ratings) {
  const params = new URLSearchParams();
  orderRatings(ratings).forEach(id => params.append('danhGia', id));
  const query = params.toString();
  return `/api/v1/practice/recent-cards${query ? `?${query}` : ''}`;
}

export function recentTotal(summary) {
  if (!summary?.theoDanhGia) return 0;
  return Object.values(summary.theoDanhGia).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function matchedCount(summary, ratings) {
  if (!summary?.theoDanhGia) return 0;
  return orderRatings(ratings).reduce((sum, id) => sum + (Number(summary.theoDanhGia[id]) || 0), 0);
}

export function initialSource({ nguon, boTheId } = {}) {
  if (nguon === 'SO_TAY') return 'SO_TAY';
  if (boTheId) return `deck:${boTheId}`;
  if (nguon === 'BO_THE') return '';
  return RECENT_SOURCE;
}

export function resolveSource(source, summary, { explicit = false } = {}) {
  if (source !== RECENT_SOURCE || explicit || !summary) return source;
  return recentTotal(summary) > 0 ? source : '';
}

export function practiceBody({ loaiBai, soCau, source, ratings }) {
  if (source === RECENT_SOURCE) {
    return { loaiBai, soCau: Number(soCau), nguon: RECENT_SOURCE, danhGia: orderRatings(ratings) };
  }
  if (source === 'SO_TAY') return { loaiBai, soCau: Number(soCau), nguon: 'SO_TAY' };
  const boTheId = source && source.startsWith('deck:') ? source.slice(5) : null;
  return { loaiBai, soCau: Number(soCau), nguon: 'BO_THE', boTheId };
}
