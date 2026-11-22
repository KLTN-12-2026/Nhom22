export const DECK_FIELD = { ten: 'Tên bộ', moTa: 'Mô tả', chuDe: 'Chủ đề', trinhDo: 'Trình độ', mucTieu: 'Mục tiêu' };

export const CARD_FIELD = {
  tu: 'Từ', tuLoai: 'Từ loại', phienAm: 'Phiên âm', nghiaVi: 'Nghĩa', viDuEn: 'Ví dụ', dichVi: 'Dịch ví dụ', doKho: 'Độ khó', nguon: 'Nguồn',
};

const VALUE = {
  trinhDo: { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' },
  mucTieu: { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' },
};

export const CHANGE_KIND = {
  THEM: { label: 'Thẻ mới', tone: 'add' },
  SUA: { label: 'Đã sửa', tone: 'edit' },
  XOA: { label: 'Đã xóa', tone: 'del' },
};

export function fieldValue(field, value) {
  if (value == null || value === '') return null;
  if (field === 'doKho') return `${value}/5`;
  return VALUE[field]?.[value] || String(value);
}

export function summarize(diff) {
  if (!diff) return [];
  const parts = [];
  if (diff.boThe?.length) parts.push(`${diff.boThe.length} thông tin bộ`);
  if (diff.soThem) parts.push(`${diff.soThem} thẻ mới`);
  if (diff.soSua) parts.push(`${diff.soSua} thẻ sửa`);
  if (diff.soXoa) parts.push(`${diff.soXoa} thẻ xóa`);
  return parts;
}

const tokenize = text => String(text ?? '').split(/(\s+)/).filter(part => part !== '');

export function wordDiff(before, after) {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > 160000) {
    return { before: [{ text: before ?? '', type: 'del' }], after: [{ text: after ?? '', type: 'add' }] };
  }
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const left = [];
  const right = [];
  const push = (list, text, type) => {
    const last = list[list.length - 1];
    if (last && last.type === type) last.text += text;
    else list.push({ text, type });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push(left, a[i], 'same'); push(right, b[j], 'same'); i += 1; j += 1; }
    else if (table[i + 1][j] >= table[i][j + 1]) { push(left, a[i], 'del'); i += 1; }
    else { push(right, b[j], 'add'); j += 1; }
  }
  while (i < a.length) { push(left, a[i], 'del'); i += 1; }
  while (j < b.length) { push(right, b[j], 'add'); j += 1; }
  return { before: joinGaps(left), after: joinGaps(right) };
}

function joinGaps(parts) {
  const out = [];
  parts.forEach((part, index) => {
    const prev = out[out.length - 1];
    const next = parts[index + 1];
    const gap = part.type === 'same' && /^\s+$/.test(part.text) && prev && prev.type !== 'same' && next && next.type === prev.type;
    if (gap || (prev && prev.type === part.type)) prev.text += part.text;
    else out.push({ ...part });
  });
  return out;
}

export function copyChanges(apiFetch, deckId) {
  return apiFetch(`/api/v1/decks/${encodeURIComponent(deckId)}/publish-changes`);
}

export function requestChanges(apiFetch, requestId, admin = false) {
  return apiFetch(`/api/v1/${admin ? 'admin/' : ''}publish-requests/${encodeURIComponent(requestId)}/changes`);
}
