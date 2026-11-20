const fold = (char) => char.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export function foldText(value = '') {
  return Array.from(String(value)).map(fold).join('');
}

export function highlightParts(text = '', query = '') {
  const source = String(text ?? '');
  const needle = foldText(query.trim());
  if (!needle || !source) return [{ text: source, match: false }];
  const chars = Array.from(source);
  let folded = '';
  const starts = [];
  chars.forEach((char, index) => {
    const value = fold(char);
    for (let i = 0; i < value.length; i++) starts.push(index);
    folded += value;
  });
  const parts = [];
  let cursor = 0;
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const begin = starts[from];
    const end = starts[from + needle.length - 1] + 1;
    if (begin > cursor) parts.push({ text: chars.slice(cursor, begin).join(''), match: false });
    if (end > begin) parts.push({ text: chars.slice(Math.max(begin, cursor), end).join(''), match: true });
    cursor = Math.max(cursor, end);
    from = folded.indexOf(needle, from + needle.length);
  }
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(''), match: false });
  return parts;
}

export function matchPages(pages = [], query = '', limit = 4) {
  const needle = foldText(query.trim());
  if (!needle) return [];
  return pages.filter(page => foldText(page.label).includes(needle)).slice(0, limit);
}

const RECENT_KEY = 'vocab:recent-searches';

export function readRecent() {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecent(term) {
  const value = String(term || '').trim();
  if (!value) return readRecent();
  const next = [value, ...readRecent().filter(item => foldText(item) !== foldText(value))].slice(0, 5);
  try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearRecent() {
  try { window.localStorage.removeItem(RECENT_KEY); } catch {}
  return [];
}
