export const DIRECTIONS = [
  { id: 'ANH_VIET', label: 'Anh → Việt', short: 'A–V', lang: 'en', placeholder: 'Gõ từ tiếng Anh, ví dụ: run' },
  { id: 'VIET_ANH', label: 'Việt → Anh', short: 'V–A', lang: 'vi', placeholder: 'Gõ từ tiếng Việt, có dấu hoặc không dấu: hoc' }
];

export const DICTIONARY_SOURCE = {
  name: 'Free Vietnamese Dictionary Project (FVDP)',
  author: 'Hồ Ngọc Đức và cộng sự',
  license: 'GNU GPL phiên bản 2 trở lên',
  url: 'http://www.informatik.uni-leipzig.de/~duc/Dict/',
  licenseUrl: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
  cardNote: 'Từ điển Anh–Việt FVDP (Hồ Ngọc Đức), GPL'
};

const POS = [
  [/ngoại động từ|nội động từ|động từ|\bverb\b/u, 'v.'],
  [/danh từ|\bnoun\b/u, 'n.'],
  [/tính từ|\badj(ective)?\b/u, 'adj.'],
  [/phó từ|trạng từ|\badv(erb)?\b/u, 'adv.'],
  [/giới từ|\bprep(osition)?\b/u, 'prep.'],
  [/liên từ|\bconj(unction)?\b/u, 'conj.']
];

const VI_POS = { noun: 'danh từ', verb: 'động từ', adj: 'tính từ', adjective: 'tính từ', adv: 'phó từ', adverb: 'phó từ', conj: 'liên từ', pronoun: 'đại từ', excl: 'thán từ', number: 'số từ', prep: 'giới từ' };

export function direction(id) {
  return DIRECTIONS.find(item => item.id === id) || DIRECTIONS[0];
}

export function posLabel(tuLoai) {
  if (!tuLoai) return '';
  const key = tuLoai.trim().toLowerCase();
  return VI_POS[key] || tuLoai.trim();
}

export function cardPos(tuLoai) {
  if (!tuLoai) return '';
  const text = tuLoai.toLowerCase();
  return POS.find(([pattern]) => pattern.test(text))?.[1] || '';
}

export function ipa(phienAm) {
  if (!phienAm) return '';
  const inner = phienAm.trim().replace(/^\/|\/$/gu, '').replace(/'/gu, 'ˈ').replace(/,/gu, 'ˌ').replace(/ɳ/gu, 'ŋ').replace(/:/gu, 'ː');
  return inner ? `/${inner}/` : '';
}

export function senses(entry) {
  const list = [];
  (entry?.noiDung?.nhom || []).forEach((group, g) => {
    (group.nghia || []).forEach((meaning, m) => {
      if (meaning.noiDung) list.push({ key: `${g}-${m}`, tuLoai: group.tuLoai, ...meaning });
    });
  });
  return list;
}

function clip(text, max) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function cardFromSense(entry, sense) {
  const example = sense?.viDu?.find(item => item.cau && item.dich) || sense?.viDu?.[0];
  return {
    tu: clip(entry.tu, 100),
    tuLoai: cardPos(sense?.tuLoai),
    phienAm: clip(ipa(entry.phienAm), 100),
    nghiaVi: clip(sense?.noiDung || entry.tomTat || '', 500),
    viDuEn: clip(example?.cau || '', 300),
    dichVi: clip(example?.dich || '', 300),
    nguon: DICTIONARY_SOURCE.cardNote
  };
}

export function englishTerms(text) {
  return (text || '')
    .split(/[;,]/u)
    .map(part => part.replace(/\([^)]*\)/gu, '').replace(/^\s*to\s+/iu, '').trim())
    .filter(part => part && part.length <= 40 && /^[a-z][a-z' -]*$/iu.test(part));
}

const VI_MARKS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu;

export function hasVietnamese(text) {
  return VI_MARKS.test(text || '');
}

export function foldVi(text) {
  return (text || '').normalize('NFD').replace(/\p{M}+/gu, '').replace(/đ/gu, 'd').replace(/Đ/gu, 'D').toLowerCase().replace(/\s+/gu, ' ').trim();
}

export function bestSense(entry, hint) {
  const list = senses(entry);
  if (!list.length) return null;
  const want = (hint || '').toLowerCase().trim();
  if (!want) return list[0];
  const words = text => text.toLowerCase().split(/[;,()]/u).map(part => part.replace(/^\s*sự\s+/u, '').trim());
  return list.find(sense => words(sense.noiDung).includes(want))
    || list.find(sense => sense.noiDung.toLowerCase().includes(want))
    || list.find(sense => foldVi(sense.noiDung).includes(foldVi(want)))
    || list[0];
}

export const lookupKey = term => ['dictionary-lookup', 'ANH_VIET', term];

export function lookupPath(term, chieu = 'ANH_VIET') {
  return `/api/v1/dictionary/lookup?${new URLSearchParams({ q: term, chieu })}`;
}

export function pickEntry(data, term) {
  const list = data?.ketQua || [];
  return list.find(entry => entry.tu === term) || list.find(entry => entry.tu.toLowerCase() === term.toLowerCase()) || list[0] || null;
}

export function dictionaryHref(q, chieu = 'ANH_VIET') {
  const params = new URLSearchParams({ q });
  if (chieu !== 'ANH_VIET') params.set('chieu', chieu);
  return `/tu-dien?${params}`;
}
